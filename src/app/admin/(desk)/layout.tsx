import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { getOwnerSession } from "@/lib/auth";

export const instant = false;

async function Gate({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getOwnerSession();
  if (!session) redirect("/admin/login");
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="font-heading text-2xl">
          Studio desk
        </Link>
        <SignOutButton />
      </div>
      {children}
    </div>
  );
}

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="px-5 py-8">Opening the studio desk…</p>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
