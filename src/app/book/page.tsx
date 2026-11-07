import type { Metadata } from "next";
import { BookingForm } from "@/components/booking-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { getSite } from "@/lib/site";

const siteInfo = getSite();

export const metadata: Metadata = {
  title: siteInfo.preview ? "Bookings are not open" : "Plan a session",
  description: siteInfo.preview
    ? "This non-commercial preview does not accept session requests."
    : "Ask about a family session, portrait, milestone, gathering, or team photograph.",
  robots: siteInfo.preview ? { index: false, follow: false } : undefined,
};

export default function BookPage() {
  const site = getSite();
  const mailto = site.contactEmail
    ? `mailto:${site.contactEmail}?subject=${encodeURIComponent("Session inquiry")}`
    : null;

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Booking</p>
        <h1 className="mt-3 font-heading text-4xl text-balance sm:text-5xl">
          {site.preview ? "Bookings are not open" : "Plan a session"}
        </h1>
        {site.preview ? (
          <div className="mt-4 grid gap-4 text-lg text-muted-foreground">
            <p>
              This is a non-commercial preview of {site.name}. It does not solicit a paid session
              and it does not accept a request.
            </p>
            <p>
              Photographs by {site.photographer} in {site.place}. {site.motto}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-lg text-muted-foreground">
            Family sessions, portraits, milestones, gatherings, and team photos. Share a little about
            who will be there and when you hope to meet.
          </p>
        )}
        {site.preview ? null : (
        <div className="mt-8">
          {site.bookingUrl ? (
            <div className="grid gap-3">
              <p>The booking link below is the one saved in the site settings.</p>
              <Button render={<a href={site.bookingUrl} />}>Continue to booking</Button>
            </div>
          ) : mailto ? (
            <div className="grid gap-3">
              <p>Email is the way to reach the studio. Your mail app opens; this site does not send the message itself.</p>
              <Button render={<a href={mailto} />}>Email about a session</Button>
            </div>
          ) : (
            <BookingForm />
          )}
        </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
