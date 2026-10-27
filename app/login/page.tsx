import type { Metadata } from 'next';
import AccessForm from './AccessForm';
import { resolveLoginMode } from '@/lib/auth/login-mode';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; password?: string }>;
}) {
  const { mode, password } = await searchParams;
  return <AccessForm initialMode={resolveLoginMode(mode)} passwordUpdated={password === 'updated'} />;
}
