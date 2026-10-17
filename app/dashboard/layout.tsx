import { requireCompany } from '@/lib/auth';
import type { Metadata } from 'next';
import Sidebar from '@/app/components/Sidebar';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { company } = await requireCompany();

  return (
    <div className="flex h-screen w-full min-w-0 flex-col gap-4 bg-now-bg p-3 md:flex-row md:gap-6 md:p-4">
      <Sidebar companyName={company.nom} />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-now-surface p-4 shadow-sm md:rounded-3xl md:p-8">
        {children}
      </main>
    </div>
  );
}
