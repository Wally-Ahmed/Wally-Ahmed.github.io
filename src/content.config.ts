import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Two kinds of entry appear on this site and nothing else: a confirmed
// hackathon win, or something released under MIT. The schema enforces that.
const projects = defineCollection({
  // CLAUDE*.md files are written into source folders by tooling hooks and are
  // not project entries; excluding them keeps the build from failing on them.
  loader: glob({ pattern: ['**/*.md', '!**/CLAUDE*.md'], base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        kind: z.enum(['win', 'oss']),
        order: z.number(),
        blurb: z.string(),
        stack: z.array(z.string()).min(1),
        sourceUrl: z.string().url(),

        // Wins carry an award and an event; OSS entries carry neither.
        award: z.string().optional(),
        event: z.string().optional(),
        hardPart: z.string().optional(),
        liveUrl: z.string().url().optional(),
        screenshot: image().optional(),

        // OSS-only.
        language: z.string().optional(),
        stars: z.number().int().min(0).optional(),
        installCmd: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        if (data.kind === 'win') {
          for (const field of ['award', 'event', 'hardPart', 'liveUrl', 'screenshot'] as const) {
            if (!data[field]) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [field],
                message: `A "win" must have ${field} — an award with nothing to click is exactly what this site refuses to publish.`,
              });
            }
          }
        }
        if (data.kind === 'oss' && !data.installCmd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['installCmd'],
            message: 'An "oss" entry needs installCmd — the card renders it as its visual.',
          });
        }
      }),
});

export const collections = { projects };
