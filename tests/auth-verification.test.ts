import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AuthApiError,
  createClient as createSupabaseClient,
} from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { getAuthErrorMessage } from '../lib/auth/result';

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({
  createClient: mocks.createServerClient,
}));
vi.mock('@/lib/auth', () => ({ requireUser: vi.fn() }));

import { verifySignupCode } from '../app/actions/auth';

afterEach(() => vi.clearAllMocks());

function makeSupabaseClient() {
  return createSupabaseClient<Database>(
    'https://supabase.example',
    'test-anon-key',
  );
}

describe('verifySignupCode', () => {
  it('rejects malformed codes before calling Supabase', async () => {
    await expect(
      verifySignupCode('gerant@example.com', '12ab'),
    ).resolves.toEqual({
      success: false,
      error: 'Saisissez une adresse e-mail valide et le code à 8 chiffres.',
    });
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it.each([
    {
      code: 'invalid_otp',
      expected:
        'Ce code est invalide. Vérifiez les huit chiffres reçus par e-mail.',
    },
    {
      code: 'otp_expired',
      expected: 'Ce code a expiré. Demandez-en un nouveau.',
    },
  ])('returns a clear message for $code', async ({ code, expected }) => {
    const supabase = makeSupabaseClient();
    const verifyOtp = vi.spyOn(supabase.auth, 'verifyOtp').mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('raw server message', 400, code),
    });
    mocks.createServerClient.mockResolvedValue(supabase);

    await expect(
      verifySignupCode('gerant@example.com', '12345678'),
    ).resolves.toEqual({ success: false, error: expected });
    expect(verifyOtp).toHaveBeenCalledWith({
      email: 'gerant@example.com',
      token: '12345678',
      type: 'signup',
    });
  });

  describe('messages d’erreur Auth', () => {
    it.each([
      [
        'email_not_confirmed',
        'Votre adresse e-mail n’est pas confirmée. Saisissez le code reçu pour activer votre compte.',
      ],
      ['invalid_credentials', 'Adresse e-mail ou mot de passe incorrect.'],
      [
        'user_already_exists',
        'Un compte existe déjà avec cette adresse e-mail. Connectez-vous.',
      ],
    ])('traduit le code %s en message français', (code, expected) => {
      expect(getAuthErrorMessage({ code, message: 'technical message' })).toBe(
        expected,
      );
    });
  });
});
