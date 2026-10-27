'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/app/actions/auth';
import { requestPasswordReset, signIn } from '@/app/actions/access';
import AccessModeTabs from './AccessModeTabs';
import AccessCredentialsFields from './AccessCredentialsFields';
import GoogleOAuthSection from './GoogleOAuthSection';

type Mode = 'login' | 'signup' | 'forgot';
export default function AccessForm({
  initialMode,
  passwordUpdated = false,
}: {
  initialMode: 'login' | 'signup';
  passwordUpdated?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [legal, setLegal] = useState(false);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const signup = mode === 'signup';
  const forgot = mode === 'forgot';
  const tabMode = signup ? 'signup' : 'login';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (forgot) {
        const result = await requestPasswordReset(email);
        if (!result.ok) setError(result.error.message);
        else {
          setNotice(result.data.message);
          router.push(`/login/recovery?email=${encodeURIComponent(email)}`);
        }
      } else if (signup) {
        const result = await signUp(email, password, legal, rights);
        if (!result.ok) setError(result.error.message);
        else if (result.data.verificationRequired)
          router.push(`/signup/verify?email=${encodeURIComponent(email)}`);
        else router.push('/onboarding');
      } else {
        const result = await signIn(email, password);
        if (!result.ok) {
          setError(result.error.message);
          if (result.error.code === 'email_not_confirmed')
            router.push(
              `/signup/verify?email=${encodeURIComponent(email)}&resend=1`,
            );
        } else
          router.push(
            result.data.confirmationRequired
              ? `/signup/verify?email=${encodeURIComponent(email)}&resend=1`
              : '/onboarding',
          );
      }
    } catch {
      setError('Le service est indisponible. Réessayez.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const focusInvalid = (event: React.FormEvent<HTMLFormElement>) => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      event.preventDefault();
      emailRef.current?.focus();
      return;
    }
    if (!forgot && password.length < 8) {
      event.preventDefault();
      passwordRef.current?.focus();
      return;
    }
    if (signup && (!legal || !rights)) event.preventDefault();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-now-bg px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-now-border bg-white p-6 shadow-xl sm:p-8">
        <Link href="/" className="text-sm font-semibold text-now-blue">
          ← Retour à l’accueil
        </Link>
        <p className="mt-7 text-xs font-bold uppercase tracking-widest text-now-blue-light">
          NowPay
        </p>
        <h1 className="mt-2 text-2xl font-black text-now-blue">
          {forgot ? 'Mot de passe oublié' : 'Accédez à votre espace'}
        </h1>
        {passwordUpdated && (
          <p role="status" className="mt-3 text-sm text-green-800">
            Votre mot de passe a été modifié. Vous pouvez vous connecter.
          </p>
        )}
        {!forgot && (
          <AccessModeTabs
            mode={tabMode}
            onModeChange={(next) => {
              setMode(next);
              setError('');
            }}
          />
        )}
        <form
          id="access-form"
          aria-labelledby={!forgot ? `tab-${mode}` : undefined}
          className="mt-6 space-y-4"
          onSubmit={submit}
          onInvalidCapture={focusInvalid}
        >
          <AccessCredentialsFields
            email={email}
            onEmailChange={setEmail}
            emailRef={emailRef}
            password={password}
            onPasswordChange={setPassword}
            passwordRef={passwordRef}
            visible={visible}
            onVisibleChange={setVisible}
            signup={signup}
            forgot={forgot}
            legal={legal}
            onLegalChange={setLegal}
            rights={rights}
            onRightsChange={setRights}
          />
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-green-800">
              {notice}
            </p>
          )}
          <button
            disabled={busy}
            className="min-h-12 w-full rounded-lg bg-now-blue px-4 font-bold text-white disabled:opacity-60"
          >
            {busy
              ? 'Veuillez patienter…'
              : forgot
                ? 'Envoyer le code'
                : signup
                  ? 'Créer mon compte'
                  : 'Se connecter'}
          </button>
        </form>
        {!forgot && (
          <GoogleOAuthSection
            signup={signup}
            legal={legal}
            rights={rights}
            disabled={busy}
            onError={setError}
          />
        )}
        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError('');
            }}
            className="mt-4 min-h-11 text-sm font-semibold text-now-blue underline"
          >
            Mot de passe oublié ?
          </button>
        )}
        {forgot && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="mt-4 min-h-11 text-sm font-semibold text-now-blue underline"
          >
            Retour à la connexion
          </button>
        )}
      </section>
    </main>
  );
}
