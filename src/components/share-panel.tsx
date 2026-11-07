"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendJson } from "@/lib/browser";

export function SharePanel(props: { id: string; shareToken: string; hasPassword: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const path = `/g/${props.shareToken}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setMessage("Link copied.");
      setError("");
    } catch {
      setError("Copy was blocked. Select the link and copy it yourself.");
    }
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-card p-4" aria-labelledby="share-heading">
      <div>
        <h2 id="share-heading" className="font-heading text-2xl">
          Private link
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send this to the family. They do not create an account.
          {props.hasPassword ? " They will also need the password you chose." : " The link itself opens the gallery."}
        </p>
      </div>
      <label className="grid gap-2 text-sm font-medium" htmlFor="share-link">
        Gallery link
        <Input id="share-link" readOnly value={path} onFocus={(event) => event.currentTarget.select()} />
        <span className="font-normal text-muted-foreground">Copy link adds this site’s address.</span>
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void copy()}>
          Copy link
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={async () => {
            if (!window.confirm("Replace the link? The old one will stop working.")) return;
            setPending(true);
            setError("");
            const result = await sendJson(`/api/galleries/${props.id}`, "PATCH", { regenerateShare: true });
            setPending(false);
            if (!result.ok) {
              setError(result.error || "The link could not be replaced.");
              return;
            }
            setMessage("A new link is ready. Copy it again.");
            router.refresh();
          }}
        >
          {pending ? "Replacing…" : "Make a new link"}
        </Button>
      </div>
      <p className="text-sm" role="status">
        {message}
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
