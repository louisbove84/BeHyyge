"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendJson } from "@/lib/browser";
import { GALLERY_KINDS, KIND_LABELS } from "@/lib/kinds";

export function NewGalleryForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setPending(true);
        const form = new FormData(event.currentTarget);
        const result = await sendJson("/api/galleries", "POST", {
          name: String(form.get("name") ?? ""),
          kind: String(form.get("kind") ?? "family"),
          note: String(form.get("note") ?? ""),
          password: String(form.get("password") ?? ""),
        });
        setPending(false);
        const created = result.data as { gallery?: { id?: string } };
        if (!result.ok || !created.gallery?.id) {
          setError(result.error || "The gallery could not be created.");
          return;
        }
        router.push(`/admin/galleries/${created.gallery.id}`);
        router.refresh();
      }}
    >
      <div>
        <h2 className="font-heading text-2xl">New gallery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Name it for the session. A password is optional. Clients never need an account.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="gallery-name">Gallery name</Label>
        <Input id="gallery-name" name="name" required maxLength={80} placeholder="Sunday at home" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="gallery-kind">Session type</Label>
        <select
          id="gallery-kind"
          name="kind"
          className="h-11 rounded-lg border border-input bg-card px-3 text-base"
          defaultValue="family"
        >
          {GALLERY_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="gallery-note">Note for the client</Label>
        <Textarea id="gallery-note" name="note" maxLength={500} placeholder="Optional" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="gallery-password">Gallery password</Label>
        <Input
          id="gallery-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Leave blank to use the link alone"
        />
        <p className="text-sm text-muted-foreground">
          If you set one, tell the family separately. It cannot be shown again, only replaced.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create gallery"}
      </Button>
    </form>
  );
}
