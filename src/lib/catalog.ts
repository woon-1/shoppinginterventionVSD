import { CatalogItem } from "./types";

export const CATALOG: CatalogItem[] = [
  // Groceries (essentials by default)
  {
    id: "groc-bananas",
    name: "Bananas (bunch)",
    price: 3.49,
    category: "groceries",
    defaultEssential: true,
    emoji: "🍌",
  },
  {
    id: "groc-bread",
    name: "Whole Wheat Bread",
    price: 4.99,
    category: "groceries",
    defaultEssential: true,
    emoji: "🍞",
  },
  {
    id: "groc-eggs",
    name: "Eggs (dozen)",
    price: 6.29,
    category: "groceries",
    defaultEssential: true,
    emoji: "🥚",
  },
  // Hygiene (essentials by default)
  {
    id: "hyg-toothpaste",
    name: "Toothpaste",
    price: 5.49,
    category: "hygiene",
    defaultEssential: true,
    emoji: "🪥",
  },
  {
    id: "hyg-shampoo",
    name: "Shampoo",
    price: 8.99,
    category: "hygiene",
    defaultEssential: true,
    emoji: "🧴",
  },
  // Clothing (discretionary)
  {
    id: "clo-hoodie",
    name: "Cotton Hoodie",
    price: 38.0,
    category: "clothing",
    defaultEssential: false,
    emoji: "🧥",
  },
  {
    id: "clo-sneakers",
    name: "Running Sneakers",
    price: 89.99,
    category: "clothing",
    defaultEssential: false,
    emoji: "👟",
  },
  {
    id: "clo-tshirt",
    name: "Graphic T-Shirt",
    price: 22.0,
    category: "clothing",
    defaultEssential: false,
    emoji: "👕",
  },
  // Gadgets (discretionary)
  {
    id: "gad-headphones",
    name: "Wireless Earbuds",
    price: 79.0,
    category: "gadgets",
    defaultEssential: false,
    emoji: "🎧",
  },
  {
    id: "gad-keyboard",
    name: "Mechanical Keyboard",
    price: 119.0,
    category: "gadgets",
    defaultEssential: false,
    emoji: "⌨️",
  },
  // Decor (discretionary)
  {
    id: "dec-candle",
    name: "Scented Candle",
    price: 18.0,
    category: "decor",
    defaultEssential: false,
    emoji: "🕯️",
  },
  {
    id: "dec-print",
    name: "Wall Art Print",
    price: 32.0,
    category: "decor",
    defaultEssential: false,
    emoji: "🖼️",
  },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}
