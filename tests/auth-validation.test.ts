import { describe, expect, it } from 'vitest';
import {
  companyNameSchema,
  signUpSchema,
  signupCodeSchema,
} from '../lib/auth/validation';

describe('validation de l’inscription', () => {
  it('accepte une adresse e-mail et nettoie les espaces', () => {
    expect(
      signUpSchema.parse({
        email: ' gerant@example.com ',
        password: 'secure123',
      }),
    ).toEqual({
      email: 'gerant@example.com',
      password: 'secure123',
    });
  });

  it('rejette un mot de passe trop court et un nom d’entreprise vide', () => {
    expect(
      signUpSchema.safeParse({
        email: 'gerant@example.com',
        password: '1234567',
      }).success,
    ).toBe(false);
    expect(companyNameSchema.safeParse('  ').success).toBe(false);
  });

  it('limite le nom de l’entreprise à 120 caractères', () => {
    expect(companyNameSchema.safeParse('x'.repeat(120)).success).toBe(true);
    expect(companyNameSchema.safeParse('x'.repeat(121)).success).toBe(false);
  });

  it('accepte exactement huit chiffres pour le code OTP reçu par e-mail', () => {
    expect(
      signupCodeSchema.safeParse({
        email: 'gerant@example.com',
        code: '43712208',
      }).success,
    ).toBe(true);
    expect(
      signupCodeSchema.safeParse({
        email: 'gerant@example.com',
        code: '437122',
      }).success,
    ).toBe(false);
    expect(
      signupCodeSchema.safeParse({
        email: 'gerant@example.com',
        code: '4371220a',
      }).success,
    ).toBe(false);
  });
});
