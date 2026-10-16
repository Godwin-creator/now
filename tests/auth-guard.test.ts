import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(path);
  }),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/utils/supabase/server', () => ({
  createClient: mocks.createServerClient,
}));

import { requireCompany } from '../lib/auth';

describe('requireCompany', () => {
  it('redirects an authenticated user without a company to onboarding', async () => {
    const user = {
      id: 'user-1',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'gerant@example.com',
      app_metadata: {},
      user_metadata: {},
      created_at: '2026-10-16T00:00:00.000Z',
    };
    mocks.createServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      })),
    });

    await expect(requireCompany()).rejects.toThrow('/onboarding');
    expect(mocks.redirect).toHaveBeenCalledWith('/onboarding');
  });
});
