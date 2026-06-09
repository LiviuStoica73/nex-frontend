'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <h2 className="mb-3 text-center text-xl font-semibold">Something went wrong!</h2>
      <p className="mb-2 font-mono text-sm text-red-500">{error?.message || "Unknown error"}</p>
      <pre className="mb-5 max-w-2xl overflow-auto text-left text-xs text-muted-foreground">{error?.stack}</pre>
      <Button type="submit" variant="default" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}