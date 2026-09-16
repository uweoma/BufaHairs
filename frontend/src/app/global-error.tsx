'use client';

import { useEffect } from 'react';

/**
 * Catches errors thrown in the root layout itself (the one place the normal
 * error.tsx boundary cannot reach). Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          color: '#18181B',
          background: '#FAFAFA',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ marginTop: '0.5rem', color: '#71717A', maxWidth: '28rem' }}>
          We hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            borderRadius: '9999px',
            background: '#5B21B6',
            color: '#fff',
            padding: '0.625rem 1.5rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
