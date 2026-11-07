# Be Hygge Photography

A private-gallery site for Brittany’s photography in Wisconsin. The public pages carry the studio name, the Hygge motto, and the original logo file at `public/brand/be-hygge-logo.jpg`. The photographer signs in, creates a named gallery, and uploads photographs from a phone or computer. Each client gets one unguessable link. They can view and download pictures without an account. A gallery can also ask for a password, and that password is required before the image bytes are sent.

The site starts in **preview**. Preview is a non-commercial testing mode: pages say so, bookings are closed, and client galleries are not listed. Set `STUDIO_MODE=open` later, when a launch is intended. That switch does not by itself change a Vercel plan.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Published design preview

This repository is the source at [github.com/louisbove84/BeHyyge](https://github.com/louisbove84/BeHyyge). The only published site is a free GitHub Pages design preview for reviewing layout. It is a noncommercial design concept: bookings are closed, the pictures are demo galleries only, and it does not take inquiries, payment, or client delivery.

`npm run build:pages` writes that preview to `out/`. The build keeps the original app in the repository and leaves the owner desk, client gallery links, and API routes out of the Pages artifact. It does not use Vercel, Blob storage, or a paid host. Leave `STUDIO_MODE` unset, or set it to `preview`, until a launch is a separate decision.

## Deployment

The owner desk described below is source for a later private gallery, and it is not part of the GitHub Pages preview. Do not attach this repository to a Vercel project to host a photography business. No plan is upgraded or purchased here. A full gallery host, if it is ever chosen, needs its own decision. Until then, run the full app locally with the commands above. The Pages workflow does not set `SESSION_SECRET`, `OWNER_SETUP_TOKEN`, or a Blob token.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Environment variables

Set these in the host’s environment, or in `.env.local` for local work. Do not commit values.

| Name | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Private Vercel Blob access. Created when the store is connected. Required for browser uploads. |
| `BLOB_STORE_ID` | Private Blob store id. Set by Vercel with the store connection. |
| `SESSION_SECRET` | Random string, at least 32 characters. Signs the httpOnly owner session and gallery-unlock cookies. |
| `OWNER_SETUP_TOKEN` | Random string, at least 24 characters. Used once on `/admin/setup`, then delete it. |
| `OWNER_PASSWORD_HASH` | Optional. A scrypt hash from `npm run hash-password`. If set, it is the owner password and `/admin/setup` stays closed. |
| `STUDIO_MODE` | `preview` (default) or `open`. Preview closes bookings, labels the site, and keeps galleries unlisted. `open` restores the booking page. |
| `STUDIO_NAME` | Public studio name. Default: Be Hygge Photography. |
| `STUDIO_PLACE` | Place shown with the name. Default: Wisconsin. |
| `STUDIO_PHOTOGRAPHER` | First name on the public pages. Default: Brittany. |
| `BOOKING_URL` | Optional `http` or `https` link for the booking page. |
| `CONTACT_EMAIL` | Optional email. The booking page becomes a mailto link. The site does not send mail. |
| `SITE_URL` | Optional canonical origin, such as `https://example.com`. |

Changing `STUDIO_NAME`, `STUDIO_PLACE`, `BOOKING_URL`, or `CONTACT_EMAIL` needs a new deployment so the pages pick up the values.

There is no default password. Do not put a password, token, or hash in the repository.

### First owner

1. Connect a **private** Vercel Blob store to the project so `BLOB_READ_WRITE_TOKEN` and `BLOB_STORE_ID` exist.
2. Set `SESSION_SECRET` and `OWNER_SETUP_TOKEN`.
3. Redeploy.
4. Open `/admin/setup`, paste the setup token, and choose a password of at least 12 characters.
5. Delete `OWNER_SETUP_TOKEN` after sign-in works.

Alternatively, run `npm run hash-password`, put the printed hash in `OWNER_PASSWORD_HASH`, and sign in at `/admin/login`.

## Upload from a phone

1. Sign in at `/admin` on the phone.
2. Create a gallery and open it.
3. Tap **Choose photographs** and select several pictures from the photo library.
4. Wait until each row says **Ready**. A failed row has **Retry**.
5. Tap **Copy link**. If the gallery has a password, tell the family that password in a separate message. It cannot be displayed again.

JPEG, PNG, WebP, and HEIC files up to 25 MB are accepted. The gallery shows a preview with camera location data removed. The original file is available only through the download link after the same access check.

## What a client does

1. Open the private link. No account is required.
2. If asked, enter the gallery password. The pictures and their download addresses stay blocked until it matches.
3. Tap a picture to view it, or tap **Download** for that original file.
4. On a phone, if the photo opens instead of saving, use the share sheet to keep the image.

Galleries are not listed on the public site. Client pages send `noindex`.

## Storage and cost

The GitHub Pages preview does not store photographs. In the full app, photographs and gallery records would live in one private Blob store. Metadata updates use compare-and-swap on individual JSON objects so two uploads do not clobber each other. Image bytes are never served from a public blob URL. The app streams them after checking the link and, when set, the password.

On the Hobby plan, Blob includes about 1 GB storage, 10,000 simple operations, 2,000 advanced operations, and 10 GB of Blob data transfer per month. Private delivery also uses function transfer, because the app reads the file and sends it to the browser. That is intentional: a public file URL would skip the password. Client uploads themselves do not count as upload data transfer. Multipart uploads count as more than one advanced operation.

Hobby does not let you buy extra Blob usage. If a limit is passed, Blob pauses until the allowance resets. Do not enable paid overages or change plans unless that charge is approved separately. Keep galleries modest and delete old ones. Browsing the store in the Vercel dashboard also uses advanced operations.

Vercel’s Hobby plan is for personal, non-commercial use. A paid photography business may need a different plan later. This project does not start that change.

## Later improvements

1. Let a family mark favorite photographs for prints.
2. Offer one zip of a gallery, after checking the transfer allowance.
3. Send the private link by email or text once a messaging service is chosen.
