/**
 * On-premise (dine-in) event menus, gated by party size. Sourced from Sylvia's
 * booking app (sylviasrestaurant.comfortcater.com): the Large Party (11+) and
 * On-Premise Private Events (25+) tiers. Catering / off-site service is out of
 * scope. Photos live in /public/packages.
 *
 * Plain data (no server-only imports) — safe on client + server.
 */
export type PackageMenu = {
  id: string;
  name: string;
  /** Price per guest, USD. */
  pricePerPerson: number;
  /** One-line make-up of the menu, e.g. "2 entrées · 2 sides · soft drinks". */
  summary: string;
  /** A few representative dishes. */
  sampleItems: string[];
  /** Local thumbnail under /public/packages. */
  imageUrl: string;
  /** Timing or limits, e.g. "Mon–Fri, 11 AM–4 PM" or "Max 40 guests". */
  note?: string;
};

export type ServiceTier = {
  id: string;
  name: string;
  minGuests: number;
  blurb: string;
  /** Local hero image under /public/packages. */
  imageUrl: string;
  menus: PackageMenu[];
};

export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: "large-party",
    name: "Large Party",
    minGuests: 11,
    blurb: "Birthdays, reunions, and group nights out — family-style in the dining room.",
    imageUrl: "/packages/large-party.jpg",
    menus: [
      {
        id: "fs-brunch-golden",
        name: "Family Style Brunch — Golden",
        pricePerPerson: 30,
        summary: "2 entrées · brunch classics",
        sampleItems: ["Down Home Fried Chicken", "Smothered Chicken", "Scrambled Eggs", "Grits", "Cornbread Muffins"],
        imageUrl: "/packages/dish-brunch.jpg",
        note: "Daily, before 2 PM",
      },
      {
        id: "fs-brunch-platinum",
        name: "Family Style Brunch — Platinum",
        pricePerPerson: 35,
        summary: "3 entrées · brunch classics",
        sampleItems: ["Down Home Fried Chicken", "Smothered Chicken", "BBQ Chicken", "Grits", "Cornbread Muffins"],
        imageUrl: "/packages/dish-banana-pudding.jpg",
        note: "Daily, before 2 PM",
      },
      {
        id: "fs-lunch",
        name: "Family Style Lunch",
        pricePerPerson: 32,
        summary: "2 entrées · 2 sides · soft drinks",
        sampleItems: ["Down Home Fried Chicken", "Barbecue Chicken", "Potato Salad", "Candied Yams"],
        imageUrl: "/packages/dish-fried-chicken.jpg",
        note: "Mon–Fri, 11 AM–4 PM",
      },
      {
        id: "fs-dinner",
        name: "Family Style Dinner",
        pricePerPerson: 43,
        summary: "2 entrées · dessert · soft drinks",
        sampleItems: ["Down Home Fried Chicken", "World-Famous BBQ Ribs", "Baked Catfish (+$4)", "Peach Cobbler"],
        imageUrl: "/packages/dish-bbq-ribs.jpg",
        note: "Daily, from 12 PM",
      },
      {
        id: "student-lunch",
        name: "Student Lunch",
        pricePerPerson: 22,
        summary: "Value lunch for student groups",
        sampleItems: ["Chicken Livers", "1 Pork Chop", "Black-Eyed Peas", "String Beans"],
        imageUrl: "/packages/dish-fried-chicken.jpg",
        note: "Max 40 guests · Mon–Sat, 11 AM–3 PM",
      },
    ],
  },
  {
    id: "private-events",
    name: "On-Premise Private Events",
    minGuests: 25,
    blurb: "Host your celebration in Sylvia's private event spaces — fully served buffets.",
    imageUrl: "/packages/private-events.jpg",
    menus: [
      {
        id: "golden-buffet",
        name: "Golden Buffet",
        pricePerPerson: 40,
        summary: "2 entrées · 3 sides · dessert",
        sampleItems: ["Baked Whiting w/ Onions & Peppers", "Down Home Fried Chicken", "BBQ Chicken", "Cornbread", "Uptown Iced Tea"],
        imageUrl: "/packages/dish-fried-chicken.jpg",
      },
      {
        id: "platinum-buffet",
        name: "Platinum Buffet",
        pricePerPerson: 46,
        summary: "3 entrées · 3 sides · dessert",
        sampleItems: ["Down Home Fried Chicken", "BBQ Chicken", "World-Famous BBQ Pork Ribs", "Cornbread", "Uptown Iced Tea"],
        imageUrl: "/packages/dish-bbq-ribs.jpg",
      },
      {
        id: "brunch-buffet",
        name: "Brunch Buffet",
        pricePerPerson: 33,
        summary: "2 meats · 2 sides · beverage",
        sampleItems: ["Down Home Fried Chicken", "Sassy Rice", "Country Style Grits", "Scrambled Eggs", "Biscuits"],
        imageUrl: "/packages/dish-brunch.jpg",
        note: "Daily, before 2 PM",
      },
      {
        id: "hors-4",
        name: "Hors d'oeuvres — Choice of 4",
        pricePerPerson: 50,
        summary: "4 passed hors d'oeuvres",
        sampleItems: ["Three Cheese Baked Macaroni Mini Bites", "Catfish Fingers"],
        imageUrl: "/packages/dish-mac-cheese.jpg",
      },
      {
        id: "hors-6",
        name: "Hors d'oeuvres — Choice of 6",
        pricePerPerson: 75,
        summary: "6 passed hors d'oeuvres",
        sampleItems: ["Three Cheese Baked Macaroni Mini Bites", "Catfish Fingers"],
        imageUrl: "/packages/dish-mac-cheese.jpg",
      },
    ],
  },
];

/**
 * Per-dish thumbnails (openly-licensed, fetched by scripts/fetch-dish-images.py
 * into /public/packages/dishes). Keyed by the exact `sampleItems` string; a few
 * aliases share one photo (e.g. "Cornbread" and "Cornbread Muffins").
 */
const DISH_IMAGE_SLUG: Record<string, string> = {
  "Down Home Fried Chicken": "fried-chicken",
  "Smothered Chicken": "smothered-chicken",
  "Scrambled Eggs": "scrambled-eggs",
  Grits: "grits",
  "Country Style Grits": "grits",
  "Cornbread Muffins": "cornbread",
  Cornbread: "cornbread",
  "BBQ Chicken": "bbq-chicken",
  "Barbecue Chicken": "bbq-chicken",
  "Potato Salad": "potato-salad",
  "Candied Yams": "candied-yams",
  "World-Famous BBQ Ribs": "bbq-ribs",
  "World-Famous BBQ Pork Ribs": "bbq-ribs",
  "Baked Catfish (+$4)": "baked-catfish",
  "Peach Cobbler": "peach-cobbler",
  "Chicken Livers": "chicken-livers",
  "1 Pork Chop": "pork-chop",
  "Black-Eyed Peas": "black-eyed-peas",
  "String Beans": "string-beans",
  "Baked Whiting w/ Onions & Peppers": "baked-whiting",
  "Uptown Iced Tea": "iced-tea",
  "Sassy Rice": "sassy-rice",
  Biscuits: "biscuits",
  "Three Cheese Baked Macaroni Mini Bites": "mac-cheese",
  "Catfish Fingers": "catfish-fingers",
};

/**
 * Thumbnail path for one dish. Unmapped names fall back to `fallback` (usually
 * the owning menu's photo) so the UI never renders a broken image.
 */
export function dishImage(name: string, fallback?: string): string {
  const slug = DISH_IMAGE_SLUG[name];
  return slug ? `/packages/dishes/${slug}.jpg` : (fallback ?? "");
}

/** Smallest minimum across all tiers — the point where the menu panel appears. */
export const PACKAGE_THRESHOLD = Math.min(
  ...SERVICE_TIERS.map((t) => t.minGuests),
);

/** Tiers a party of `n` guests qualifies for, smallest minimum first. */
export function tiersForPartySize(n: number): ServiceTier[] {
  return SERVICE_TIERS.filter((t) => n >= t.minGuests).sort(
    (a, b) => a.minGuests - b.minGuests,
  );
}

/** Look up a menu by id along with its owning tier (for validation / labels). */
export function findPackageMenu(
  id: string,
): { menu: PackageMenu; tier: ServiceTier } | null {
  for (const tier of SERVICE_TIERS) {
    const menu = tier.menus.find((m) => m.id === id);
    if (menu) return { menu, tier };
  }
  return null;
}
