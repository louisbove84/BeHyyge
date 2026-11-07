"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendJson } from "@/lib/browser";
import { GALLERY_KINDS, KIND_LABELS, type GalleryKind } from "@/lib/kinds";

export function GallerySettings(props: {
  id: string;
  name: string;
  kind: GalleryKind;
  note: string;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState(false);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setPending(true);
        const form = new FormData(event.currentTarget);
        const result = await sendJson(`/api/galleries/${props.id}`, "PATCH", {
          name: String(form.get("name") ?? ""),
          kind: String(form.get("kind") ?? props.kind),
          note: String(form.get("note") ?? ""),
          password: String(form.get("password") ?? ""),
          clearPassword: form.get("clearPassword") === "on",
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error || "The gallery could not be saved.");
          return;
        }
        router.refresh();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="edit-name">Gallery name</Label>
        <Input id="edit-name" name="name" required maxLength={80} defaultValue={props.name} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-kind">Session type</Label>
        <select
          id="edit-kind"
          name="kind"
          defaultValue={props.kind}
          className="h-11 rounded-lg border border-input bg-card px-3 text-base"
        >
          {GALLERY_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-note">Note for the client</Label>
        <Textarea id="edit-note" name="note" maxLength={500} defaultValue={props.note} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-password">New gallery password</Label>
        <Input id="edit-password" name="password" type="password" autoComplete="new-password" />
        <p className="text-sm text-muted-foreground">
          {props.hasPassword
            ? "A password is on. Leave this blank to keep it, or type a new one."
            : "No password yet. The private link is the only gate."}
        </p>
        {props.hasPassword ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="clearPassword" className="size-4" />
            Remove the password
          </label>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
        <Dialog>
          <DialogTrigger render={<Button type="button" variant="destructive" />}>
            Delete gallery
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this gallery?</DialogTitle>
              <DialogDescription>
                The private link stops working, and the photographs are removed from storage.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                disabled={removing}
                onClick={async () => {
                  setRemoving(true);
                  const result = await sendJson(`/api/galleries/${props.id}`, "DELETE");
                  setRemoving(false);
                  if (!result.ok) {
                    setError(result.error || "The gallery could not be deleted.");
                    return;
                  }
                  router.push("/admin");
                  router.refresh();
                }}
              >
                {removing ? "Deleting…" : "Delete gallery"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}
