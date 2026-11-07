"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendJson } from "@/lib/browser";

export function SetupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        const password = String(form.get("password") ?? "");
        const confirm = String(form.get("confirm") ?? "");
        if (password !== confirm) {
          setError("The two passwords do not match.");
          return;
        }
        setPending(true);
        const result = await sendJson("/api/auth/setup", "POST", {
          token: String(form.get("token") ?? ""),
          password,
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error || "Setup could not be finished.");
          return;
        }
        router.push("/admin");
        router.refresh();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="token">Setup token</Label>
        <Input id="token" name="token" type="password" autoComplete="off" required minLength={24} />
        <p className="text-sm text-muted-foreground">
          Paste the value of OWNER_SETUP_TOKEN from the project environment. It is not shown here.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password you will remember</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create owner sign-in"}
      </Button>
    </form>
  );
}
