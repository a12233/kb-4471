import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

export default defineConfig({
  plugins: [
    sveltekit({
      extensions: ['.svelte', '.svx'],
      preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'], layout: { runbook } })],
      adapter: adapter({ pages: 'build', assets: 'build', strict: false }),
      inlineStyleThreshold: Infinity,
      paths: { base: process.env.BASE_PATH ?? '' },
      prerender: { entries: ['*'], handleHttpError: 'warn', handleMissingId: 'warn', handleUnseenRoutes: 'warn' },
    }),
  ],
});
