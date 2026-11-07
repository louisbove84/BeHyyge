import Link from "next/link";
import { publicPath } from "@/lib/public-path";
import { getSite } from "@/lib/site";

function InstagramLink({ className }: { className?: string }) {
  const site = getSite();
  return (
    <a href={site.instagramUrl} className={className} rel="noopener noreferrer" target="_blank">
      Instagram
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function SiteHeader() {
  const site = getSite();
  return (
    <header className="border-b border-border/80">
      {site.preview ? (
        <p className="bg-secondary px-5 py-3 text-center text-sm leading-relaxed text-balance text-secondary-foreground" role="status">
          Noncommercial design concept. Bookings are closed. Demo galleries only.
        </p>
      ) : null}
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex min-h-11 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicPath("/brand/be-hygge-logo.jpg")}
            alt=""
            width={1195}
            height={896}
            className="h-28 w-auto max-w-[46vw] shrink-0 sm:h-32"
          />
          <span className="font-heading text-2xl leading-none tracking-tight">
            Be Hygge
            <span className="mt-1 block font-sans text-[0.7rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Photography
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          <Link href="/#sessions" className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline">
            Sessions
          </Link>
          <Link href="/#sharing" className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline">
            Sharing
          </Link>
          {site.preview ? null : (
            <Link href="/book" className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline">
              Book
            </Link>
          )}
          <InstagramLink className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline" />
          {process.env.STATIC_PREVIEW === "1" ? null : (
            <Link href="/admin" prefetch={false} className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline">
              Studio desk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const site = getSite();
  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {site.name}
          <span aria-hidden="true"> · </span>
          <span>{site.photographer}</span>
          <span aria-hidden="true"> · </span>
          <span>{site.place}</span>
        </p>
        <div className="flex flex-col gap-2 sm:items-end">
          <InstagramLink className="inline-flex min-h-11 items-center underline underline-offset-4" />
          <p>
            {site.preview
              ? "Noncommercial design concept. Bookings are closed. Demo galleries only."
              : "Private galleries. No client account."}
          </p>
        </div>
      </div>
    </footer>
  );
}
