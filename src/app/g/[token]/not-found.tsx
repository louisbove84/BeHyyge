import Link from "next/link";

export default function GalleryNotFound() {
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-5 py-16">
      <h1 className="font-heading text-4xl">This link does not open a gallery</h1>
      <p className="mt-3 text-muted-foreground">
        Check the address you were sent. Private galleries are not listed anywhere on the site.
      </p>
      <Link href="/" className="mt-6 inline-block underline underline-offset-4">
        Studio
      </Link>
    </main>
  );
}
