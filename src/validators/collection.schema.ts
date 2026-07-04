import { z } from "zod";

export const collectionCreateSchema = z.object({
  name: z.string().min(2, "NAME MUST BE AT LEAST 2 CHARACTERS LONG").max(100),
  slug: z.string().optional(),
  description: z.string().max(1000).optional(),
  bannerImage: z.string().optional().or(z.literal("")),
  thumbnail: z.string().optional().or(z.literal("")),
  displayOrder: z.number().int().nonnegative().optional(),
  status: z.enum(["active", "inactive", "draft", "archived"]).optional(),
  isFeatured: z.boolean().optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  seo: z
    .object({
      metaTitle: z.string().max(100).optional(),
      metaDescription: z.string().max(200).optional(),
    })
    .optional(),
});

export const collectionUpdateSchema = collectionCreateSchema.partial();
