"use client";

export default function GalleryError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="px-5 py-16">
      <h1 className="font-heading text-3xl">The gallery could not be opened</h1>
      <button type="button" className="mt-4 underline" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
