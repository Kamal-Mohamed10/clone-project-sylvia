"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { EventItem } from "@/lib/types";
import type { CalendarYear } from "@/lib/calendar";
import { EventsCalendar } from "./EventsCalendar";

/**
 * Renders the original Sylvia's page chrome verbatim (nav, footer, background)
 * and portals the live, DB-driven events + reservation UI into the
 * `#events-mount` placeholder where the events section used to be.
 */
export function SiteClone({
  events,
  calendar,
  bodyHtml,
}: {
  events: EventItem[];
  calendar: CalendarYear[];
  bodyHtml: string;
}) {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  // The portal target (#events-mount) lives inside the cloned HTML above, so it
  // only exists in the DOM after this component's first commit. Capturing it in
  // an effect is the intended pattern here; splitting the HTML would break the
  // page's tag structure.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMount(document.getElementById("events-mount"));
  }, []);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {mount &&
        createPortal(
          <EventsCalendar events={events} calendar={calendar} />,
          mount,
        )}
    </>
  );
}
