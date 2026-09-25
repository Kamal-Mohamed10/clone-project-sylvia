import { getEvents } from "@/lib/events";
import { buildCalendar } from "@/lib/calendar";
import { BODY_HTML } from "@/lib/chrome";
import { SiteClone } from "@/components/SiteClone";

export const dynamic = "force-dynamic"; // always reflect current DB state

export default async function EventsPage() {
  const events = await getEvents();
  const calendar = buildCalendar(events);

  return <SiteClone events={events} calendar={calendar} bodyHtml={BODY_HTML} />;
}
