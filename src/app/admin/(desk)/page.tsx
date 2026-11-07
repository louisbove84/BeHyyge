import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { NewGalleryForm } from "@/components/new-gallery-form";
import { listGalleries } from "@/lib/galleries";
import { HttpError } from "@/lib/http";
import { KIND_LABELS } from "@/lib/kinds";
import { getSite } from "@/lib/site";

export const instant = false;

async function GalleryList() {
  await connection();
  let galleries: Awaited<ReturnType<typeof listGalleries>> = [];
  let errorMessage = "";
  try {
    galleries = await listGalleries();
  } catch (error) {
    errorMessage = error instanceof HttpError ? error.message : "Galleries could not be loaded.";
  }
  if (errorMessage) return <p role="alert">{errorMessage}</p>;
  if (galleries.length === 0) {
    return (
      <p className="text-muted-foreground">
        No galleries yet. Name one, then add photographs from your phone or computer.
      </p>
    );
  }
  return (
    <ul className="grid gap-3">
      {galleries.map((gallery) => (
        <li key={gallery.id}>
          <Link
            href={`/admin/galleries/${gallery.id}`}
            prefetch={false}
            className="block rounded-2xl border border-border bg-card px-4 py-4 hover:bg-accent"
          >
            <span className="font-heading text-2xl">{gallery.name}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {KIND_LABELS[gallery.kind]} · {gallery.photoCount} photographs
              {gallery.hasPassword ? " · password on" : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DeskPage() {
  const site = getSite();
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="order-2 lg:order-1" aria-labelledby="galleries-heading">
        <h1 id="galleries-heading" className="font-heading text-4xl">
          Galleries
        </h1>
        <p className="mt-2 text-muted-foreground">
          These stay off the public site. Only someone with the private link can open one.
          {site.preview
            ? " The public pages are in preview, so visitors are not asked to book."
            : ""}
        </p>
        <div className="mt-6">
          <Suspense fallback={<p>Loading galleries…</p>}>
            <GalleryList />
          </Suspense>
        </div>
      </section>
      <div className="order-1 lg:order-2">
        <NewGalleryForm />
      </div>
    </div>
  );
}
