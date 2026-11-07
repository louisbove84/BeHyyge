"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendJson } from "@/lib/browser";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await sendJson("/api/auth/logout", "POST");
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
