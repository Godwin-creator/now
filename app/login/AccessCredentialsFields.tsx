'use client';

import Link from 'next/link';
import type { RefObject } from 'react';

type AccessCredentialsFieldsProps = {
  email: string;
  onEmailChange: (email: string) => void;
  emailRef: RefObject<HTMLInputElement | null>;
  password: string;
  onPasswordChange: (password: string) => void;
  passwordRef: RefObject<HTMLInputElement | null>;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  signup: boolean;
  forgot: boolean;
  legal: boolean;
  onLegalChange: (accepted: boolean) => void;
  rights: boolean;
  onRightsChange: (confirmed: boolean) => void;
};

export default function AccessCredentialsFields({
  email,
  onEmailChange,
  emailRef,
  password,
  onPasswordChange,
  passwordRef,
  visible,
  onVisibleChange,
  signup,
  forgot,
  legal,
  onLegalChange,
  rights,
  onRightsChange,
}: AccessCredentialsFieldsProps) {
  return (
    <>
      <div>
        <label
          htmlFor="access-email"
          className="mb-1 block text-sm font-semibold"
        >
          Adresse e-mail
        </label>
        <input
          ref={emailRef}
          id="access-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="min-h-12 w-full rounded-lg border border-now-border px-3"
        />
      </div>
      {!forgot && (
        <div>
          <label
            htmlFor="access-password"
            className="mb-1 block text-sm font-semibold"
          >
            Mot de passe
          </label>
          <div className="flex rounded-lg border border-now-border">
            <input
              ref={passwordRef}
              id="access-password"
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete={signup ? 'new-password' : 'current-password'}
              minLength={8}
              required
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="min-h-12 min-w-0 flex-1 rounded-l-lg px-3 outline-none"
            />
            <button
              type="button"
              aria-label={
                visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
              }
              onClick={() => onVisibleChange(!visible)}
              className="min-h-11 min-w-11 px-3 text-sm font-semibold text-now-blue"
            >
              {visible ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </div>
      )}
      {signup && (
        <div className="space-y-3 text-sm">
          <label htmlFor="signup-legal" className="flex gap-3">
            <input
              id="signup-legal"
              type="checkbox"
              required
              checked={legal}
              onChange={(event) => onLegalChange(event.target.checked)}
              className="mt-1 size-4"
            />
            <span>
              J’accepte les{' '}
              <Link href="/cgu" className="underline">
                conditions d’utilisation
              </Link>{' '}
              et la{' '}
              <Link href="/confidentialite" className="underline">
                politique de confidentialité
              </Link>
              .
            </span>
          </label>
          <label htmlFor="signup-rights" className="flex gap-3">
            <input
              id="signup-rights"
              type="checkbox"
              required
              checked={rights}
              onChange={(event) => onRightsChange(event.target.checked)}
              className="mt-1 size-4"
            />
            <span>
              Je confirme être autorisé à traiter les données de mes clients
              pour gérer les relances.
            </span>
          </label>
        </div>
      )}
    </>
  );
}
