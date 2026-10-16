'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resendSignupCode, verifySignupCode } from '@/app/actions/auth';

export default function VerifyCodeForm({
  email,
  canResendImmediately,
}: {
  email: string;
  canResendImmediately: boolean;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(canResendImmediately ? 0 : 60);
  const router = useRouter();

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = window.setTimeout(
      () => setSecondsLeft((seconds) => seconds - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await verifySignupCode(email, code);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.replace('/onboarding');
      router.refresh();
    } catch {
      setError('La vérification est temporairement indisponible. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setNotice(null);

    try {
      const result = await resendSignupCode(email);
      if (!result.success) {
        setError(result.error);
        if (result.error.startsWith('Trop de demandes')) setSecondsLeft(60);
        return;
      }
      setSecondsLeft(60);
      setNotice('Un nouveau code vient de vous être envoyé.');
    } catch {
      setError(
        'Impossible d’envoyer le code pour le moment. Réessayez plus tard.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <p
            role="alert"
            className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {notice}
          </p>
        )}
        <div>
          <label
            htmlFor="signup-code"
            className="mb-1 block text-sm font-semibold text-gray-800"
          >
            Code de confirmation
          </label>
          <input
            id="signup-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{8}"
            minLength={8}
            maxLength={8}
            required
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, '').slice(0, 8))
            }
            className="w-full rounded border border-gray-300 px-3 py-3 text-center text-2xl tracking-[0.5em]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 w-full rounded bg-now-blue px-4 py-3 font-bold text-white disabled:opacity-60"
        >
          {loading ? 'Vérification…' : 'Confirmer mon adresse e-mail'}
        </button>
      </form>
      <button
        type="button"
        onClick={handleResend}
        disabled={resending || secondsLeft > 0}
        className="min-h-11 w-full px-3 py-2 text-sm font-semibold text-now-blue underline disabled:cursor-not-allowed disabled:text-gray-500"
      >
        {resending
          ? 'Envoi en cours…'
          : secondsLeft > 0
            ? `Renvoyer le code dans ${secondsLeft} s`
            : 'Renvoyer le code'}
      </button>
    </div>
  );
}
