"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PackageBookingForm } from "./PackageBookingForm";

const todayISO = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

/**
 * Portals a real (not tied to any calendar event) large-party/catering
 * booking form into the #catering-booking-mount placeholder inserted into
 * the cloned /cater markup — same portal-after-mount technique SiteClone.tsx
 * uses for #events-mount, since the mount point only exists in the DOM after
 * the cloned HTML above it has committed.
 */
export function CateringBooking() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMount(document.getElementById("catering-booking-mount"));
  }, []);

  if (!mount) return null;

  return createPortal(
    <>
      <style>{CARD_CSS}</style>
      {/* PackageBookingForm's dark-purple text (.reservation-heading etc.) is
          styled assuming the gold card background the real event modal gets
          from custom.css's `.event-calendar-modal-dialog` rule — which only
          applies inside that modal's DOM. Reproduce just the card look here
          rather than reusing that class (it also carries an opacity:0 default
          meant for the modal's open/close animation). */}
      <div className="catering-booking-card">
        <PackageBookingForm
          eventId={null}
          bookingLabel="Large Party / Catering Booking"
          minDate={todayISO()}
        >
          <h2>Request Your Large Party Booking</h2>
          <p className="event-main-text">
            Reserve a private-room package below — a 20% deposit confirms your
            date, and the balance is settled at the restaurant.
          </p>
        </PackageBookingForm>
      </div>
    </>,
    mount,
  );
}

const CARD_CSS = `
.catering-booking-card {
  max-width: 1000px;
  margin: 24px auto;
  padding: 30px;
  background: #F5C552;
  border-radius: 5px;
  color: #331F52;
}
.catering-booking-card h2 { color: #331F52; margin: 0 0 8px; }
.catering-booking-card p { color: #331F52; }
.catering-booking-card .event-calendar-modal-media { background: transparent; }
`;
