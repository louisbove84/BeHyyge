import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { publicPath } from "@/lib/public-path";
import { getSite } from "@/lib/site";

const frames = [
  {
    src: "/demo/frame-window.jpg",
    alt: "Demo frame, not a client photograph. Warm light across a quiet table.",
    caption: "Window light",
  },
  {
    src: "/demo/frame-linen.jpg",
    alt: "Demo frame, not a client photograph. Folded linen in warm shadow.",
    caption: "Linen",
  },
  {
    src: "/demo/frame-bloom.jpg",
    alt: "Demo frame, not a client photograph. Soft mauve and lavender color fields.",
    caption: "Color study",
  },
  {
    src: "/demo/frame-path.jpg",
    alt: "Demo frame, not a client photograph. Vertical bands of evening light.",
    caption: "Evening",
  },
];

const sessions = [
  {
    title: "Family sessions",
    text: "Parents, children, and the people who belong in the same frame.",
  },
  {
    title: "Portraits",
    text: "A quieter sitting for one person, or two.",
  },
  {
    title: "Milestones",
    text: "Newborn days, birthdays, graduations, and the years in between.",
  },
  {
    title: "Gatherings",
    text: "Reunions, dinners, and celebrations you want to keep.",
  },
  {
    title: "Team photos",
    text: "A simple group portrait for a team, class, or small organization.",
  },
];

export default function HomePage() {
  const site = getSite();
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-8 pt-8 md:grid-cols-12 md:gap-12 md:pt-14">
          <figure className="md:order-2 md:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicPath("/brand/be-hygge-logo.jpg")}
              alt="Be Hygge Photography"
              width={1195}
              height={896}
              className="mx-auto h-auto w-full max-w-md"
            />
          </figure>
          <div className="md:order-1 md:col-span-7">
            <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">
              {site.photographer} · {site.place}
            </p>
            <h1 className="mt-3 font-heading text-4xl leading-[1.08] text-balance sm:text-6xl">
              {site.name}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-foreground">{site.motto}</p>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
              Photographs of families, portraits, milestones, gatherings, and teams. A private link
              is how pictures are shared. No account to create.
            </p>
            {site.preview ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                This is a noncommercial design concept. Bookings are closed. The frames below are demo
                galleries only, not photographs of clients.
              </p>
            ) : null}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {site.preview ? (
                <Button render={<Link href="/#sharing" />}>How a gallery is shared</Button>
              ) : (
                <Button render={<Link href="/book" />}>Plan a session</Button>
              )}
              <Button variant="outline" render={<Link href="/#sessions" />}>
                See session types
              </Button>
            </div>
          </div>
        </section>

        <section id="sessions" className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="font-heading text-3xl sm:text-4xl">Sessions</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A gallery can hold family photographs, portraits, milestones, gatherings, or a team.
          </p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {sessions.map((session) => (
              <div key={session.title} className="border-t border-border pt-4">
                <dt className="font-heading text-2xl">{session.title}</dt>
                <dd className="mt-2 text-muted-foreground">{session.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="sharing" className="mx-auto max-w-6xl px-5 py-8">
          <h2 className="font-heading text-3xl sm:text-4xl">How a gallery is shared</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            <li className="rounded-2xl bg-card p-4">
              <p className="text-sm tracking-[0.14em] text-primary uppercase">01</p>
              <p className="mt-2 font-medium">A private gallery is prepared</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The photographer names it, adds the photographs, and copies one link.
              </p>
            </li>
            <li className="rounded-2xl bg-card p-4">
              <p className="text-sm tracking-[0.14em] text-primary uppercase">02</p>
              <p className="mt-2 font-medium">They open the link</p>
              <p className="mt-2 text-sm text-muted-foreground">
                There is no sign-up. You can also ask for a password before the pictures appear.
              </p>
            </li>
            <li className="rounded-2xl bg-card p-4">
              <p className="text-sm tracking-[0.14em] text-primary uppercase">03</p>
              <p className="mt-2 font-medium">They download what they want</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Previews leave out camera location data. Original files download one at a time.
              </p>
            </li>
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-10" aria-labelledby="samples-heading">
          <h2 id="samples-heading" className="font-heading text-3xl sm:text-4xl">
            Sample frames
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            These are labeled samples so the page is not empty. They are not photographs of clients,
            and this site does not invent reviews.{" "}
            {site.preview ? (
              <Link href="/preview/gallery" className="underline underline-offset-4">
                Open the preview gallery
              </Link>
            ) : null}
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {frames.map((frame) => (
              <li key={frame.src}>
                <figure>
                  {/* Plain img so the static preview keeps the GitHub Pages base path. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={publicPath(frame.src)}
                    alt={frame.alt}
                    width={800}
                    height={1000}
                    className="aspect-[4/5] w-full rounded-xl object-cover"
                  />
                  <figcaption className="mt-2 text-xs text-muted-foreground">
                    Demo · {frame.caption}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
            {site.preview ? (
              <>
                <h2 className="font-heading text-3xl sm:text-4xl">Bookings are closed</h2>
                <p className="mt-3 max-w-xl text-primary-foreground/90">
                  This design concept does not ask for a session, take a request, or publish a client
                  gallery.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-heading text-3xl sm:text-4xl">When you are ready for a session</h2>
                <p className="mt-3 max-w-xl text-primary-foreground/90">
                  The booking page uses a saved link or email if one is configured, and it will not
                  pretend a message was sent.
                </p>
                <Button className="mt-6 bg-card text-foreground hover:bg-card/90" render={<Link href="/book" />}>
                  Plan a session
                </Button>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
