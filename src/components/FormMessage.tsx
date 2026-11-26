export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (state?.error)
    return (
      <p role="alert" className="border-l-4 border-pole bg-paper px-3 py-2 text-sm text-ink">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p role="status" className="border-l-4 border-ok bg-paper px-3 py-2 text-sm text-ink">
        {state.ok}
      </p>
    );
  return null;
}
