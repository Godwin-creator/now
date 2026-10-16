'use client'

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, minHeight: '100vh', background: '#f7f9fc', color: '#15274d', fontFamily: 'sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', gap: '16px', padding: '24px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>NowPay est momentanément indisponible</h1>
          <p style={{ margin: 0 }}>Réessayez dans quelques instants.</p>
          <button type="button" onClick={retry} style={{ minHeight: '44px', padding: '12px 20px', border: 0, background: '#15274d', color: 'white', fontWeight: 700 }}>Réessayer</button>
        </main>
      </body>
    </html>
  )
}