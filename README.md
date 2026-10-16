# Jesse AI — Public Demo Website

Static single-page site where visitors can try Jesse AI live. Calls the Railway API directly from the browser (CORS is already enabled on the server: `access-control-allow-origin: *`).

## Files

- `index.html` — semantic, screen-reader-friendly page: hero, Try-It demo, capabilities, accessibility statement, about.
- `styles.css` — high-contrast dark theme, visible focus rings, `prefers-reduced-motion` support.
- `app.js` — POSTs `{command, user, use_llm}` to the Railway `/command` endpoint, renders the reply into an `aria-live` region.

## Recommended hosting: Cloudflare Pages (free)

Why it wins for this site:

| Factor | Cloudflare Pages (free) | GitHub Pages | Netlify (free) | Vercel (Hobby) |
|---|---|---|---|---|
| Cost | $0 | $0 | $0 (credit-based) | $0 |
| Bandwidth | **Unlimited** | 100 GB/mo (soft) | ~15 GB (credits) | 100 GB/mo |
| Commercial use allowed | **Yes** | Mostly yes | Yes | **No** (Hobby = personal only) |
| Custom domain + free SSL | Yes (100/project) | Yes | Yes | Yes |
| Builds | 500/mo | via Actions | credit-limited | 100 min/mo |
| GitHub integration | Yes | Native | Yes | Yes |

Decisive points:
1. **Commercial use is explicitly allowed** on the free tier — Jesse plans to monetize, and Vercel Hobby forbids commercial use outright.
2. **Unlimited bandwidth** — if the demo goes viral, the site stays up with no surprise bill or pause (Netlify can pause the site when credits run out).
3. **Free SSL + custom domain** included; 300+ edge locations for fast global loads.

Runner-up: **GitHub Pages** — simplest if you want zero new accounts (Jesse already has GitHub). Fine for a brochure/demo, but the 100 GB soft cap and no explicit commercial-use blessing make Cloudflare the safer long-term home.

## Setup steps (Cloudflare Pages)

1. Create a free Cloudflare account at cloudflare.com (no card required).
2. Push this folder to a GitHub repo (e.g. `wicced209/jesse-ai-website`).
3. In the Cloudflare dashboard: Workers & Pages → Create → Pages → Connect to Git → select the repo.
4. Build settings: framework preset "None", build command empty, output directory `/` (repo root).
5. Deploy. You get `https://jesse-ai-website.pages.dev` instantly.
6. Optional: add a custom domain under the project's Custom domains tab (free SSL automatic).

No build step, no server code, no environment variables needed.

## Before going live — one server change needed

The Railway `/command` endpoint currently authorizes a username allowlist and rejects unknown users (`{"error":"Unauthorized","user":"guest"}` — verified 2026-10-16). The demo posts as `user: "demo"` (see `DEMO_USER` in `app.js`). For the public Try-It box to work, the server operator must either:

- (a) add a limited demo identity (e.g. `demo`) to the allowlist, ideally rate-limited, or
- (b) add a dedicated public endpoint (e.g. `POST /demo/command`) with strict rate limiting and no access to privileged routes.

Until then, visitors will see the friendly error message baked into `app.js`.

## Accessibility notes

- Skip link, landmarks (`header/nav/main/footer`), single `h1`.
- All form controls labeled; response output in `aria-live="polite"` regions.
- Keyboard-only operable; 3px gold focus indicator.
- Contrast meets WCAG AA; honors `prefers-reduced-motion`.

## Limitations

- The demo is only as capable as the Railway API's public surface. Audio/video generation endpoints exist on the server but are not wired into this page yet — easy follow-up.
- No analytics, no backend, no user accounts — by design (static site).
- Long LLM responses can take up to ~90s; the UI shows a waiting status and times out gracefully.
