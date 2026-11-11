# Riti website

Static, dependency-free marketing site for the Riti beta waitlist. It is built
for GitHub Pages and intentionally kept separate from the mobile application.

## Waitlist and contact

Waitlist calls to action open a pre-addressed email draft to
`level8infection@gmail.com`. The website does not collect, store, or transmit a
visitor's email address itself. A visitor joins only after they send the draft
from their own email app.

To change the inbox or draft text, update the `mailto:` links in the HTML pages
and keep the privacy notice, terms, contact page, and tests aligned.

## Local verification

From the `Riti-SPA` directory, run:

```powershell
npm test
node scripts/build.mjs --url "http://localhost:4173"
npx serve dist --listen 4173
```

The build has no package dependencies. `npx serve` is only a convenient local
preview command; any static file server may serve `dist/`.

## GitHub Pages

Keep the included `.github/workflows/deploy-pages.yml` file. In the GitHub
repository, open **Settings → Pages** and set the source to **GitHub Actions**.
A push to `main` will test, build, and deploy the site. The workflow obtains the
final Pages base URL automatically and writes correct canonical, Open Graph,
robots, and sitemap URLs into the deployment artifact.

## Privacy posture

The source contains no product analytics, advertising tracker, cookie,
session-replay integration, waitlist service, or browser-side submission code.
Self-hosted copies of DM Sans and Fraunces avoid third-party font requests.
GitHub Pages processes ordinary hosting requests, and email providers process a
waitlist message only when a visitor chooses to send it.

## Font licences

DM Sans and Fraunces are distributed under the SIL Open Font License 1.1. Keep
the licence files in `assets/fonts/licenses/` with every public distribution.

## Landing page maintenance

The approved landing page uses seven concise sections, visual household cards,
and native scroll transformations. Its assets are self-hosted, with no runtime
dependencies. The hero and card motion live in assets/js/lean-story.js; the
before-and-after reserve story lives in assets/js/reserve-story.js. Colours and
responsive layouts live in the corresponding CSS files and the shared theme.

Keep future app screenshots in template#future-app-screens until real images are
ready. The template reserves three named slots without exposing placeholders to
visitors. Preserve one visible wordmark in the header.

Before release, verify desktop, tablet, phone, short portrait, and landscape
layouts. The approved preview was checked at 25 browser viewport sizes from
320 to 2560 pixels wide, including layout breakpoints. Also check native scroll
progression and reversal, navigation, FAQ keyboard access, and email CTA links.
