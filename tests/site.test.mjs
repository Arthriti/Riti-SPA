import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const pages = ["index.html", "privacy.html", "terms.html", "contact.html"];

async function read(path) {
  return readFile(new URL(path, root), "utf8");
}

async function activeScripts() {
  const content = (await Promise.all(pages.map(read))).join("\n");
  const paths = [...new Set([...content.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map((match) => match[1]))];
  return Promise.all(paths.map(read));
}

test("public pages contain no builder overlays or third-party trackers", async () => {
  const content = (await Promise.all(pages.map(read))).join("\n");
  const prohibited = ["emergent-overlay", "visual-edit-overlay", "posthog", "session_recording", "x-file-name", "sourceMappingURL=data:", "cdn.tailwindcss.com"];
  prohibited.forEach((token) => assert.equal(content.includes(token), false, token));
});

test("navigation and legal destinations remain real links without JavaScript", async () => {
  const content = await read("index.html");
  for (const target of ["privacy.html", "terms.html", "contact.html"]) {
    assert.ok(content.includes(`href="${target}"`), target);
  }
  const ids = new Set([...content.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const [, fragment] of content.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(fragment), `Missing navigation destination: ${fragment}`);
  }
});

test("the mobile menu declares its accessibility relationship", async () => {
  const content = await read("index.html");
  assert.match(content, /aria-expanded="false"/);
  assert.match(content, /aria-controls="primary-menu"/);
  assert.match(content, /id="primary-menu"/);
});

test("every waitlist CTA opens the approved email draft", async () => {
  for (const page of pages) {
    const content = await read(page);
    const links = [...content.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
      .filter((match) => /join[^<]*waitlist/i.test(match[2]) || /data-waitlist-email/.test(match[0]));
    assert.ok(links.length > 0, `${page} needs a waitlist link`);
    for (const [, href] of links) {
      const url = new URL(href.replaceAll("&amp;", "&"));
      assert.equal(url.protocol, "mailto:", page);
      assert.equal(url.pathname, "level8infection@gmail.com", page);
      assert.equal(url.searchParams.get("subject"), "Join the Riti beta waitlist", page);
      assert.match(url.searchParams.get("body"), /Please add me to the beta waitlist/, page);
    }
    assert.doesNotMatch(content, /data-waitlist-form|type="email"/, page);
  }
});

test("active browser scripts contain no waitlist service or submission code", async () => {
  for (const content of await activeScripts()) {
    assert.doesNotMatch(content, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|waitlistEndpoint|contactEmail/);
  }
});

test("brand assets use the approved dark icon and the landing page has one wordmark", async () => {
  const content = (await Promise.all(pages.map(read))).join("\n");
  assert.doesNotMatch(content, /riti-icon-light|favicon\.png/);
  assert.ok((await stat(new URL("assets/images/riti-icon-dark.png", root))).isFile());
  const landing = await read("index.html");
  assert.equal((landing.match(/<img\b[^>]*riti-wordmark\.png/g) || []).length, 1);
  assert.match(landing, /<link rel="icon" href="assets\/images\/icon-192\.png"/);
});

test("every page has metadata and one main landmark", async () => {
  for (const page of pages) {
    const content = await read(page);
    assert.match(content, /<title>.+<\/title>/s, page);
    assert.match(content, /<meta\s+name="description"/s, page);
    assert.equal((content.match(/<main[ >]/g) || []).length, 1, page);
    assert.match(content, /<link rel="canonical"[^>]*__SITE_URL__/, page);
  }
});

test("the approved landing copy has no em dashes or visitor-facing placeholders", async () => {
  const content = await read("index.html");
  assert.doesNotMatch(content, /—/);
  const visibleMarkup = content.replace(/<template\b[\s\S]*?<\/template>/g, "");
  assert.doesNotMatch(visibleMarkup, /screenshot placeholder|reserved for real|illustrative product concept|codex-preview/i);
});

test("illustration colours remain in CSS", async () => {
  const content = await read("index.html");
  assert.doesNotMatch(content, /<(?:path|circle|rect|ellipse)[^>]+(?:fill|stroke)=["'][^"']+["']/i);
});

test("scroll stories have readable content and reduced-motion fallbacks without choice buttons", async () => {
  const page = await read("index.html");
  assert.match(page, /When work changes\./);
  assert.match(page, /When life asks for more\./);
  assert.match(page, /Without a shared view/);
  assert.match(page, /See what’s available\./);
  assert.doesNotMatch(page, /data-life-choice|data-reserve-choice|data-audience-choice/);
  for (const name of ["lean-story", "reserve-story"]) {
    const script = await read(`assets/js/${name}.js`);
    const css = await read(`assets/css/${name}.css`);
    assert.match(script, /requestAnimationFrame/, name);
    assert.match(script, /prefers-reduced-motion/, name);
    assert.match(css, /prefers-reduced-motion/, name);
  }
});

test("future app screenshot slots are retained in a non-rendered template", async () => {
  const content = await read("index.html");
  const template = content.match(/<template id="future-app-screens">([\s\S]*?)<\/template>/)?.[1];
  assert.ok(template);
  assert.equal((template.match(/data-screenshot-slot=/g) || []).length, 3);
  for (const slot of ["household", "goals", "decisions"]) {
    assert.ok(template.includes(`data-screenshot-slot="${slot}"`), slot);
  }
  assert.doesNotMatch(content.replace(/<template\b[\s\S]*?<\/template>/g, ""), /data-screenshot-slot/);
});

test("every page asset and stylesheet font resolves inside the static site", async () => {
  const stylesheetPaths = new Set();
  for (const page of pages) {
    const content = await read(page);
    for (const [, path] of content.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)) {
      assert.ok((await stat(new URL(path, root))).isFile(), `${page}: ${path}`);
      if (path.endsWith(".css")) stylesheetPaths.add(path);
    }
  }
  for (const path of stylesheetPaths) {
    const css = await read(path);
    for (const [, resource] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      assert.doesNotMatch(resource, /^(?:https?:|\/\/)/, `${path} loads a third-party resource`);
      if (resource.startsWith("data:")) continue;
      const target = new URL(resource, new URL(path, root));
      assert.ok(target.href.startsWith(root.href), `${path}: asset escapes the site`);
      assert.ok((await stat(target)).isFile(), `${path}: ${resource}`);
    }
  }
});
