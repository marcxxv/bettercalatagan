import { z } from 'zod';

/** Shape of the file written by `scripts/cmci.mjs`. */

const pillarSchema = z.object({
  name: z.string().trim().min(3),
  rank: z.number().int().positive().nullable(),
  /** Null where DTI's table prints no score (2018). */
  score: z.number().nonnegative().nullable(),
});

export const cmciYearSchema = z
  .object({
    year: z.number().int().min(2014).max(2100),
    category: z.string().trim().min(3),
    ranked: z.number().int().positive(),
    rank: z.number().int().positive(),
    score: z.number().positive().nullable(),
    pillars: z.array(pillarSchema).min(3),
    url: z.string().url().startsWith('https://cmci.dti.gov.ph/'),
    /** Indicator ranks and scores from DTI's LGU profile, for the year they match. */
    indicators: z
      .object({
        url: z.string().url().startsWith('https://cmci.dti.gov.ph/lgu-profile.php'),
        pillars: z
          .array(
            z.object({
              name: z.string().trim().min(3),
              indicators: z
                .array(z.object({ name: z.string().trim().min(3), rank: z.number().int().positive(), score: z.number().nonnegative() }))
                .min(1),
            }),
          )
          .min(3),
      })
      .optional(),
  })
  .refine((y) => y.rank <= y.ranked, 'rank cannot exceed the number of LGUs ranked');

export const cmciDatasetSchema = z.object({
  source: z.object({ base: z.string().url(), lgu: z.literal('Calatagan'), province: z.literal('Batangas') }),
  retrievedAt: z.string().datetime(),
  years: z.array(cmciYearSchema).min(1),
});

export type CmciYear = z.infer<typeof cmciYearSchema>;
