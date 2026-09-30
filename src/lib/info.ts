/**
 * Static restaurant facts + hand-off links for the concierge's `get_info` tool.
 * Transcribed from sylviasrestaurant.com. Plain data — safe on client + server.
 *
 * Hours here are the single source of truth for booking: `availability.ts` derives
 * open slots from HOURS, so keep the two consistent.
 */

/** Open/close in 24h "HH:MM", indexed by JS getDay() (0 = Sun … 6 = Sat). Null = closed. */
export type DayHours = { open: string; close: string } | null;

export const HOURS: DayHours[] = [
  { open: "11:00", close: "20:00" }, // Sun
  { open: "11:00", close: "20:00" }, // Mon
  { open: "11:00", close: "20:00" }, // Tue
  { open: "11:00", close: "22:00" }, // Wed
  { open: "11:00", close: "22:00" }, // Thu
  { open: "11:00", close: "22:00" }, // Fri
  { open: "11:00", close: "22:00" }, // Sat
];

export const HOURS_SUMMARY = "Wed–Sat 11 AM–10 PM · Sun–Tue 11 AM–8 PM";

export const RESTAURANT = {
  name: "Sylvia's Restaurant",
  tagline: "Harlem's Home of Soul Food since 1962",
  address: "328 Malcolm X Blvd, Harlem, NY 10027",
  phone: "(212) 996-0660",
  email: "info@sylviasrestaurant.com",
  about:
    "Founded in 1962 by Sylvia Woods, Sylvia's is a Harlem institution and gathering place for families, friends, leaders, and legends — winner of the 2024 James Beard Foundation America's Classics Award.",
  gospelBrunch:
    "Live Gospel Brunch every Sunday, 12:30–4:00 PM, with rotating performers.",
} as const;

/** External services the concierge hands off to (it can't complete these itself). */
export const LINKS = {
  reservationsFallback: "https://resy.com/cities/new-york-ny/venues/sylvias-restaurant",
  orderOnline: "https://direct.chownow.com/order/22566/locations/32842",
  giftCards: "https://www.toasttab.com/sylvias-restaurant/giftcards",
  catering: "/cater",
  privateParties: "https://sylviasrestaurant.com/parties",
  jobs: "https://sylviasrestaurant.isolvedhire.com/jobs/",
} as const;

/** Everything the get_info tool can return, in one object. */
export const INFO = {
  hours: HOURS,
  hoursSummary: HOURS_SUMMARY,
  restaurant: RESTAURANT,
  links: LINKS,
} as const;
