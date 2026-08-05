import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Deployed as a GitHub Pages *user* site, so it lives at the domain root.
export default defineConfig({
  site: 'https://wally-ahmed.github.io',
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
