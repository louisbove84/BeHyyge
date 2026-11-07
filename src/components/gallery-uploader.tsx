"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { sendJson } from "@/lib/browser";
import { validateImageUpload } from "@/lib/files";

type Item = {
  key: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  error?: string;
  photoId?: string;
  pathname?: string;
  contentType?: string;
  uploaded?: boolean;
};

function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : "The upload did not finish.";
  if (/token|secret|blob\.vercel-storage|vercel_blob/i.test(message)) {
    return "The upload did not finish. Retry this photograph.";
  }
  return message.slice(0, 220);
}

export function GalleryUploader({ galleryId }: { galleryId: string }) {
  const router = useRouter();
  const itemsRef = useRef<Item[]>([]);
  const pumping = useRef(false);
  const [items, setItems] = useState<Item[]>([]);
  const [live, setLive] = useState("");

  function commit(next: Item[]) {
    itemsRef.current = next;
    setItems(next);
  }

  function patch(key: string, update: Partial<Item>) {
    commit(itemsRef.current.map((item) => (item.key === key ? { ...item, ...update } : item)));
  }

  async function uploadOne(item: Item) {
    patch(item.key, { status: "uploading", progress: 0, error: undefined });
    try {
      let photoId = item.photoId;
      let pathname = item.pathname;
      let contentType = item.contentType;
      if (!photoId || !pathname || !contentType) {
        const prepared = await sendJson(`/api/galleries/${galleryId}/photos`, "POST", {
          name: item.file.name,
          type: item.file.type,
          size: item.file.size,
        });
        const payload = prepared.data as { photoId?: string; pathname?: string; contentType?: string };
        if (!prepared.ok || !payload.photoId || !payload.pathname || !payload.contentType) {
          throw new Error(prepared.error || "The photograph could not be reserved.");
        }
        photoId = payload.photoId;
        pathname = payload.pathname;
        contentType = payload.contentType;
        patch(item.key, { photoId, pathname, contentType });
      }
      const current = itemsRef.current.find((entry) => entry.key === item.key);
      if (!current?.uploaded) {
        await upload(pathname, item.file, {
          access: "private",
          handleUploadUrl: `/api/galleries/${galleryId}/upload`,
          clientPayload: JSON.stringify({ photoId }),
          contentType,
          multipart: item.file.size > 6 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            patch(item.key, { progress: Math.round(percentage) });
          },
        });
        patch(item.key, { uploaded: true, progress: 100, status: "processing" });
      } else {
        patch(item.key, { status: "processing", progress: 100 });
      }
      const finished = await sendJson(
        `/api/galleries/${galleryId}/photos/${photoId}/finalize`,
        "POST",
      );
      if (!finished.ok) throw new Error(finished.error || "The preview could not be prepared.");
      patch(item.key, { status: "done", progress: 100 });
      setLive(`${item.file.name} is ready.`);
    } catch (error) {
      const message = readableError(error);
      patch(item.key, { status: "error", error: message });
      setLive(`${item.file.name} needs a retry. ${message}`);
    }
  }

  async function pump() {
    if (pumping.current) return;
    pumping.current = true;
    try {
      while (itemsRef.current.some((item) => item.status === "queued")) {
        const batch = itemsRef.current.filter((item) => item.status === "queued").slice(0, 3);
        await Promise.all(batch.map((item) => uploadOne(item)));
      }
    } finally {
      pumping.current = false;
      if (itemsRef.current.some((item) => item.status === "queued")) {
        void pump();
      } else if (itemsRef.current.some((item) => item.status === "done")) {
        router.refresh();
      }
    }
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...itemsRef.current];
    for (const file of Array.from(list).slice(0, 40)) {
      const checked = validateImageUpload({ name: file.name, type: file.type, size: file.size });
      next.push({
        key: crypto.randomUUID(),
        file,
        progress: 0,
        status: checked.ok ? "queued" : "error",
        error: checked.ok ? undefined : checked.error,
      });
    }
    if (list.length > 40) {
      setLive("Only the first 40 photographs in that selection were added. Add the rest in another pass.");
    }
    commit(next);
    void pump();
  }

  return (
    <section className="grid gap-4" aria-labelledby="upload-heading">
      <div>
        <h2 id="upload-heading" className="font-heading text-2xl">
          Add photographs
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          On a phone, choose pictures from your photo library. You can select several at once. Each one
          shows progress. If one fails, retry that photograph. Originals stay private. The gallery shows a
          preview with location data removed.
        </p>
      </div>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center">
        <span className="font-medium">Choose photographs</span>
        <span className="mt-1 max-w-sm text-sm text-muted-foreground">
          JPEG, PNG, WebP, or HEIC. Up to 25 MB each.
        </span>
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
          multiple
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {items.length > 0 ? (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.key} className="rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-medium">{item.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.status === "uploading"
                    ? `Uploading ${item.progress}%`
                    : item.status === "processing"
                      ? "Preparing a private preview…"
                      : item.status === "done"
                        ? "Ready"
                        : item.status === "error"
                          ? "Needs a retry"
                          : "Waiting"}
                </p>
              </div>
              <progress className="mt-2" value={item.progress} max={100}>
                {item.progress}%
              </progress>
              {item.error ? <p className="mt-2 text-sm text-destructive">{item.error}</p> : null}
              {item.status === "error" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    patch(item.key, { status: "queued", error: undefined });
                    void pump();
                  }}
                >
                  Retry
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </section>
  );
}
