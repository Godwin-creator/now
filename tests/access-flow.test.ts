import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveLoginMode } from '../lib/auth/login-mode';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), permanentRedirect: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('next/navigation', () => ({ permanentRedirect: mocks.permanentRedirect }));
import { requestPasswordReset, signIn, verifyRecoveryCode } from '../app/actions/access';
import SignupRedirect from '../app/signup/page';

afterEach(() => vi.clearAllMocks());

describe('mode de la page d’accès', () => {
  it('ouvre la connexion par défaut', () => expect(resolveLoginMode(undefined)).toBe('login'));
  it('ouvre la création de compte avec le paramètre autorisé', () => expect(resolveLoginMode('signup')).toBe('signup'));
  it('ignore tout paramètre hors liste blanche', () => expect(resolveLoginMode('admin')).toBe('login'));
});

describe('actions d’accès', () => {
  it('connecte avec e-mail et mot de passe, sans demander de code', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ auth: { signInWithPassword } });
    await expect(signIn('user@example.com', 'long-password')).resolves.toEqual({ ok: true, data: { confirmationRequired: false } });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'user@example.com', password: 'long-password' });
  });

  it('redirige un compte non confirmé vers la vérification', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: { code: 'email_not_confirmed' } });
    mocks.createClient.mockResolvedValue({ auth: { signInWithPassword } });
    await expect(signIn('user@example.com', 'long-password')).resolves.toEqual({ ok: true, data: { confirmationRequired: true } });
  });

  it('retourne le même message de récupération sans déterminer si le compte existe', async () => {
    const resetPasswordForEmail = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { code: 'user_not_found' } });
    mocks.createClient.mockResolvedValue({ auth: { resetPasswordForEmail } });
    const result = await requestPasswordReset('user@example.com');
    const noAccountResult = await requestPasswordReset('nobody@example.com');
    expect(result).toEqual(noAccountResult);
    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('vérifie le code avec le type recovery', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ auth: { verifyOtp } });
    await expect(verifyRecoveryCode('user@example.com', '123456')).resolves.toEqual({ ok: true, data: null });
    expect(verifyOtp).toHaveBeenCalledWith({ email: 'user@example.com', token: '123456', type: 'recovery' });
  });

  it('redirige /signup de façon permanente vers le mode inscription', () => {
    SignupRedirect();
    expect(mocks.permanentRedirect).toHaveBeenCalledWith('/login?mode=signup');
  });
});
