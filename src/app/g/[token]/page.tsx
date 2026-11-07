import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ClientGallery } from "@/components/client-gallery";
import { PasswordGate } from "@/components/password-gate";
import { galleryIsOpen, getGalleryByShareToken, listPhotos, toPhotoDto } from "@/lib/galleries";
import { isShareToken } from "@/lib/ids";
import { KIND_LABELS } from "@/lib/kinds";
import { getSite } from "@/lib/site";

export const instant = false;

export const metadata: Metadata = {
  title: "Private gallery",
  robots: { index: false, follow: false, nocache: true },
};

async function GalleryBody({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  if (!isShareToken(token)) notFound();
  const gallery = await getGalleryByShareToken(token);
  if (!gallery) notFound();
  const open = await galleryIsOpen(gallery);
  const photos = open ? (await listPhotos(gallery.id)).map(toPhotoDto) : [];
  const site = getSite();

  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
      {site.preview ? (
        <p className="mb-6 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground" role="status">
          Preview link. This gallery is for testing. It is not a public client gallery, and it is
          not listed on the studio site.
        </p>
      ) : null}
      <p className="text-sm tracking-[0.14em] text-primary uppercase">{KIND_LABELS[gallery.kind]}</p>
      <h1 className="mt-2 font-heading text-4xl text-balance">{gallery.name}</h1>
      {gallery.note ? <p className="mt-3 max-w-2xl text-muted-foreground">{gallery.note}</p> : null}
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        This page is private. If a photograph opens instead of saving, use your phone’s share sheet
        to keep the image.
      </p>
      <div className="mt-8">
        {open ? (
          <ClientGallery token={token} photos={photos} />
        ) : (
          <div className="grid gap-4">
            <p>This gallery asks for a password before any photograph can be viewed or downloaded.</p>
            <PasswordGate token={token} />
          </div>
        )}
      </div>
      <p className="mt-10 text-sm">
        <Link href="/" className="underline underline-offset-4">
          {site.name}
        </Link>
      </p>
    </main>
  );
}

export default function ClientGalleryPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<p className="px-5 py-8">Opening the gallery…</p>}>
      <GalleryBody params={params} />
    </Suspense>
  );
}
