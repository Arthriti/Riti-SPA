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
