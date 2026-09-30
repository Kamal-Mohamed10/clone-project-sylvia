import type { Metadata } from "next";
import { DRINKS_HTML } from "@/lib/drinks-clone";
import BodyClass from "@/components/BodyClass";

export const metadata: Metadata = {
  title: "Drink Menu · Sylvia's Restaurant",
  description:
    "Sylvia's drink menu — happy hour, cocktails, beer, wine & bubbles, and zero-proof favorites.",
};

/**
 * Exact clone of sylviasrestaurant.com/drink-menu (markup + vendored CSS),
 * served at /drinks so the concierge can link guests to the full list. The
 * live page has no per-drink photos at all — this clone doesn't either,
 * faithfully (checked the source: zero <img> tags in its content region).
 */
export default function DrinksPage() {
  return (
    <>
      <BodyClass className="drink-menu" />
      <style dangerouslySetInnerHTML={{ __html: LAYOUT_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: DRINKS_HTML }} />
    </>
  );
}

// The live page uses JS tab-switching (five categories, each display:none
// until its nav link is clicked) and an isotope masonry grid — both stripped
// for a static clone. Reveal every category stacked (not just one, the way
// /menu's food grid does for its single default tab — there's no single
// "default" here since all five start hidden) with a heading per section,
// and undo the isotope absolute positioning so items flow in columns.
const CATEGORY_LABELS: Record<string, string> = {
  "1426194": "Happy Hour",
  "1084813": "Cocktails",
  "1084811": "Beer",
  "1086470": "Wine and Bubbles",
  "1084816": "Zero-Proof Favorites",
};

const LAYOUT_CSS = `
#drink_menu_v2 .food-menu-nav { display: none; }
${Object.entries(CATEGORY_LABELS)
  .map(
    ([id, label]) => `
#drink_menu_v2 .menu_${id} {
  display: block !important;
  margin-top: 28px;
}
#drink_menu_v2 .menu_${id}::before {
  content: "${label}";
  display: block;
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 12px;
}
`,
  )
  .join("")}
#drink_menu_v2 .food-menu-grid-sizer { display: none !important; }
#drink_menu_v2 .food-menu-grid-item,
#drink_menu_v2 .food-menu-grid-item--width2 {
  position: static !important; float: none !important; left: auto !important; top: auto !important;
  width: 100% !important; margin: 0 0 20px !important; break-inside: avoid;
}
@media (min-width: 900px) {
  #drink_menu_v2 .food-menu-grid { column-count: 2; column-gap: 32px; }
}
`;
