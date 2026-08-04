
import dynamic from "next/dynamic";

const LightRaysAnimation = dynamic(() => import('./LIghtRaysAnimation'));
const HeroFilterings = dynamic(() => import('./HeroFilterings'));
const ScrollDownIndicator = dynamic(() => import('./ScrollDownIndicator'));

function Hero() {
  return (
    <div className="relative w-full min-h-screen">
      <section className="pt-40 text-center px-4 md:px-6">
        <h1
          className={
            "text-5xl/normal md:text-7xl/normal font-extrabold mb-2 bg-[linear-gradient(180deg,var(--color-slate-200),var(--color-foreground))] dark:bg-[linear-gradient(180deg,var(--color-white)_45%,var(--color-slate-700))] bg-clip-text text-transparent"
          }
        >
          Engineering Insights
        </h1>
        <p className="text-foreground text-lg max-w-2xl mx-auto pb-5">
          Deep dives into software architecture, modern web technologies, and
          scalable systems design.
        </p>
        <HeroFilterings />
      </section>
      <ScrollDownIndicator />
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <LightRaysAnimation />
      </div>
    </div>
  );
}

export default Hero;
