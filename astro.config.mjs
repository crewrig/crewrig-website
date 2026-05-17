// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
//
// `site` and `base` target the GitHub Pages project URL
// https://crewrig.github.io/crewrig-website/. If the site is later moved to a
// custom domain or to a user/organization page (root path), drop `base` and
// update `site` accordingly.
export default defineConfig({
  site: 'https://crewrig.github.io',
  base: '/crewrig-website',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
