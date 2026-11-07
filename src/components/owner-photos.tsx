"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendJson } from "@/lib/browser";
import type { PhotoDto } from "@/lib/photo-view";

export function OwnerPhotos(props: { galleryId: string; photos: PhotoDto[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  if (props.photos.length === 0) {
    return <p className="text-sm text-muted-foreground">No photographs in this gallery yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {props.photos.map((photo) => (
          <li key={photo.id} className="rounded-xl border border-border bg-card p-2">
            <p className="truncate text-sm font-medium">{photo.originalName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {photo.status === "ready"
                ? "Ready to share"
                : photo.status === "failed"
                  ? photo.error || "Preview failed"
                  : "Waiting for the file"}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={async () => {
                const result = await sendJson(
                  `/api/galleries/${props.galleryId}/photos/${photo.id}`,
                  "DELETE",
                );
                if (!result.ok) {
                  setError(result.error || "The photograph could not be removed.");
                  return;
                }
                router.refresh();
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
