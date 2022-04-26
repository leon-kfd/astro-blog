import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig(
	/** @type {import('astro').AstroUserConfig} */
	{
		markdown: {
			remarkPlugins: [],
			rehypePlugins: ['rehype-slug', 'remark-smartypants', 'remark-gfm', ['rehype-autolink-headings', {
				behavior: 'wrap'
			}], 'remark-gfm'],
			shikiConfig: {
				theme: 'poimandres',
				langs: [],
				wrap: false
			}
		},
		site: 'http://localhost:3000/',
		integrations: [sitemap()]
	});
