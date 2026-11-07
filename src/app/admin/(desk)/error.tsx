"use client";

export default function DeskError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-5 py-8">
      <h1 className="font-heading text-3xl">The studio desk hit a problem</h1>
      <p className="mt-2 text-muted-foreground">Try again. If it keeps happening, check the storage connection.</p>
      <button type="button" className="mt-4 underline" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
