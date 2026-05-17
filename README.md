# CrewRig — Showcase Website

The official showcase site for [CrewRig](https://github.com/crewrig/crewrig), the shared configuration framework that lets development teams coordinate AI tools (Claude Code, Gemini CLI) at team scale.

**Live site:** https://crewrig.github.io/crewrig-website/

## Stack

- [Astro 6](https://astro.build/) — static output, zero-JS by default
- [Tailwind CSS v4](https://tailwindcss.com/) — CSS-first `@theme` tokens, no config file
- [AOS 2.3](https://michalsnik.github.io/aos/) — scroll-triggered animations (bundled via npm)
- Google Fonts — Inter + JetBrains Mono, async-loaded
- GitHub Actions — automated build and deploy to GitHub Pages

## Development

```sh
# Install dependencies
npm install

# Local dev server — http://localhost:4321/crewrig-website/
npm run dev

# Production build + preview
npm run build && npm run preview

# E2E tests (requires Chromium)
npx playwright install chromium
npm test
```

## Structure

```
src/
├── layouts/Layout.astro        # <html>, fonts, AOS init
├── pages/index.astro           # single page, composes 8 sections
├── components/
│   ├── Hero.astro
│   ├── Problem.astro
│   ├── Insight.astro
│   ├── Solution.astro
│   ├── HowItWorks.astro
│   ├── FeaturesGrid.astro
│   ├── QuickStart.astro
│   └── Footer.astro
├── assets/logo.png             # optimized via astro:assets → WebP
└── styles/global.css           # Tailwind @theme tokens
```

## Deployment

Pushes to `main` automatically build and deploy via `.github/workflows/deploy.yml`.
One-time manual step: **Settings → Pages → Source: GitHub Actions**.

## License

MIT — see [crewrig/crewrig](https://github.com/crewrig/crewrig) for the framework itself.
