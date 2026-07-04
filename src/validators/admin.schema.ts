import { z } from "zod";

export const adminCreateSchema = z.object({
  name: z.string().min(2, "NAME MUST BE AT LEAST 2 CHARACTERS LONG"),
  email: z.string().email("ENTER A VALID EMAIL ADDRESS"),
  password: z.string().min(8, "PASSWORD MUST BE AT LEAST 8 CHARACTERS LONG"),
  role: z.enum(["superadmin", "admin", "staff"]),
  permissions: z.array(z.string()).default([]),
  phone: z.string().optional(),
});

export const adminUpdateSchema = z.object({
  name: z.string().min(2, "NAME MUST BE AT LEAST 2 CHARACTERS LONG").optional(),
  role: z.enum(["superadmin", "admin", "staff"]).optional(),
  permissions: z.array(z.string()).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});
export default adminCreateSchema;
