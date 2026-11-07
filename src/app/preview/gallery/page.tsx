import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { publicPath } from "@/lib/public-path";
import { getSite } from "@/lib/site";

const frames = [
  { src: "/demo/frame-window.jpg", name: "Demo · Window light" },
  { src: "/demo/frame-linen.jpg", name: "Demo · Linen" },
  { src: "/demo/frame-bloom.jpg", name: "Demo · Color study" },
  { src: "/demo/frame-path.jpg", name: "Demo · Evening" },
];

export const metadata: Metadata = {
  title: "Preview gallery",
  robots: { index: false, follow: false },
};

export default function PreviewGalleryPage() {
  const site = getSite();
  if (!site.preview) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <p className="rounded-2xl bg-secondary px-4 py-3 text-sm leading-relaxed text-secondary-foreground" role="status">
          Preview gallery. These frames are labeled samples, not photographs of clients. This page
          is not a delivery link.
        </p>
        <p className="mt-6 text-sm tracking-[0.14em] text-primary uppercase">Sample</p>
        <h1 className="mt-2 font-heading text-4xl text-balance">A gallery, before any clients</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The grid is the layout a family would see. Nothing here is a real session.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {frames.map((frame) => (
            <li key={frame.src} className="grid gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicPath(frame.src)}
                alt={`${frame.name}. Not a client photograph.`}
                width={800}
                height={1000}
                className="aspect-[4/5] w-full rounded-xl object-cover"
              />
              <p className="truncate text-xs text-muted-foreground">{frame.name}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm">
          <Link href="/" className="underline underline-offset-4">
            {site.name}
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
