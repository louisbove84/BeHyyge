import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-xl flex-1 px-5 py-16">
        <h1 className="font-heading text-4xl">That page is not here</h1>
        <p className="mt-3 text-muted-foreground">
          The link may be old, or the address may have been mistyped.
        </p>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">
          Back to the studio
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
