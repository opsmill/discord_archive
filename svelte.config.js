import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Get base path from environment for GitHub Pages
// Set GITHUB_PAGES=true and BASE_PATH=/repo-name when building for GitHub Pages
const dev = process.argv.includes('dev');
const base = process.env.BASE_PATH || '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			strict: false
		}),
		paths: {
			base: dev ? '' : base
		}
	}
};

export default config;
