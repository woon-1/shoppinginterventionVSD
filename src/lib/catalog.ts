import { CatalogItem } from "./types";

export const CATALOG: CatalogItem[] = [
  // Groceries (essentials by default)
  {
    id: "groc-bananas",
    name: "Bananas (bunch)",
    price: 3.49,
    category: "groceries",
    defaultEssential: true,
    imageId: "1603833665858-e61d17a86224",
    emoji: "🍌",
  },
  {
    id: "groc-bread",
    name: "Whole Wheat Bread",
    price: 4.99,
    category: "groceries",
    defaultEssential: true,
    imageId: "1509440159596-0249088772ff",
    emoji: "🍞",
  },
  {
    id: "groc-eggs",
    name: "Eggs (dozen)",
    price: 6.29,
    category: "groceries",
    defaultEssential: true,
    imageId: "1582722872445-44dc5f7e3c8f",
    emoji: "🥚",
  },
  // Hygiene (essentials by default)
  {
    id: "hyg-toothpaste",
    name: "Toothpaste",
    price: 5.49,
    category: "hygiene",
    defaultEssential: true,
    imageId: "1607613009820-a29f7bb81c04",
    emoji: "🪥",
  },
  {
    id: "hyg-shampoo",
    name: "Shampoo",
    price: 8.99,
    category: "hygiene",
    defaultEssential: true,
    imageId: "1556228720-195a672e8a03",
    emoji: "🧴",
  },
  // Clothing (discretionary)
  {
    id: "clo-hoodie",
    name: "Cotton Hoodie",
    price: 38.0,
    category: "clothing",
    defaultEssential: false,
    imageId: "1556905055-8f358a7a47b2",
    emoji: "🧥",
  },
  {
    id: "clo-sneakers",
    name: "Running Sneakers",
    price: 89.99,
    category: "clothing",
    defaultEssential: false,
    imageId: "1542291026-7eec264c27ff",
    emoji: "👟",
  },
  {
    id: "clo-tshirt",
    name: "Graphic T-Shirt",
    price: 22.0,
    category: "clothing",
    defaultEssential: false,
    imageId: "1521572163474-6864f9cf17ab",
    emoji: "👕",
  },
  // Gadgets (discretionary)
  {
    id: "gad-headphones",
    name: "Wireless Earbuds",
    price: 79.0,
    category: "gadgets",
    defaultEssential: false,
    imageId: "1606220588913-b3aacb4d2f46",
    emoji: "🎧",
  },
  {
    id: "gad-keyboard",
    name: "Mechanical Keyboard",
    price: 119.0,
    category: "gadgets",
    defaultEssential: false,
    imageId: "1587829741301-dc798b83add3",
    emoji: "⌨️",
  },
  // Decor (discretionary)
  {
    id: "dec-candle",
    name: "Scented Candle",
    price: 18.0,
    category: "decor",
    defaultEssential: false,
    imageId: "1602874801006-9ba9ca0e9cb8",
    emoji: "🕯️",
  },
  {
    id: "dec-print",
    name: "Wall Art Print",
    price: 32.0,
    category: "decor",
    defaultEssential: false,
    imageId: "1513519245088-0e12902e5a38",
    emoji: "🖼️",
  },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function unsplashUrl(
  id: string,
  width: number,
  height: number = width
): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}
