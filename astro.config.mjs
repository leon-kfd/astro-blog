import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
const base = process.env.VITE_BASE

// https://astro.build/config
export default defineConfig({
	base,
	site: 'https://kongfandong.cn',
	integrations: [sitemap()],
	markdown: {
		remarkPlugins: [],
		rehypePlugins: [
			'rehype-slug', 
			'remark-smartypants', 
			'remark-gfm', 
			[
				'rehype-autolink-headings', 
				{
					behavior: 'wrap'
				}
			], 
			'remark-gfm'
		],
		shikiConfig: {
			theme: 'rose-pine-moon',
			langs: [],
			wrap: false
		}
	}
});
