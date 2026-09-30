/**
 * Sylvia's full drink menu, auto-generated from the cloned /drink-menu page
 * (scripts/regenerate: scripts/generate-drinks-data.py, after re-running
 * scripts/fetch-drink-images.py). Every item mirrors the live site — name,
 * price (where published), description, and category (the page's own
 * sub-headers, e.g. "Cocktails on The Rocks", "White Wine" — finer-grained
 * than the five top-level tabs). The live site publishes no per-drink photos
 * at all; `image`, when present, is a locally-sourced openly-licensed
 * stand-in (see fetch-drink-images.py), not a real photo of Sylvia's drink.
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
  /** Stable id for card keys. */
  slug: string;
  /** Openly-licensed stand-in photo, or undefined when no good match was found. */
  image?: string;
};

export const DRINKS: DrinkItem[] = [
  {
    name: "Wines by The Glass",
    description: "Riesling, Sauvignon Blanc, Chianti, Pinot Noir, Prosecco, Ros\u00e9 Prosecco, Moscato",
    price: 8,
    category: "Happy Hour",
    slug: "wines-by-the-glass",
    image: "/drinks/wines-by-the-glass.jpg",
  },
  {
    name: "Wines by The Bottle",
    description: "Chardonnay, Cabernet, Prosecco, Ros\u00e9 Prosecco",
    price: 30,
    category: "Happy Hour",
    slug: "wines-by-the-bottle",
    image: "/drinks/wines-by-the-bottle.jpg",
  },
  {
    name: "Beer",
    description: "Budweiser Bud Light Corona",
    price: 5,
    category: "Happy Hour",
    slug: "beer",
    image: "/drinks/beer.jpg",
  },
  {
    name: "Cocktails",
    description: "Harlem Blues Margarita Mo\u2019 Money Whiskey Margarita Well Drinks (max 2 mixers): House Rum, Tequila, Vodka, Gin, Whiskey",
    price: 10,
    category: "Happy Hour",
    slug: "cocktails",
    image: "/drinks/cocktails.jpg",
  },
  {
    name: "South Carolina Rum Punch",
    description: "Rum blend and Grandma Julia\u2019s Fruit Punch",
    category: "Cocktails on The Rocks",
    slug: "south-carolina-rum-punch",
    image: "/drinks/south-carolina-rum-punch.jpg",
  },
  {
    name: "Sylvia\u2019s Soulful Sangria",
    description: "Rum, red wine, and Grandma Julia\u2019s Fruit Punch",
    category: "Cocktails on The Rocks",
    slug: "sylvias-soulful-sangria",
    image: "/drinks/sylvias-soulful-sangria.jpg",
  },
  {
    name: "Sylvia\u2019s Summertime Sangria (Seasonal)",
    description: "White Rum, white wine, juices",
    category: "Cocktails on The Rocks",
    slug: "sylvias-summertime-sangria",
    image: "/drinks/sylvias-summertime-sangria.jpg",
  },
  {
    name: "Harlem Blues",
    description: "Sylvia\u2019s homemade lemonade, vodka, sour mix, and a splash of blue cura\u00e7ao and cranberry juice",
    category: "Cocktails on The Rocks",
    slug: "harlem-blues",
    image: "/drinks/harlem-blues.jpg",
  },
  {
    name: "Margarita Special (Strawberry, Mango, Peach, or Pineapple)",
    description: "Blanco tequila, lime juice, orange liqueur",
    category: "Cocktails on The Rocks",
    slug: "margarita-special",
    image: "/drinks/margarita-special.jpg",
  },
  {
    name: "Uptown Delight",
    description: "Cognac, Sylvia\u2019s Uptown",
    category: "Cocktails on The Rocks",
    slug: "uptown-delight",
    image: "/drinks/uptown-delight.jpg",
  },
  {
    name: "Long Island Iced Tea",
    description: "Vodka, gin, rum, tequila, splash of Coke",
    category: "Cocktails on The Rocks",
    slug: "long-island-iced-tea",
    image: "/drinks/long-island-iced-tea.jpg",
  },
  {
    name: "Harlem Old Fashioned",
    description: "Rye whiskey, bitters",
    category: "Cocktails on The Rocks",
    slug: "harlem-old-fashioned",
    image: "/drinks/harlem-old-fashioned.jpg",
  },
  {
    name: "The Hemingway",
    description: "Rum, orange liqueur, pineapple juice",
    category: "Cocktails on The Rocks",
    slug: "the-hemingway",
    image: "/drinks/the-hemingway.jpg",
  },
  {
    name: "Mo\u2019 Money",
    description: "Gin, strawberry puree, fresh lime",
    category: "Cocktails Straight Up",
    slug: "mo-money",
    image: "/drinks/mo-money.jpg",
  },
  {
    name: "The 1944",
    description: "Tequila, dry vermouth, ginger, bitters, egg white",
    category: "Cocktails Straight Up",
    slug: "the-1944",
    image: "/drinks/the-1944.jpg",
  },
  {
    name: "Love, Harlem",
    description: "Vodka, elderflower, dry vermouth, fresh lime",
    category: "Cocktails Straight Up",
    slug: "love-harlem",
    image: "/drinks/love-harlem.jpg",
  },
  {
    name: "Coconut Lime Drop",
    description: "Coconut rum, vodka, fresh lime",
    category: "Cocktails Straight Up",
    slug: "coconut-lime-drop",
    image: "/drinks/coconut-lime-drop.jpg",
  },
  {
    name: "Espresso Martini",
    description: "Vodka, espresso",
    category: "Cocktails Straight Up",
    slug: "espresso-martini",
    image: "/drinks/espresso-martini.jpg",
  },
  {
    name: "The Lenox",
    description: "Prosecco with Grandma Julia\u2019s Fruit Punch, topped with a shot of cognac",
    category: "Cocktails Bubbly",
    slug: "the-lenox",
    image: "/drinks/the-lenox.jpg",
  },
  {
    name: "Bellini",
    description: "Prosecco with peach nectar",
    category: "Cocktails Bubbly",
    slug: "bellini",
    image: "/drinks/bellini.jpg",
  },
  {
    name: "Hugo Spritz",
    description: "Prosecco, elderflower, club soda, gin, mint",
    category: "Cocktails Bubbly",
    slug: "hugo-spritz",
    image: "/drinks/hugo-spritz.jpg",
  },
  {
    name: "South Carolina Spritz",
    description: "Grandma Julia's Fruit Punch, ,rum, prosecco, club soda",
    category: "Cocktails Bubbly",
    slug: "south-carolina-spritz",
    image: "/drinks/south-carolina-spritz.jpg",
  },
  {
    name: "Mo' Money Spritz",
    description: "Gin, strawberry puree, fresh lime",
    category: "Cocktails Bubbly",
    slug: "mo-money-spritz",
    image: "/drinks/mo-money-spritz.jpg",
  },
  {
    name: "Harlem\u2019s Own Sugar Hill Golden Ale",
    category: "Beer",
    slug: "harlems-own-sugar-hill-golden-ale",
    image: "/drinks/harlems-own-sugar-hill-golden-ale.jpg",
  },
  {
    name: "Stella Artois",
    category: "Beer",
    slug: "stella-artois",
    image: "/drinks/stella-artois.jpg",
  },
  {
    name: "Corona",
    category: "Beer",
    slug: "corona",
    image: "/drinks/corona.jpg",
  },
  {
    name: "Heineken",
    category: "Beer",
    slug: "heineken",
    image: "/drinks/heineken.jpg",
  },
  {
    name: "Budweiser",
    category: "Beer",
    slug: "budweiser",
    image: "/drinks/budweiser.jpg",
  },
  {
    name: "Bud Light",
    category: "Beer",
    slug: "bud-light",
    image: "/drinks/bud-light.jpg",
  },
  {
    name: "Dante Chardonnay, California, 2024",
    category: "White Wine",
    slug: "dante-chardonnay-california-2024",
    image: "/drinks/dante-chardonnay-california-2024.jpg",
  },
  {
    name: "Ca\u2019di Ponti Pinot Grigio, Italy, 2025",
    category: "White Wine",
    slug: "cadi-ponti-pinot-grigio-italy-2025",
    image: "/drinks/cadi-ponti-pinot-grigio-italy-2025.jpg",
  },
  {
    name: "Fair Valley Sauvignon Blanc, South Africa, 2024",
    category: "White Wine",
    slug: "fair-valley-sauvignon-blanc-south-africa-2024",
    image: "/drinks/fair-valley-sauvignon-blanc-south-africa-2024.jpg",
  },
  {
    name: "Ryan Patrick Riesling, Washington, 2023",
    category: "White Wine",
    slug: "ryan-patrick-riesling-washington-2023",
    image: "/drinks/ryan-patrick-riesling-washington-2023.jpg",
  },
  {
    name: "Dante Cabernet Sauvignon, California, 2023",
    category: "Red Wine",
    slug: "dante-cabernet-sauvignon-california-2023",
    image: "/drinks/dante-cabernet-sauvignon-california-2023.jpg",
  },
  {
    name: "Cesani Chianti Colli Senesi, Italy, 2022",
    category: "Red Wine",
    slug: "cesani-chianti-colli-senesi-italy-2022",
    image: "/drinks/cesani-chianti-colli-senesi-italy-2022.jpg",
  },
  {
    name: "Dante Merlot, California, 2023",
    category: "Red Wine",
    slug: "dante-merlot-california-2023",
    image: "/drinks/dante-merlot-california-2023.jpg",
  },
  {
    name: "Dante Pinot Noir, 2024",
    category: "Red Wine",
    slug: "dante-pinot-noir-2024",
    image: "/drinks/dante-pinot-noir-2024.jpg",
  },
  {
    name: "Ca\u2019 Furlan Cuv\u00e9e Beatrice Prosecco, Italy",
    category: "Sparkling Wine",
    slug: "ca-furlan-cuv-e-beatrice-prosecco-italy",
    image: "/drinks/ca-furlan-cuv-e-beatrice-prosecco-italy.jpg",
  },
  {
    name: "Ca\u2019 Furlan Cuv\u00e9e Beatrice Ros\u00e9 Prosecco, Italy",
    category: "Sparkling Wine",
    slug: "ca-furlan-cuv-e-beatrice-ros-prosecco-italy",
    image: "/drinks/ca-furlan-cuv-e-beatrice-ros-prosecco-italy.jpg",
  },
  {
    name: "Veuve Clicquot Brut Ros\u00e9",
    category: "Champagne",
    slug: "veuve-clicquot-brut-ros",
    image: "/drinks/veuve-clicquot-brut-ros.jpg",
  },
  {
    name: "Mo\u00ebt & Chandon Nectar Imperial",
    category: "Champagne",
    slug: "mo-t-chandon-nectar-imperial",
    image: "/drinks/mo-t-chandon-nectar-imperial.jpg",
  },
  {
    name: "Grandma Julia\u2019s Fruit Punch",
    category: "Zero-Proof Favorites",
    slug: "grandma-julias-fruit-punch",
    image: "/drinks/grandma-julias-fruit-punch.jpg",
  },
  {
    name: "Sylvia's Nojito",
    category: "Zero-Proof Favorites",
    slug: "sylvias-nojito",
    image: "/drinks/sylvias-nojito.jpg",
  },
  {
    name: "Home Brewed Sweetened Iced Tea",
    category: "Zero-Proof Favorites",
    slug: "home-brewed-sweetened-iced-tea",
    image: "/drinks/home-brewed-sweetened-iced-tea.jpg",
  },
  {
    name: "Peach Iced Tea",
    category: "Zero-Proof Favorites",
    slug: "peach-iced-tea",
    image: "/drinks/peach-iced-tea.jpg",
  },
  {
    name: "Lemonade",
    description: "Peach, Strawberry, Mango",
    category: "Zero-Proof Favorites",
    slug: "lemonade",
    image: "/drinks/lemonade.jpg",
  },
  {
    name: "Sylvia\u2019s Uptown",
    category: "Zero-Proof Favorites",
    slug: "sylvias-uptown",
    image: "/drinks/sylvias-uptown.jpg",
  },
  {
    name: "Coke",
    category: "Zero-Proof Favorites",
    slug: "coke",
    image: "/drinks/coke.jpg",
  },
  {
    name: "Diet Coke",
    category: "Zero-Proof Favorites",
    slug: "diet-coke",
    image: "/drinks/diet-coke.jpg",
  },
  {
    name: "Sprite",
    category: "Zero-Proof Favorites",
    slug: "sprite",
    image: "/drinks/sprite.jpg",
  },
  {
    name: "Ginger Ale",
    category: "Zero-Proof Favorites",
    slug: "ginger-ale",
    image: "/drinks/ginger-ale.jpg",
  },
  {
    name: "Bottled Water",
    category: "Zero-Proof Favorites",
    slug: "bottled-water",
    image: "/drinks/bottled-water.jpg",
  }
];
