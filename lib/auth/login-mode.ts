export type LoginMode = 'login' | 'signup';

export function resolveLoginMode(mode: string | undefined): LoginMode {
  return mode === 'signup' ? 'signup' : 'login';
}
