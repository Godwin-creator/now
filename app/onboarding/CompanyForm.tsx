'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCompany } from '@/app/actions/auth';

export default function CompanyForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createCompany(name);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Impossible de créer l’entreprise. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <p
          role="alert"
          className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div>
        <label
          htmlFor="company-name"
          className="mb-1 block text-sm font-semibold text-gray-800"
        >
          Nom de l’entreprise
        </label>
        <input
          id="company-name"
          type="text"
          required
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-3 text-base"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 w-full rounded bg-now-blue px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        {loading ? 'Création…' : 'Continuer'}
      </button>
    </form>
  );
}
