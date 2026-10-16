import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AuthApiError,
  createClient as createSupabaseClient,
} from '@supabase/supabase-js';
import type { Database } from '../types/database';

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({
  createClient: mocks.createServerClient,
}));
vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }));

import { createCompany, signUp } from '../app/actions/auth';

afterEach(() => vi.clearAllMocks());

function makeSupabaseClient() {
  return createSupabaseClient<Database>(
    'https://supabase.example',
    'test-anon-key',
  );
}

describe('signUp', () => {
  it('creates the Auth user without inserting into companies', async () => {
    const supabase = makeSupabaseClient();
    const signUpCall = vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'gerant@example.com',
          app_metadata: {},
          user_metadata: {},
          created_at: '2026-10-16T00:00:00.000Z',
        },
        session: null,
      },
      error: null,
    });
    const from = vi.spyOn(supabase, 'from');
    mocks.createServerClient.mockResolvedValue(supabase);

    await expect(signUp('gerant@example.com', 'secure123')).resolves.toEqual({
      success: true,
      data: { verificationRequired: true },
    });

    expect(signUpCall).toHaveBeenCalledWith({
      email: 'gerant@example.com',
      password: 'secure123',
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('rejects passwords shorter than eight characters before contacting Supabase', async () => {
    await expect(signUp('gerant@example.com', '1234567')).resolves.toEqual({
      success: false,
      error:
        'Saisissez une adresse e-mail valide et un mot de passe d’au moins 8 caractères.',
    });
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it('translates the email rate limit without exposing a technical message', async () => {
    const supabase = makeSupabaseClient();
    vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError(
        'raw server message',
        429,
        'over_email_send_rate_limit',
      ),
    });
    mocks.createServerClient.mockResolvedValue(supabase);

    const result = await signUp('gerant@example.com', 'secure123');

    expect(result).toEqual({
      success: false,
      error:
        'Trop de demandes ont été envoyées. Attendez un peu avant de réessayer.',
    });
    if (result.success)
      throw new Error('La limitation de débit aurait dû échouer.');
    expect(result.error).not.toContain('raw server message');
  });
});

describe('createCompany', () => {
  it('upserts on the authenticated user id and remains idempotent', async () => {
    const rows = new Map<string, { nom: string; email: string | null }>();
    mocks.requireUser.mockResolvedValue({
      id: 'authenticated-user',
      email: 'gerant@example.com',
    });
    const upsert = vi.fn(
      async (
        row: { id: string; nom: string; email: string | null },
        options: { onConflict: string; ignoreDuplicates: boolean },
      ) => {
        expect(options).toEqual({ onConflict: 'id', ignoreDuplicates: true });
        if (!rows.has(row.id))
          rows.set(row.id, { nom: row.nom, email: row.email });
        return { error: null };
      },
    );
    mocks.createServerClient.mockResolvedValue({
      from: vi.fn(() => ({ upsert })),
    });

    await expect(createCompany('Ma PME')).resolves.toEqual({
      success: true,
      data: null,
    });
    await expect(createCompany('Autre nom')).resolves.toEqual({
      success: true,
      data: null,
    });

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(rows.size).toBe(1);
    expect(rows.get('authenticated-user')?.nom).toBe('Ma PME');
  });
});
