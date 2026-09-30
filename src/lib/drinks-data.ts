/**
 * Sylvia's full drink menu, auto-generated from the cloned /drink-menu page
 * (scripts/regenerate: scripts/generate-drinks-data.py). Every item mirrors the
 * live site — name, price (where published), description, and category (the
 * page's own sub-headers, e.g. "Cocktails on The Rocks", "White Wine" — finer-
 * grained than the five top-level tabs). The live site publishes no per-drink
 * photos, so unlike menu-data.ts there's no `image` field here.
 * Plain data (no server-only imports) — safe on client + server.
 */

export type DrinkItem = {
  name: string;
  /** Not every drink has one published (e.g. beer/wine are listed by name only). */
  description?: string;
  /** Published price in USD, when there is a single one (see priceNote). */
  price?: number;
  priceNote?: string;
  category: string;
};

export const DRINKS: DrinkItem[] = [
  {
    name: "Wines by The Glass",
    description: "Riesling, Sauvignon Blanc, Chianti, Pinot Noir, Prosecco, Ros\u00e9 Prosecco, Moscato",
    price: 8,
    category: "Happy Hour",
  },
  {
    name: "Wines by The Bottle",
    description: "Chardonnay, Cabernet, Prosecco, Ros\u00e9 Prosecco",
    price: 30,
    category: "Happy Hour",
  },
  {
    name: "Beer",
    description: "Budweiser Bud Light Corona",
    price: 5,
    category: "Happy Hour",
  },
  {
    name: "Cocktails",
    description: "Harlem Blues Margarita Mo\u2019 Money Whiskey Margarita Well Drinks (max 2 mixers): House Rum, Tequila, Vodka, Gin, Whiskey",
    price: 10,
    category: "Happy Hour",
  },
  {
    name: "South Carolina Rum Punch",
    description: "Rum blend and Grandma Julia\u2019s Fruit Punch",
    category: "Cocktails on The Rocks",
  },
  {
    name: "Sylvia\u2019s Soulful Sangria",
    description: "Rum, red wine, and Grandma Julia\u2019s Fruit Punch",
    category: "Cocktails on The Rocks",
  },
  {
    name: "Sylvia\u2019s Summertime Sangria (Seasonal)",
    description: "White Rum, white wine, juices",
    category: "Cocktails on The Rocks",
  },
  {
    name: "Harlem Blues",
    description: "Sylvia\u2019s homemade lemonade, vodka, sour mix, and a splash of blue cura\u00e7ao and cranberry juice",
    category: "Cocktails on The Rocks",
  },
  {
    name: "Margarita Special (Strawberry, Mango, Peach, or Pineapple)",
    description: "Blanco tequila, lime juice, orange liqueur",
    category: "Cocktails on The Rocks",
  },
  {
    name: "Uptown Delight",
    description: "Cognac, Sylvia\u2019s Uptown",
    category: "Cocktails on The Rocks",
  },
  {
    name: "Long Island Iced Tea",
    description: "Vodka, gin, rum, tequila, splash of Coke",
    category: "Cocktails on The Rocks",
  },
  {
    name: "Harlem Old Fashioned",
    description: "Rye whiskey, bitters",
    category: "Cocktails on The Rocks",
  },
  {
    name: "The Hemingway",
    description: "Rum, orange liqueur, pineapple juice",
    category: "Cocktails on The Rocks",
  },
  {
    name: "Mo\u2019 Money",
    description: "Gin, strawberry puree, fresh lime",
    category: "Cocktails Straight Up",
  },
  {
    name: "The 1944",
    description: "Tequila, dry vermouth, ginger, bitters, egg white",
    category: "Cocktails Straight Up",
  },
  {
    name: "Love, Harlem",
    description: "Vodka, elderflower, dry vermouth, fresh lime",
    category: "Cocktails Straight Up",
  },
  {
    name: "Coconut Lime Drop",
    description: "Coconut rum, vodka, fresh lime",
    category: "Cocktails Straight Up",
  },
  {
    name: "Espresso Martini",
    description: "Vodka, espresso",
    category: "Cocktails Straight Up",
  },
  {
    name: "The Lenox",
    description: "Prosecco with Grandma Julia\u2019s Fruit Punch, topped with a shot of cognac",
    category: "Cocktails Bubbly",
  },
  {
    name: "Bellini",
    description: "Prosecco with peach nectar",
    category: "Cocktails Bubbly",
  },
  {
    name: "Hugo Spritz",
    description: "Prosecco, elderflower, club soda, gin, mint",
    category: "Cocktails Bubbly",
  },
  {
    name: "South Carolina Spritz",
    description: "Grandma Julia's Fruit Punch, ,rum, prosecco, club soda",
    category: "Cocktails Bubbly",
  },
  {
    name: "Mo' Money Spritz",
    description: "Gin, strawberry puree, fresh lime",
    category: "Cocktails Bubbly",
  },
  {
    name: "Harlem\u2019s Own Sugar Hill Golden Ale",
    category: "Beer",
  },
  {
    name: "Stella Artois",
    category: "Beer",
  },
  {
    name: "Corona",
    category: "Beer",
  },
  {
    name: "Heineken",
    category: "Beer",
  },
  {
    name: "Budweiser",
    category: "Beer",
  },
  {
    name: "Bud Light",
    category: "Beer",
  },
  {
    name: "Dante Chardonnay, California, 2024",
    category: "White Wine",
  },
  {
    name: "Ca\u2019di Ponti Pinot Grigio, Italy, 2025",
    category: "White Wine",
  },
  {
    name: "Fair Valley Sauvignon Blanc, South Africa, 2024",
    category: "White Wine",
  },
  {
    name: "Ryan Patrick Riesling, Washington, 2023",
    category: "White Wine",
  },
  {
    name: "Dante Cabernet Sauvignon, California, 2023",
    category: "Red Wine",
  },
  {
    name: "Cesani Chianti Colli Senesi, Italy, 2022",
    category: "Red Wine",
  },
  {
    name: "Dante Merlot, California, 2023",
    category: "Red Wine",
  },
  {
    name: "Dante Pinot Noir, 2024",
    category: "Red Wine",
  },
  {
    name: "Ca\u2019 Furlan Cuv\u00e9e Beatrice Prosecco, Italy",
    category: "Sparkling Wine",
  },
  {
    name: "Ca\u2019 Furlan Cuv\u00e9e Beatrice Ros\u00e9 Prosecco, Italy",
    category: "Sparkling Wine",
  },
  {
    name: "Veuve Clicquot Brut Ros\u00e9",
    category: "Champagne",
  },
  {
    name: "Mo\u00ebt & Chandon Nectar Imperial",
    category: "Champagne",
  },
  {
    name: "Grandma Julia\u2019s Fruit Punch",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Sylvia's Nojito",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Home Brewed Sweetened Iced Tea",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Peach Iced Tea",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Lemonade",
    description: "Peach, Strawberry, Mango",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Sylvia\u2019s Uptown",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Coke",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Diet Coke",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Sprite",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Ginger Ale",
    category: "Zero-Proof Favorites",
  },
  {
    name: "Bottled Water",
    category: "Zero-Proof Favorites",
  }
];
