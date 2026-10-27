'use client';

type AccessMode = 'login' | 'signup';

type AccessModeTabsProps = {
  mode: AccessMode;
  onModeChange: (mode: AccessMode) => void;
};

export default function AccessModeTabs({
  mode,
  onModeChange,
}: AccessModeTabsProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 'login'
        : event.key === 'End'
          ? 'signup'
          : event.key === 'ArrowRight'
            ? 'signup'
            : 'login';
    onModeChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Accès au compte"
      onKeyDown={handleKeyDown}
      className="mt-6 grid grid-cols-2 rounded-xl bg-now-bg p-1"
    >
      {(['login', 'signup'] as const).map((tab) => (
        <button
          key={tab}
          id={`tab-${tab}`}
          type="button"
          role="tab"
          aria-controls="access-form"
          aria-selected={mode === tab}
          tabIndex={mode === tab ? 0 : -1}
          onClick={() => onModeChange(tab)}
          className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${mode === tab ? 'bg-white text-now-blue shadow' : 'text-gray-600'}`}
        >
          {tab === 'login' ? 'Se connecter' : 'Créer un compte'}
        </button>
      ))}
    </div>
  );
}
