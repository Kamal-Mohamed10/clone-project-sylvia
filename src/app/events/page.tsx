import { getEvents } from "@/lib/events";
import { hasDb } from "@/lib/db";
import { EventsGrid } from "@/components/EventsGrid";

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="flex-1">
      {/* Header / hero */}
      <header className="bg-brand text-[#f6efe2]">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <p className="font-display text-accent tracking-[0.2em] uppercase text-sm mb-3">
            Sylvia&apos;s of Harlem · Since 1962
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-tight max-w-3xl">
            Events &amp; Reservations
          </h1>
          <p className="mt-5 text-lg text-[#e7ddca] max-w-2xl">
            From world-famous live Gospel Brunch to holiday feasts, there&apos;s
            always something soulful happening at Sylvia&apos;s. Pick an event
            and reserve your table below.
          </p>
        </div>
      </header>

      {/* Events grid */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand">
            Upcoming Events
          </h2>
          <span className="text-muted text-sm">
            {events.length} event{events.length === 1 ? "" : "s"}
          </span>
        </div>

        <EventsGrid events={events} />
      </section>

      <footer className="border-t border-black/10 mt-4">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted flex flex-wrap gap-x-6 gap-y-1 justify-between">
          <span>328 Malcolm X Blvd, New York, NY 10027</span>
          <span>
            {hasDb
              ? "Reservations powered by Sylvia's"
              : "Demo mode — reservations saved locally"}
          </span>
        </div>
      </footer>
    </main>
  );
}
