import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const pages = ["index.html", "privacy.html", "terms.html", "contact.html"];

async function read(path) {
  return readFile(new URL(path, root), "utf8");
}

test("given the public source, when inspected, then builder preview code is absent", async () => {
  const content = (await Promise.all(pages.map(read))).join("\n");
  const prohibited = [
    "emergent-overlay",
    "visual-edit-overlay",
    "posthog",
    "session_recording",
    "x-file-name",
    "sourceMappingURL=data:",
    "cdn.tailwindcss.com",
  ];
  prohibited.forEach((token) => assert.equal(content.includes(token), false, token));
});

test("given the landing page, when read without JavaScript, then navigation and legal links remain real links", async () => {
  const content = await read("index.html");
  ["privacy.html", "terms.html", "contact.html"].forEach((target) => {
    assert.match(content, new RegExp(`href=["']${target.replace("#", "\\#")}["']`));
  });
});

test("given the mobile menu, when enhanced, then its accessibility relationship is declared", async () => {
  const content = await read("index.html");
  assert.match(content, /aria-expanded="false"/);
  assert.match(content, /aria-controls="primary-menu"/);
  assert.match(content, /id="primary-menu"/);
});

test("given a visitor joins the waitlist, when they follow any CTA, then it opens the approved email draft", async () => {
  const content = (await Promise.all(pages.map(read))).join("\n");
  const links = content.match(/href="mailto:level8infection@gmail\.com\?subject=[^"]+"/g) || [];
  assert.equal(links.length, 6);
  links.forEach((link) => {
    assert.match(link, /subject=Join%20the%20Riti%20beta%20waitlist/);
    assert.match(link, /Please%20add%20me%20to%20the%20beta%20waitlist/);
  });
  assert.equal(content.includes("data-waitlist-form"), false);
  assert.equal(content.includes('type="email"'), false);
});

test("given the static site, when inspected, then no waitlist service or browser submission code remains", async () => {
  const content = await read("assets/js/site.js");
  assert.equal(content.includes("fetch("), false);
  assert.equal(content.includes("waitlistEndpoint"), false);
  assert.equal(content.includes("contactEmail"), false);
});

test("given the brand assets, when inspected, then only the dark Riti app icon is used", async () => {
  const content = (await Promise.all(pages.map(read))).join("\n");
  assert.match(content, /assets\/images\/riti-icon-dark\.png/);
  assert.equal(content.includes("riti-icon-light"), false);
  assert.equal(content.includes("favicon.png"), false);
});

test("given every page, when inspected, then metadata and a single main landmark exist", async () => {
  for (const page of pages) {
    const content = await read(page);
    assert.match(content, /<title>.+<\/title>/s, page);
    assert.match(content, /<meta\s+name="description"/s, page);
    assert.equal((content.match(/<main[ >]/g) || []).length, 1, page);
    assert.match(content, /<link rel="canonical"/s, page);
  }
});
