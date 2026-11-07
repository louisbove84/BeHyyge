import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { GallerySettings } from "@/components/gallery-settings";
import { GalleryUploader } from "@/components/gallery-uploader";
import { OwnerPhotos } from "@/components/owner-photos";
import { SharePanel } from "@/components/share-panel";
import { listPhotos, requireGallery, toPhotoDto } from "@/lib/galleries";
import { HttpError } from "@/lib/http";
import { isId } from "@/lib/ids";
import { KIND_LABELS } from "@/lib/kinds";

export const instant = false;

async function GalleryDesk({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!isId(id)) notFound();
  let gallery: Awaited<ReturnType<typeof requireGallery>> | null = null;
  let photos: ReturnType<typeof toPhotoDto>[] = [];
  let errorMessage = "";
  try {
    gallery = await requireGallery(id);
    photos = (await listPhotos(id)).map(toPhotoDto);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    errorMessage = error instanceof HttpError ? error.message : "This gallery could not be opened.";
  }
  if (!gallery) return <p role="alert">{errorMessage}</p>;
  return (
    <div className="grid gap-8">
      <div>
        <Link href="/admin" className="text-sm underline underline-offset-4">
          All galleries
        </Link>
        <p className="mt-3 text-sm tracking-[0.14em] text-primary uppercase">
          {KIND_LABELS[gallery.kind]}
        </p>
        <h1 className="mt-2 font-heading text-4xl">{gallery.name}</h1>
      </div>
      <SharePanel id={gallery.id} shareToken={gallery.shareToken} hasPassword={Boolean(gallery.passwordHash)} />
      <GalleryUploader galleryId={gallery.id} />
      <section className="grid gap-3" aria-labelledby="photos-heading">
        <h2 id="photos-heading" className="font-heading text-2xl">
          In this gallery
        </h2>
        <OwnerPhotos galleryId={gallery.id} photos={photos} />
      </section>
      <section className="grid gap-3" aria-labelledby="details-heading">
        <h2 id="details-heading" className="font-heading text-2xl">
          Details
        </h2>
        <GallerySettings
          id={gallery.id}
          name={gallery.name}
          kind={gallery.kind}
          note={gallery.note}
          hasPassword={Boolean(gallery.passwordHash)}
        />
      </section>
    </div>
  );
}

export default function GalleryDeskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading the gallery…</p>}>
      <GalleryDesk params={params} />
    </Suspense>
  );
}
