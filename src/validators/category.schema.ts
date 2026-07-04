import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().min(2, "NAME MUST BE AT LEAST 2 CHARACTERS LONG").max(100),
  slug: z.string().optional(),
  description: z.string().max(1000).optional(),
  image: z.string().optional().or(z.literal("")),
  icon: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  status: z.enum(["active", "inactive", "draft", "archived"]).optional(),
  isFeatured: z.boolean().optional(),
  seo: z
    .object({
      metaTitle: z.string().max(100).optional(),
      metaDescription: z.string().max(200).optional(),
    })
    .optional(),
  parentCategory: z.string().regex(/^[0-9a-fA-F]{24}$/, "INVALID PARENT CATEGORY ID").nullable().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();
