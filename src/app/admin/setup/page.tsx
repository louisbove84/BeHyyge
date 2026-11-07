import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SetupForm } from "@/components/setup-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ownerRecord, sessionSecret, setupTokenConfigured } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { isBlobConfigured } from "@/lib/store";

export const instant = false;

async function SetupBody() {
  await connection();
  if (!sessionSecret()) {
    return (
      <p>
        Add SESSION_SECRET before creating the owner sign-in. Use a random value of at least 32
        characters. Do not put it in the repository.
      </p>
    );
  }
  if (!isBlobConfigured()) {
    return (
      <p>
        Connect a private Vercel Blob store first. The owner password is stored there as a hash,
        not as readable text.
      </p>
    );
  }
  let existing: Awaited<ReturnType<typeof ownerRecord>> = null;
  let failure = "";
  try {
    existing = await ownerRecord();
  } catch (error) {
    failure = error instanceof HttpError ? error.message : "Setup could not be checked.";
  }
  if (failure) return <p>{failure}</p>;
  if (existing?.source === "env") {
    return (
      <p>
        Sign-in is controlled by OWNER_PASSWORD_HASH. This setup page stays closed while that
        variable is set.
      </p>
    );
  }
  if (existing) {
    return (
      <p>
        An owner sign-in already exists.{" "}
        <Link href="/admin/login" className="underline underline-offset-4">
          Go to sign-in
        </Link>
        .
      </p>
    );
  }
  if (!setupTokenConfigured()) {
    return (
      <div className="grid gap-3 text-sm leading-relaxed">
        <p>First-owner setup is locked until you add OWNER_SETUP_TOKEN.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Choose a long random string, at least 24 characters, and keep it to yourself.</li>
          <li>Add it as OWNER_SETUP_TOKEN on the project for Production and Preview.</li>
          <li>Redeploy, come back to this page, and paste the token to choose your password.</li>
          <li>After sign-in works, delete OWNER_SETUP_TOKEN so setup cannot be repeated.</li>
        </ol>
      </div>
    );
  }
  return <SetupForm />;
}

export default function SetupPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-md flex-1 px-5 py-12">
        <h1 className="font-heading text-4xl">Set up the owner</h1>
        <p className="mt-3 text-muted-foreground">
          There is no default password. You choose one here, and only a hash is stored.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p>Checking setup…</p>}>
            <SetupBody />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
