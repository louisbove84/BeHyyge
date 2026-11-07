import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getOwnerSession, ownerRecord, sessionSecret } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { isBlobConfigured } from "@/lib/store";

export const instant = false;

async function LoginBody() {
  await connection();
  if (!sessionSecret()) {
    return (
      <p className="text-sm leading-relaxed">
        Sign-in is waiting on SESSION_SECRET. Add a random value of at least 32 characters in the
        project environment, then redeploy. The value is not shown on this page.
      </p>
    );
  }
  const session = await getOwnerSession();
  if (session) redirect("/admin");
  let setupHint = true;
  let setupError = "";
  if (isBlobConfigured()) {
    try {
      const existing = await ownerRecord();
      setupHint = !existing;
    } catch (error) {
      setupError = error instanceof HttpError ? error.message : "The studio desk could not be checked.";
    }
  }
  if (setupError) return <p>{setupError}</p>;
  return (
    <div className="grid gap-6">
      <LoginForm />
      {setupHint ? (
        <p className="text-sm">
          <Link href="/admin/setup" className="underline underline-offset-4">
            First time here? Set up the owner sign-in.
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-md flex-1 px-5 py-12">
        <h1 className="font-heading text-4xl">Studio desk</h1>
        <p className="mt-3 text-muted-foreground">
          This sign-in is for the photographer. Clients use their private gallery link instead.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p>Loading sign-in…</p>}>
            <LoginBody />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
