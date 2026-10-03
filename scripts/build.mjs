import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
const urlIndex = process.argv.indexOf("--url");
const suppliedUrl = urlIndex >= 0 ? process.argv[urlIndex + 1] : process.env.SITE_URL;

if (!suppliedUrl) {
  throw new Error("Provide the public site URL with --url or SITE_URL.");
}

const siteUrl = suppliedUrl.replace(/\/$/, "");
const parsed = new URL(siteUrl);
if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
  throw new Error("The public site URL must use HTTPS.");
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const textFiles = [
  "index.html",
  "privacy.html",
  "terms.html",
  "contact.html",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
];

for (const file of textFiles) {
  const source = await readFile(resolve(root, file), "utf8");
  await writeFile(resolve(output, file), source.replaceAll("__SITE_URL__", siteUrl), "utf8");
}

await cp(resolve(root, "assets"), resolve(output, "assets"), { recursive: true });
await writeFile(resolve(output, ".nojekyll"), "", "utf8");

console.log(`Built Riti website for ${siteUrl}`);
