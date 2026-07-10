// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 上線後改成正式網域,例如 https://hsiening.tw
const SITE = process.env.SITE_URL || 'https://hsiening.vercel.app';

export default defineConfig({
  site: SITE,
  integrations: [sitemap()],
});
