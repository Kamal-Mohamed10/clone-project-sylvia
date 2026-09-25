import type { EventItem } from "./types";

/**
 * The six real events lifted from Sylvia's current events page.
 * `description` holds the original event HTML (rendered as-is), matching the source.
 * Only the Gospel Brunch and Thanksgiving events have images in the original.
 */
export const SEED_EVENTS: EventItem[] = [
  {
    id: "3446982",
    slug: "gospel-brunch",
    title: "Sylvia’s World Famous Gospel Brunch - Live Gospel Music",
    description:
      '<p>Every Sunday</p><p style="text-align: center;"><b></b></p><p style="text-align: center;"><b>Sunday Gospel Brunch in Harlem </b>is one of the best ways to spend a Sunday!</p><p style="text-align: center;">Come enjoy uplifting live gospel music, soulful energy, and the legendary soul food Sylvia’s has been serving for generations.</p><p style="text-align: center;">🎶 Live Gospel Sundays </p><p style="text-align: center;"><b>1st &amp; 2nd Sundays</b> — Antoine Dolberry </p><p style="text-align: center;"><b>3rd Sundays</b> — The Deborah Newallo Experience </p><p style="text-align: center;"><b>4th &amp; 5th Sundays</b> — Daria Jones</p><p style="text-align: center;">Good food. Great music. Harlem tradition. ❤️</p><p style="text-align: center;">Make Sunday brunch a soulful one at Sylvia’s.</p>',
    startDate: "2026-08-09",
    endDate: "2027-02-28",
    startTime: "12:30",
    endTime: "16:00",
    dayLabel: "Starting on Sunday August 9th 2026",
    recurrenceType: "Every",
    recurring: true,
    imageUrl:
      "https://static.spotapps.co/spots/bc/26377939864ab69c65279c665258eb/w926",
  },
  {
    id: "2245906",
    slug: "national-drink-beer-day",
    title: "National Drink Beer Day",
    description:
      "<p>Join us for National Drink Beer Day on Sept 28th and try one of our many craft brews!</p>",
    startDate: "2026-09-28",
    endDate: null,
    startTime: "11:00",
    endTime: "20:00",
    dayLabel: "Monday September 28th",
    recurrenceType: "Does not Repeat",
    recurring: false,
    imageUrl:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=926&q=80",
  },
  {
    id: "2297235",
    slug: "national-dessert-day",
    title: "National Dessert Day",
    description:
      "<p>Indulge in dinner and a dessert on National Dessert Day!</p>",
    startDate: "2026-10-14",
    endDate: null,
    startTime: "11:00",
    endTime: "22:00",
    dayLabel: "Wednesday October 14th",
    recurrenceType: "Does not Repeat",
    recurring: false,
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=926&q=80",
  },
  {
    id: "2342013",
    slug: "halloween",
    title: "Halloween",
    description: "<p>Bring your best costume and join us on Halloween!</p>",
    startDate: "2026-10-31",
    endDate: null,
    startTime: "11:00",
    endTime: "22:00",
    dayLabel: "Saturday October 31st",
    recurrenceType: "Does not Repeat",
    recurring: false,
    imageUrl:
      "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=926&q=80",
  },
  {
    id: "2487071",
    slug: "national-sandwich-day",
    title: "National Sandwich Day",
    description: "<p>Because food tastes better between bread!</p>",
    startDate: "2026-11-03",
    endDate: null,
    startTime: "11:00",
    endTime: "20:00",
    dayLabel: "Tuesday November 3rd",
    recurrenceType: "Does not Repeat",
    recurring: false,
    imageUrl:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=926&q=80",
  },
  {
    id: "2415121",
    slug: "thanksgiving",
    title: "Thanksgiving",
    description:
      "<p>Bring your friends and family by on Thanksgiving Day for a celebratory feast!</p>",
    startDate: "2026-11-26",
    endDate: null,
    startTime: "11:00",
    endTime: "22:00",
    dayLabel: "Thursday November 26th",
    recurrenceType: "Does not Repeat",
    recurring: false,
    imageUrl:
      "https://static.spotapps.co/spots/1f/e3d81c81894c86a52cd390751b676f/w926",
  },
];
