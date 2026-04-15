import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.enum(['AI', 'agriculture', 'business', 'technology', 'welfare', 'social', 'announcement']),
    excerpt: z.string(),
    image: z.string().optional(),
  }),
});

export const collections = { blog };
