# crewrig-website — Architecture

Short ADR-style notes describing the structural choices of the showcase
site. Aimed at the next agent (or human) picking this up.

## Goal

A single-page narrative site for the **CrewRig** framework, served at
`https://crewrig.org`. The page leads a first-time visitor through an
opening, five problem-to-solution cases (one per CrewRig pillar, carried
by a recurring cast), a getting-started call to action, and a closing.
Constraints: static output, no SSR, fast to deploy, easy to extend
case-by-case, scroll-driven animations.

## Non-goals

- Blog. Auth, server logic, CMS integration.
- i18n. English only, per `AGENTS.md`.

> **Reversed by spec 0002.** This file previously listed *"Multi-page
> navigation, blog, or docs site (lives in the main repo)"* as a non-goal.
> Spec 0002 overturns the docs-site half of that decision: crewrig.org now
> serves a `/docs` section rendered from the framework's published
> documentation. The content still lives in the framework repo — the site
> only renders a pinned snapshot of it. See *Documentation section* below.

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

## Content model

The narrative is **data-driven**, not hard-coded per section. All five
cases — plus the hero fields and the footer tagline — live as typed data
in `src/data/cases.ts`. `index.astro` maps over `cases` and renders one
generic `Case.astro` per entry. This is the single source of truth the
site renders; `COPY.md` is the human-facing content of record and
`src/assets/illustrations/STYLE.md` mirrors the illustration briefs. If
any of the three diverge, `cases.ts` is authoritative.

Each `Case` carries: `id` (drives the section `id` `case-<id>` and the
illustration filename), `pillar`, `title`, `persona` (`name` + `role`),
`problem`, `solution`, and `illustration` (`file`, `alt`, `prompt`). The
copy is user-validated for message integrity — components must not
paraphrase it.

## Component breakdown

A thin set of `.astro` components, all consumed by `src/pages/index.astro`.
`Case.astro` is the workhorse — one component renders every case from its
data entry, so adding or reordering a case is a `cases.ts` edit, not a new
component.

```
src/
├── data/
│   └── cases.ts            # typed model: hero, five cases, tagline (source of truth)
├── layouts/
│   └── Layout.astro        # <html>, fonts, AOS init, global slot
├── pages/
│   └── index.astro         # Hero → five Case → QuickStart → Footer
├── components/
│   ├── Hero.astro          # logo + validated hero copy (above the fold)
│   ├── Case.astro          # renders one case (persona, problem, solution, illustration)
│   ├── QuickStart.astro    # copy-pasteable install / first run, CLI toggle
│   └── Footer.astro        # © + GitHub link + tagline
├── assets/
│   └── illustrations/      # committed PNGs + provenance.json + STYLE.md
└── styles/
    └── global.css          # Tailwind import + @theme tokens
```

### Case rendering details

- The illustration is rendered via `astro:assets` `Image` with
  `format="webp"`, responsive `widths={[480, 800, 1200]}`, and explicit
  `width`/`height` (1200×800) to reserve layout space and avoid CLS.
- Astro can't statically resolve a runtime filename into an `src/assets`
  import, so `Case.astro` uses `import.meta.glob('../assets/illustrations/*.png')`
  and looks the entry up by `illustration.file`. A missing file throws at
  build time — a fast, loud failure rather than a silent broken image.
- The image alternates side by case index (even = right, odd = left).
- Parity with the previous sections' animation: the **first** case image
  is `loading="eager"` with no `data-aos` (it's near the fold); cases 2–5
  are `loading="lazy"` with `data-aos="fade-up"`.

## Illustration pipeline, provenance, and build isolation

Per spec 0001 (Requirements 6–8), every illustration is produced **ahead
of** the build and committed; the build never calls an image service.

- **Generation (manual).** `scripts/generate-illustrations.mjs` reads each
  case's `illustration.prompt` from `cases.ts`, prepends the shared style
  preamble parsed from `STYLE.md`, authenticates via Application Default
  Credentials, and calls a Vertex AI image model
  (`gemini-3.1-flash-image-preview`, pinned `REGION = 'us-central1'` with a
  TODO to confirm availability). It writes `src/assets/illustrations/<id>.png`
  and upserts a `provenance.json` entry. It is **manual-only** — never wired
  into `npm run build`, so the build stays offline and deterministic.
- **Provenance.** `src/assets/illustrations/provenance.json` records, per
  file, the exact prompt, model identifier, region, generation date, seed,
  and params — enough to regenerate. It is versioned alongside the PNGs.
- **Placeholders (current state).** Until cloud access is set up, the PNGs
  are solid dark placeholders carrying the case title, generated once by
  `scripts/generate-placeholders.mjs` (uses `sharp`, available transitively
  via Astro's image service). Their provenance entries are marked
  `placeholder: true` with `model: "PLACEHOLDER — pending …"`. Real
  generation later overwrites both the PNG and the provenance entry.
- **Integrity gate.** `scripts/check-illustrations.mjs` is a *bidirectional*
  check: every illustration referenced in `cases.ts` must exist on disk and
  in `provenance.json`, and every `*.png` on disk must have a provenance
  entry. Any orphan or missing record fails the build (exit 1). This is the
  enforcement for spec 0001's "untraceable image is caught before it ships"
  scenario. It runs in CI (`npm run check:illustrations`) between the build
  and the test pass, and needs no TS toolchain — it parses filenames out of
  `cases.ts` statically.

## Documentation section (spec 0002)

`crewrig.org/docs` renders the framework's **published** core documentation —
the same body of docs that lives in the CrewRig repo — pinned to a deliberate
framework version, faithful, and JS-free.

### Consumed contract

The framework publishes `docs/index.json` (the manifest) and per-page Markdown
bodies carrying a `<!-- crewrig-doc: ... -->` metadata block, per its
publication contract (`docs/publication-contract.md`, framework spec 0027).
The manifest shape is `{ version, sections[]{section,title,pages[]{title,path,nav_order}} }`;
empty sections are omitted upstream. The site reads the manifest only — it
never needs to know CrewRig's internal directory layout.

### Vendoring, not build-time fetch

The docs are **vendored** into the site repo by a manual sync script, so the
build stays offline and deterministic (mirroring the illustration pipeline's
build isolation) and the doc snapshot is reviewable in the PR diff.

- **Pin record — `docs-pin.json`** (repo root). `{ repo, ref, fetched_at }`.
  `ref` is a **merged `crewrig/main` commit SHA** (never a branch — a branch
  would let the pinned content drift). This is the single source of truth for
  the pinned version (spec 0002 R7); a version bump = edit `ref`, re-run the
  sync, commit.
- **Sync (manual) — `scripts/sync-docs.mjs`** (`npm run sync:docs`). Reads
  `docs-pin.json`, fetches `docs/index.json` and each manifest page body from
  the raw GitHub host at the pinned ref, writes them under `vendor/docs/<path>`
  (the `docs/`-relative layout is preserved), and stamps `fetched_at`. The
  framework repo is public — no auth. **Never wired into `npm run build`.**
- **Integrity gate — `scripts/check-docs-sync.mjs`** (`npm run check:docs-sync`).
  Bidirectional and network-free: every manifest `path` has a vendored file
  and every vendored `*.md` is in the manifest; exit 1 on drift. Runs in CI in
  `verify.yml` after `check:illustrations`, so a stale or partial snapshot is
  caught without network.

`vendor/docs/**` is **committed** (it is the rendered snapshot of record),
unlike `dist/` and `node_modules/`.

### Rendering

- **`src/lib/docs-manifest.ts`** — typed loader for the vendored manifest.
  Preserves manifest section order and page `nav_order`. Slug =
  `path` minus the leading `docs/` minus `.md`
  (`docs/adr/0010-x.md` -> `adr/0010-x`).
- **`src/lib/render-doc.ts`** — renders a vendored Markdown string to static
  HTML. **markdown-it** is used here rather than Astro's native remark/rehype
  pipeline: the link/anchor rewriting needs the page's repo-root path threaded
  through render plus direct token access, which is awkward to thread through
  Astro's file-based Markdown integration. The renderer:
  - strips the `crewrig-doc:` metadata block by keying on the sentinel, on the
    raw Markdown before render (markdown-it passes HTML comments through
    otherwise);
  - rewrites **every** relative link (any extension): resolved against the
    page's repo-root path, in-manifest targets become `/docs/<slug>`,
    out-of-manifest targets become the absolute upstream
    `https://github.com/.../blob/<ref>/<path>` URL — so neither 404s;
  - honors Kramdown `{#explicit-id}` heading anchors (strips the literal
    brace text and sets the heading id from it) so in-page `#id` links resolve;
  - routes relative image targets through the same in/out classifier (to the
    raw upstream URL) — defensive, no live images today;
  - preserves fenced code blocks and auto-slugs normal heading anchors.
- **Routes** — `src/pages/docs/index.astro` (the `/docs` landing: intro +
  sidebar) and `src/pages/docs/[...slug].astro` (`getStaticPaths` from the
  manifest, one route per page; the vendored body is imported raw via
  `import.meta.glob(..., { query: '?raw' })` at build time and rendered through
  `render-doc.ts`).
- **`src/layouts/DocsLayout.astro`** — sidebar nav (section -> pages, in order)
  plus content column. Styling is intentionally minimal (`.doc-content` prose
  rules in `global.css`); detailed styling is parked per the spec's
  `[USER-PARKED]` open question.

### Persistent header

`src/components/SiteHeader.astro` (logo + `Docs` link + source link) is
rendered by `Layout.astro` above the slot on **every** page, so it appears on
the marketing page and the docs section (R8/R9). `Layout.astro` gained a
`header` prop (default `true`) so a page can opt out without redesigning the
layout; `index.astro` (spec 0001) consumes the default and keeps its hero
composition intact. The **no `base`** rule still holds — header links resolve
from `/`.

## Verify workflow (CI)

`.github/workflows/verify.yml` runs on every `pull_request` and on `push`
to `main`:

`checkout → setup-node → npm ci → npx playwright install --with-deps →
npm run build → npm run check:illustrations → npm test`

The **build before test** ordering is required: Playwright's `webServer`
runs `npm run preview`, which serves `dist/`, so the build output must
exist first. This is the gate that asserts the page renders, every
illustration is traceable, and the narrative + QuickStart behaviour hold.
`.github/workflows/deploy.yml` remains the build-and-deploy path for
GitHub Pages and is unchanged by the revamp.

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
- `site` in `astro.config.mjs` is pinned to `https://crewrig.org`. The
  site is served at the domain root, so there is **no** `base` — internal
  links and assets resolve from `/`. Do not reintroduce a `base`.

## Open questions / follow-ups

- **Lighthouse budget**: web-tester agent should set a perf budget
  (target: 95+ on Performance, Accessibility, Best Practices, SEO).
- **OG image**: the current `og:image` points to `logo.png`. A purpose-built
  1200×630 social card would render better on Slack / Twitter / LinkedIn.
- **Custom domain**: not in scope for v1; revisit once the project has
  a stable identity.
