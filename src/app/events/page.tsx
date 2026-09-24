import { getEvents } from "@/lib/events";
import { buildCalendar } from "@/lib/calendar";
import { EventsCalendar } from "@/components/EventsCalendar";

export const dynamic = "force-dynamic"; // always reflect current DB state

export default async function EventsPage() {
  const events = await getEvents();
  const calendar = buildCalendar(events);

  return (
    <div className="pagecontent">
      <div className="container">
        <h1 className="page-title">Events</h1>
        <EventsCalendar events={events} calendar={calendar} />
      </div>
    </div>
  );
}
