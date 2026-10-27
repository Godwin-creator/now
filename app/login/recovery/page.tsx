import RecoveryForm from './RecoveryForm';

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <RecoveryForm email={email ?? ''} />;
}
