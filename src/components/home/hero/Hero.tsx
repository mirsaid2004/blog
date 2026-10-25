
import dynamic from "next/dynamic";

const LightRaysAnimation = dynamic(() => import('./LIghtRaysAnimation'));
const HeroFilterings = dynamic(() => import('./HeroFilterings'));
const ScrollDownIndicator = dynamic(() => import('./ScrollDownIndicator'));

function Hero() {
  return (
    <div className="relative w-full min-h-screen">
      {/*
        The search card inside is `position: sticky`, and a sticky element can only
        travel within its parent's *content* box - padding does not count. The spacer
        below (sized by `--hero-sticky-extent`, measured in HeroFilterings) stretches
        that content box down over the default view so the card stays pinned the
        whole way; the matching negative margin keeps the document flow, and
        everything below it, exactly where it was.

        The stretched box overlaps later content, hence `pointer-events-none` here
        and `pointer-events-auto` on the real content.
      */}
      <section
        className="pt-40 text-center px-4 md:px-6 pointer-events-none"
        style={{ marginBottom: "calc(-1 * var(--hero-sticky-extent, 0px))" }}
      >
        <h1
          className={
            "pointer-events-auto text-5xl/normal md:text-7xl/normal font-extrabold mb-2 bg-[linear-gradient(180deg,var(--color-slate-200),var(--color-foreground))] dark:bg-[linear-gradient(180deg,var(--color-white)_45%,var(--color-slate-700))] bg-clip-text text-transparent"
          }
        >
          Engineering Insights
        </h1>
        <p className="pointer-events-auto text-foreground text-lg max-w-2xl mx-auto pb-5">
          Deep dives into software architecture, modern web technologies, and
          scalable systems design.
        </p>
        <HeroFilterings />
        <div aria-hidden style={{ height: "var(--hero-sticky-extent, 0px)" }} />
      </section>
      <ScrollDownIndicator />
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <LightRaysAnimation />
      </div>
    </div>
  );
}

export default Hero;
