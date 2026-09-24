import type { EventItem } from "./types";

/**
 * The six real events lifted from Sylvia's current events page.
 * Used to seed the database and as a read-only fallback for local
 * development before Postgres is provisioned.
 */
export const SEED_EVENTS: EventItem[] = [
  {
    id: "3446982",
    slug: "gospel-brunch",
    title: "Sylvia's World Famous Gospel Brunch — Live Gospel Music",
    description:
      "Sunday Gospel Brunch in Harlem is one of the best ways to spend a Sunday! Come enjoy uplifting live gospel music, soulful energy, and the legendary soul food Sylvia's has been serving for generations. Good food. Great music. Harlem tradition.",
    startDate: "2026-08-09",
    startTime: "12:30",
    endTime: null,
    dayLabel: "Every Sunday",
    recurring: true,
    imageUrl:
      "https://static.spotapps.co/spots/bc/26377939864ab69c65279c665258eb/w926",
  },
  {
    id: "2245906",
    slug: "national-drink-beer-day",
    title: "National Drink Beer Day",
    description:
      "Join us for National Drink Beer Day on Sept 28th and try one of our many craft brews!",
    startDate: "2026-09-28",
    startTime: "11:00",
    endTime: "20:00",
    dayLabel: "Monday September 28th",
    recurring: false,
    imageUrl: null,
  },
  {
    id: "2297235",
    slug: "national-dessert-day",
    title: "National Dessert Day",
    description:
      "Indulge in dinner and a dessert on National Dessert Day!",
    startDate: "2026-10-14",
    startTime: "11:00",
    endTime: "22:00",
    dayLabel: "Wednesday October 14th",
    recurring: false,
    imageUrl:
      "https://static.spotapps.co/spots/1f/e3d81c81894c86a52cd390751b676f/w926",
  },
  {
    id: "2342013",
    slug: "halloween",
    title: "Halloween",
    description: "Bring your best costume and join us on Halloween!",
    startDate: "2026-10-31",
    startTime: "11:00",
    endTime: "22:00",
    dayLabel: "Saturday October 31st",
    recurring: false,
    imageUrl:
      "https://static.spotapps.co/spots/1f/e3d81c81894c86a52cd390751b676f/w926",
  },
  {
    id: "2487071",
    slug: "national-sandwich-day",
    title: "National Sandwich Day",
    description: "Because food tastes better between bread!",
    startDate: "2026-11-03",
    startTime: "11:00",
    endTime: "20:00",
    dayLabel: "Tuesday November 3rd",
    recurring: false,
    imageUrl:
      "https://static.spotapps.co/spots/1f/e3d81c81894c86a52cd390751b676f/w926",
  },
  {
    id: "2415121",
    slug: "thanksgiving",
    title: "Thanksgiving",
    description:
      "Bring your friends and family by on Thanksgiving Day for a celebratory feast!",
    startDate: "2026-11-26",
    startTime: "11:00",
    endTime: "22:00",
    dayLabel: "Thursday November 26th",
    recurring: false,
    imageUrl:
      "https://static.spotapps.co/spots/1f/e3d81c81894c86a52cd390751b676f/w926",
  },
];
