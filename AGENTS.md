# Agent Instructions

This repository contains the static public website for Riti. It is deliberately
separate from the private mobile-app repository and is intended for GitHub Pages.

## Scope and stack

- Keep the site dependency-free: semantic HTML, CSS, and small vanilla JavaScript.
- Do not add a backend, framework, database, analytics, trackers, cookies, or
  third-party runtime service without explicit user approval.
- Keep paths compatible with GitHub Pages project sites and preserve the build
  script's base-URL handling.
- Never commit credentials or private product data.

## Product truth

- Riti is an India-first, phone-only household financial-planning app in beta.
- Riti and the mobile app are proprietary, not open source. A public website
  repository does not change that status.
- Describe the Financial Twin as an evolving product direction; do not imply
  that unverified beta capabilities are already available.
- AI may explain information and possibilities, but it must never be described
  as inventing or establishing financial truth.
- Do not invent testimonials, user counts, release dates, financial outcomes,
  certifications, partnerships, or unsupported product capabilities.

## Waitlist and privacy

- The primary action is a `mailto:` link to `level8infection@gmail.com` with a
  prefilled beta-waitlist subject and body.
- Do not claim that clicking the link joins the visitor automatically. Their
  email app opens, and they must choose to send the message.
- The website must not collect financial information or store waitlist data.
- Keep privacy, terms, contact copy, and tests aligned with any approved change
  to data handling.

## Brand and experience

- Use the supplied Riti assets and the dark app icon only; do not reintroduce the
  light icon.
- Preserve the calm, editorial, warm visual language and plain, restrained copy.
- Keep pages responsive, keyboard accessible, readable at enlarged text sizes,
  and respectful of reduced-motion preferences.

## Verification

Run these from the repository root after changes:

```powershell
npm test
node scripts/build.mjs --url "http://localhost:4173"
```

The generated `dist/` directory is ignored. The GitHub Pages workflow builds it
during deployment.
