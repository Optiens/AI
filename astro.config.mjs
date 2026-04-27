// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import remarkCjkFriendly from 'remark-cjk-friendly';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkCjkFriendly],
  },
  redirects: {
    '/news': '/blog',
    '/news/official-website-launch': '/blog/official-website-launch',
    '/solutions': '/ai-consulting',
    '/solutions/precision-cultivation-model': '/hydroponics',
    '/solutions/technology-provision': '/hydroponics',
    '/solutions/ai-consulting': '/ai-consulting',
    '/solutions/ai-consulting/sample-pension': '/ai-consulting/sample-pension',
    '/solutions/ai-consulting/sample-restaurant': '/ai-consulting/sample-restaurant',
    '/solutions/ai-consulting/sample-construction': '/ai-consulting/sample-construction',
    '/market': '/hydroponics',
  },
  site: 'https://optiens.com',
  output: 'server', // ← SSR/エンドポイントあり
  adapter: vercel({
    regions: ['hnd1'], // 東京リージョン（日本ユーザー向け）
    memory: 1024,      // 関数メモリ増量（安定性）
  }),
});
