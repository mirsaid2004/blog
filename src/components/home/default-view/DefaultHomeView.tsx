
import LatestBlogs from "./LatestBlogs";
import Series from "./Series";
import TopPicks from "./TopPicks";

export default function DefaultHomeView() {
    return (
        <section className="relative w-full bg-dot-pattern">
            {/* Global Background Elements from 404/Error Pages */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {/* These gradients will be clipped to the section, but won't break sticky positioning of children */}
                <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute top-[60%] right-[-5%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 py-20 min-h-[200vh]">
                <div id="default-home-view" className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 relative z-0">
                        <LatestBlogs />
                    </div>
                    <div id="top-picks-container" className="lg:col-span-4 h-full relative z-0">
                        {/* Sits directly below the docked search card; `top` now only
                            changes when that card's height changes, not per frame. */}
                        <div className="sticky h-fit transition-[top] duration-300 ease-out" style={{ top: 'var(--top-picks-sticky-top, 400px)' }}>
                            <TopPicks />
                        </div>
                    </div>
                </div>
                <Series />
            </div>
        </section>
    );
}
