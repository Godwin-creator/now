'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setNewPassword, verifyRecoveryCode } from '@/app/actions/access';

export default function RecoveryForm({ email }: { email: string }) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busyRef.current) return; busyRef.current = true; setBusy(true); setError('');
    try {
      if (step === 'code') {
        const result = await verifyRecoveryCode(email, code);
        if (!result.ok) setError(result.error.message); else setStep('password');
      } else {
        const result = await setNewPassword(password);
        if (!result.ok) setError(result.error.message); else router.replace('/login?password=updated');
      }
    } catch { setError('Le service est indisponible. Réessayez.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-now-bg px-4 py-10"><section className="w-full max-w-md rounded-2xl border border-now-border bg-white p-6 shadow-xl sm:p-8">
    <Link href="/login" className="text-sm font-semibold text-now-blue">← Retour à la connexion</Link>
    <h1 className="mt-7 text-2xl font-black text-now-blue">{step === 'code' ? 'Code de récupération' : 'Choisir un nouveau mot de passe'}</h1>
    <p className="mt-2 text-sm text-gray-600">{step === 'code' ? `Si cette adresse correspond à un compte, un code de récupération a été envoyé à ${email}.` : 'Votre mot de passe doit contenir au moins 8 caractères.'}</p>
    <form className="mt-6 space-y-4" onSubmit={submit}>
      {step === 'code' ? <div><label htmlFor="recovery-code" className="mb-1 block text-sm font-semibold">Code à 6 chiffres</label><input ref={codeRef} id="recovery-code" required pattern="[0-9]{6}" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="min-h-12 w-full rounded-lg border border-now-border px-3" /></div> : <div><label htmlFor="new-password" className="mb-1 block text-sm font-semibold">Nouveau mot de passe</label><input ref={passwordRef} id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-12 w-full rounded-lg border border-now-border px-3" /></div>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="min-h-12 w-full rounded-lg bg-now-blue px-4 font-bold text-white disabled:opacity-60">{busy ? 'Veuillez patienter…' : step === 'code' ? 'Vérifier le code' : 'Enregistrer le mot de passe'}</button>
    </form>
  </section></main>;
}
