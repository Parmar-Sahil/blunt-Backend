import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const passwordValidator = z
  .string()
  .min(8, "PASSWORD MUST BE AT LEAST 8 CHARACTERS LONG")
  .regex(
    passwordRegex,
    "PASSWORD MUST CONTAIN AT LEAST ONE UPPERCASE LETTER, ONE LOWERCASE LETTER, ONE NUMBER, AND ONE SPECIAL CHARACTER"
  );

export const registerSchema = z
  .object({
    name: z.string().min(2, "NAME MUST BE AT LEAST 2 CHARACTERS LONG"),
    email: z.string().email("ENTER A VALID EMAIL ADDRESS"),
    password: passwordValidator,
    confirmPassword: z.string().min(1, "PASSWORD CONFIRMATION IS REQUIRED"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "PASSWORDS DO NOT MATCH",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("ENTER A VALID EMAIL ADDRESS"),
  password: z.string().min(1, "PASSWORD IS REQUIRED"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("ENTER A VALID EMAIL ADDRESS"),
  otp: z.string().length(6, "OTP MUST BE EXACTLY 6 DIGITS").regex(/^\d+$/, "OTP MUST BE NUMERIC"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("ENTER A VALID EMAIL ADDRESS"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email("ENTER A VALID EMAIL ADDRESS"),
    otp: z.string().length(6, "OTP MUST BE EXACTLY 6 DIGITS").regex(/^\d+$/, "OTP MUST BE NUMERIC"),
    newPassword: passwordValidator,
    confirmNewPassword: z.string().min(1, "PASSWORD CONFIRMATION IS REQUIRED"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "PASSWORDS DO NOT MATCH",
    path: ["confirmNewPassword"],
  });

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "OLD PASSWORD IS REQUIRED"),
    newPassword: passwordValidator,
    confirmNewPassword: z.string().min(1, "PASSWORD CONFIRMATION IS REQUIRED"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "NEW PASSWORDS DO NOT MATCH",
    path: ["confirmNewPassword"],
  });

export const resendOtpSchema = z.object({
  email: z.string().email("ENTER A VALID EMAIL ADDRESS"),
  purpose: z.enum(["register", "login", "password_reset"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
