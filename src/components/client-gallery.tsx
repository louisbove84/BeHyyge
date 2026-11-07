"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PhotoDto } from "@/lib/photo-view";

export function ClientGallery(props: { token: string; photos: PhotoDto[] }) {
  const ready = props.photos.filter((photo) => photo.status === "ready");
  const [openId, setOpenId] = useState<string | null>(null);
  const currentIndex = ready.findIndex((photo) => photo.id === openId);
  const current = currentIndex >= 0 ? ready[currentIndex] : null;

  useEffect(() => {
    if (!current) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        const next = ready[(currentIndex + 1) % ready.length];
        if (next) setOpenId(next.id);
      }
      if (event.key === "ArrowLeft") {
        const previous = ready[(currentIndex - 1 + ready.length) % ready.length];
        if (previous) setOpenId(previous.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, currentIndex, ready]);

  if (ready.length === 0) {
    return (
      <p className="text-muted-foreground">
        Photographs will appear here when they are ready.
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ready.map((photo) => {
          const src = `/api/media/${props.token}/${photo.id}`;
          const download = `/api/media/${props.token}/${photo.id}/original`;
          return (
            <li key={photo.id} data-photo-id={photo.id} className="grid gap-2">
              <button
                type="button"
                className="overflow-hidden rounded-xl bg-muted text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => setOpenId(photo.id)}
              >
                {/* Private bytes must stay on this origin so the password cookie is checked. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={photo.originalName}
                  width={photo.width ?? 4}
                  height={photo.height ?? 5}
                  className="aspect-[4/5] w-full object-cover"
                />
              </button>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">{photo.originalName}</p>
                <a className="shrink-0 text-sm underline underline-offset-4" href={download}>
                  Download
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      <Dialog open={Boolean(current)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="sm:max-w-4xl">
          {current ? (
            <>
              <DialogHeader>
                <DialogTitle>{current.originalName}</DialogTitle>
                <DialogDescription>
                  Use the arrows to move through the gallery. Download keeps the original file.
                </DialogDescription>
              </DialogHeader>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media/${props.token}/${current.id}`}
                alt={current.originalName}
                className="max-h-[68vh] w-full rounded-lg object-contain"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const previous = ready[(currentIndex - 1 + ready.length) % ready.length];
                    if (previous) setOpenId(previous.id);
                  }}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = ready[(currentIndex + 1) % ready.length];
                    if (next) setOpenId(next.id);
                  }}
                >
                  Next
                </Button>
                <Button
                  render={
                    <a href={`/api/media/${props.token}/${current.id}/original`} />
                  }
                >
                  Download original
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
