"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendJson } from "@/lib/browser";

export function PasswordGate({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mx-auto grid max-w-md gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setPending(true);
        const form = new FormData(event.currentTarget);
        const result = await sendJson(`/api/share/${token}/unlock`, "POST", {
          password: String(form.get("password") ?? ""),
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error || "That password did not match.");
          return;
        }
        router.refresh();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="gallery-password">Gallery password</Label>
        <Input
          id="gallery-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Open gallery"}
      </Button>
    </form>
  );
}
