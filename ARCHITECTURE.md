# crewrig-website — Architecture

Short ADR-style notes describing the structural choices of the showcase
site. Aimed at the next agent (or human) picking this up.

## Goal

A single-page marketing site for the **CrewRig** framework, hosted on
GitHub Pages (project page `crewrig.github.io/crewrig-website/`).
Constraints: static output, no SSR, fast to deploy, easy to extend
section-by-section, scroll-driven animations.

## Non-goals

- Multi-page navigation, blog, or docs site (lives in the main repo).
- Auth, server logic, CMS integration.
- i18n. English only, per `AGENTS.md`.

## Stack decisions

| Layer       | Choice                                  | Why                                                                                   |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| Framework   | Astro 6 (`minimal` template, strict TS) | Zero-JS by default, content-first, perfect fit for a marketing one-pager.             |
| Styling     | Tailwind CSS v4 (`@tailwindcss/vite`)   | v4 ships as a Vite plugin — no PostCSS config, no `tailwind.config.js`. Faster build. |
| Animation   | AOS 2.3 (`aos` npm, CSS bundled)        | Tiny library, ideal for one-off scroll fades on a marketing page.                     |
| Output      | `output: 'static'`                      | Required for GitHub Pages.                                                            |
| Deploy      | `actions/deploy-pages@v4` (native)      | Modern GitHub-native path. Avoids the `gh-pages` branch + PAT pattern.                |

### Why Tailwind v4 (and not v3)

`npx astro add tailwind` on Astro 6 installs Tailwind v4 by default. v4
configuration lives in `src/styles/global.css` via the `@theme` block —
the legacy `tailwind.config.js` is **not** generated. Custom tokens
(brand colours, fonts) are declared as CSS custom properties under
`@theme` and become Tailwind utilities automatically.

### Why AOS over Motion / Framer / GSAP

The brief calls for *scroll-triggered fades* — nothing more. AOS does
exactly that with a single `data-aos="fade-up"` attribute. Motion / GSAP
would be overkill for a page with no interactive choreography.

## Color palette

| Token                  | Value                          | Use                                |
| ---------------------- | ------------------------------ | ---------------------------------- |
| `--color-bg`           | `#0d0d14`                      | Page background. Near-black, cool. |
| `--color-bg-elevated`  | `#16161f`                      | Alternating section background.    |
| `--color-accent`       | `#7c3aed`                      | Violet — links, key CTAs, accents. |
| `--color-accent-hover` | `#8b5cf6`                      | Hover state for the violet accent. |
| `--color-accent-soft`  | `rgba(124, 58, 237, 0.15)`     | Glows, soft backgrounds.           |
| Text default           | `#f0f0f6`                      | Body copy on dark background.      |
| Text muted             | `#9090a8`                      | Secondary copy, footer.            |

Dark-first by design; light mode is a non-goal for v1.

## Typography

- **Body / headings**: Inter (400, 500, 600, 700) via Google Fonts.
- **Code**: JetBrains Mono (400, 600).
- Both preconnected and loaded in `Layout.astro` to keep the FOUT short.
- Fallback stack: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.

## Component breakdown

One `.astro` component per logical section, all consumed by
`src/pages/index.astro`. This keeps each section reviewable in isolation
and parallelises copywriting / illustration work across agents.

```
src/
├── layouts/
│   └── Layout.astro        # <html>, fonts, AOS init, global slot
├── pages/
│   └── index.astro         # composes the 8 sections in order
├── components/
│   ├── Hero.astro          # logo + tagline (above the fold)
│   ├── Problem.astro       # the pain CrewRig addresses
│   ├── Insight.astro       # the conceptual leap
│   ├── Solution.astro      # what CrewRig *is*
│   ├── HowItWorks.astro    # mechanics — teams, tasks, worktrees
│   ├── FeaturesGrid.astro  # 3-col card grid of capabilities
│   ├── QuickStart.astro    # copy-pasteable install / first run
│   └── Footer.astro        # © + GitHub link
└── styles/
    └── global.css          # Tailwind import + @theme tokens
```

All section components contain live copy wired from `COPY.md`.
The `COPY.md` file remains in the repo as the content source of record.

## Animation approach

AOS is initialised once, globally, in `Layout.astro`:

```js
AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 80 });
```

Each section root carries `data-aos="fade-up"`. Rationale:

- **`once: true`** — marketing pages animate once; replaying on scroll-up
  feels gimmicky.
- **`offset: 80`** — trigger slightly before the section enters the
  viewport so the animation completes near full visibility.
- **CSS bundled via npm** — `import 'aos/dist/aos.css'` in `Layout.astro`
  frontmatter; Vite bundles it into the page CSS, removing the CDN
  render-blocking request (Lighthouse Perf: 88 → 97).

## GitHub Pages deployment

- Workflow: `.github/workflows/deploy.yml`.
- Trigger: `push` to `main`, or manual `workflow_dispatch`.
- Two-job pipeline: **build** (Astro → `dist/`, uploaded as a Pages
  artifact) → **deploy** (`actions/deploy-pages@v4`, environment
  `github-pages`).
- Concurrency group `pages` with `cancel-in-progress: false` — never
  cancel an in-flight production deploy.
- Required repo setting (manual, one-time): **Settings → Pages →
  Source: GitHub Actions**. The workflow assumes this is set; without
  it `deploy-pages` fails.
- `site` / `base` in `astro.config.mjs` are pinned to the project URL
  (`https://crewrig.github.io` + `/crewrig-website`). If the site moves
  to a custom domain or to the root path, both values must be updated
  in lockstep — there is no environment override today.

## Open questions / follow-ups

- **Lighthouse budget**: web-tester agent should set a perf budget
  (target: 95+ on Performance, Accessibility, Best Practices, SEO).
- **OG image**: the current `og:image` points to `logo.png`. A purpose-built
  1200×630 social card would render better on Slack / Twitter / LinkedIn.
- **Custom domain**: not in scope for v1; revisit once the project has
  a stable identity.
