import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const signupCodeSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z
    .string()
    .trim()
    .regex(/^\d{8}$/),
});

export const companyNameSchema = z.string().trim().min(1).max(120);
