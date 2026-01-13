import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/blog'
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('David Mainoo'),
    authorAvatar: z.string().optional(),
    category: z.enum(['Programming', 'Tutorial', 'Opinion', 'Tech', 'Career']),
    tags: z.array(z.string()).default([]),
    image: image().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/projects'
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(), // Use string path instead of image()
    year: z.string(),
    endYear: z.string().optional(),
    status: z.string(), // Changed from enum to string for flexibility
    tags: z.array(z.string()),
    links: z.array(z.object({
      url: z.string().url(),
      text: z.string(),
    })).optional(),
    github: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().optional(),
    type: z.enum(['personal', 'work']).default('personal'),
  }),
});

export const collections = { blog, projects };
