import type { Metadata } from "next";
import { CATERING_HTML } from "@/lib/cater-clone";
import BodyClass from "@/components/BodyClass";
import { CateringBooking } from "@/components/CateringBooking";

export const metadata: Metadata = {
  title: "Soulful Catering · Sylvia's Restaurant",
  description:
    "Large-party and private-event catering at Sylvia's Restaurant — family-style menus, buffets, and hors d'oeuvres, with online booking and deposit.",
};

/**
 * Exact clone of sylviasrestaurant.com/cater (markup + vendored CSS), served
 * at /cater — with a real booking form (CateringBooking, portaled via
 * #catering-booking-mount) standing in for the live page's dead "submit an
 * inquiry" CTA, so the concierge can link guests here to actually book a
 * large-party/catering package, not just read about one.
 */
export default function CaterPage() {
  return (
    <>
      <BodyClass className="drink-menu article-background cater-page" />
      <style dangerouslySetInnerHTML={{ __html: CAROUSEL_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: CATERING_HTML }} />
      <CateringBooking />
    </>
  );
}

// The live page's photo gallery relies on owl-carousel's JS (which we strip
// for a static clone) to lay out and animate slides — without it the
// .owl-carousel stays JS-controlled/hidden. Override it to a plain static
// horizontal-scroll strip of the same photos instead, and hide the
// play/pause controls since they have nothing to control anymore.
const CAROUSEL_CSS = `
.cater-page .carousel-controls { display: none !important; }
.cater-page .owl-carousel {
  display: flex !important;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 4px 2px 12px;
}
.cater-page .owl-carousel .item {
  flex: 0 0 auto;
  width: 240px;
  scroll-snap-align: start;
}
.cater-page .owl-carousel .item .img { display: block; }
.cater-page .owl-carousel .item img {
  display: block;
  width: 100%;
  height: 170px;
  object-fit: cover;
  border-radius: 8px;
}
`;
