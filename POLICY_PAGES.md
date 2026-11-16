# Mobile policy pages

The six documents are approved for publication on 17 November 2026. The normal
website build copies frozen policy-release/ HTML and generates four aliases.
It verifies manifest hashes before copying. Nothing here activates app acceptance.
The website/waitlist notice at privacy.html remains separate.

## Replace a source document

1. Replace the relevant Markdown file in content/mobile-policies/ with the newer
   document. Keep its front matter. The file supplies its title, language, version,
   effective date and canonical URL. No HTML or layout edits are needed.
2. Run `npm run build:policies` to regenerate .policy-preview/, or run
   `npm run preview:policies` and refresh the browser after replacing the file.
   The local server rebuilds changed sources automatically on the next request.
3. Run `npm test`. Review the English/Hindi pair after a substantive text change.

The server listens only at http://127.0.0.1:4186/. The root opens the bilingual
support page. The six paths match the requested future public paths. Current
policy alias links inside the sources are resolved to their corresponding version
within this local preview. Four stable current aliases are also generated locally
as exact copies of the highest numbered version for each policy and language.
They return HTML directly, while language links retain the matching version.

The source directory is discovered automatically; filenames are not hardcoded in
the renderer. Each source must have a unique canonical_path. A policy's version
and language must match that path, and both languages of that version must exist.
Support and deletion sources contain English followed by `## हिंदी`; the language
links jump between both readable sections without JavaScript.

## Source format

Use UTF-8 Markdown with flat `key: value` front matter, one leading H1, paragraphs,
headings, simple unordered/ordered lists, bold/emphasis, inline code, Markdown links
and email/HTTPS autolinks. No raw HTML, nested lists, tables or fenced code blocks.
Unsupported blocks fail the build rather than silently discard policy text.
Add and verify renderer support before adopting a new document format.

Policy metadata: page_title, version (privacy-v1 or terms-v1), language (en or hi),
optional publication_status, effective_date (YYYY-MM-DD or not-yet-published), canonical_path.
Support/deletion metadata: page_title, canonical_path (publication_status optional).
Public-facing pages have no draft or review labels. Local-only status lives in
preview-manifest.json and the server configuration, not the document body.
Internal publication_status values never render.
Dates are never invented; the approved source must contain the actual date and
replace its preparation sentence. Updating metadata does not rewrite legal prose.

## Approved publication and future changes

The 2026-11-17 publication handoff supplies final text and supersedes its older
wording gates. Internal audit findings remain unresolved, not public draft labels.
The current sources are copied unchanged from arth-os/apps/arth_os/build/
policy-docs-publication/knowledge/product/launch/hosting/. Their effective date is
17 November 2026. If first publication occurs later, align dates in the source
metadata and prose across EN/HI without backdating. Review language meaning and
obtain the user's release authorization before publication. The preview renderer has no publish option. Production uses the approved frozen
policy-release/ files, never the replaceable source or preview output.

At first publication, freeze the exact final HTML, including its inline layout,
under the four versioned URLs. Include the prepared stable current aliases when publication is authorized.
Do not rebuild previously published versions with a newer template or replace
their source in place. A later material change adds a new version and both
translations; the old accepted HTML stays available at its original URL.
Support and deletion instructions can be updated from their individual sources.

The local preview-manifest.json contains deterministic source and HTML hashes for
review only. These are NOT published-response hashes or an activation manifest.
After publication, verify direct HTTPS 200 text/html responses and hash their
decoded HTTP body bytes. Return those hashes, URLs, approved date and deployment
identity to the app agent. Backend release activation remains a separate action.

The layout uses no JavaScript, cookies, analytics or remote fonts. All colours
are in scripts/policy-page.css, which is embedded deterministically in each page.

The release manifest records expected artifact hashes. Live decoded response
hashes and deployment identity must be verified separately for the app handoff.
Never regenerate published versioned HTML just because source or CSS changes.
New approved operational pages may replace support/deletion artifacts and hashes;
material legal changes need new versioned documents.
