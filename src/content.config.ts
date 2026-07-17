import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['發展里程碑', '在家練習', '特殊兒照護', '就醫與資源', '治療師觀點']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    audioUrl: z.string().optional(),
  }),
});

export const collections = { posts };
