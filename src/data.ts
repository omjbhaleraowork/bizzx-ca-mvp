export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  sizes: string[];
  tag?: string;
};

export const products: Product[] = [
  {
    id: "bx-tee-01",
    slug: "everyday-heavy-tee",
    name: "Everyday Heavy Tee",
    category: "T-Shirts",
    price: 32,
    description:
      "A clean canvas for everyday wear and custom ideas. Add artwork and make it yours.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1100&q=85",
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    tag: "BESTSELLER",
  },
  {
    id: "bx-hood-02",
    slug: "studio-pullover-hoodie",
    name: "Studio Pullover Hoodie",
    category: "Hoodies",
    price: 58,
    description:
      "A relaxed-fit pullover ready for a small front mark or a statement back print.",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1100&q=85",
    sizes: ["S", "M", "L", "XL", "2XL"],
    tag: "NEW",
  },
  {
    id: "bx-sweat-03",
    slug: "off-duty-crewneck",
    name: "Off-Duty Crewneck",
    category: "Sweatshirts",
    price: 52,
    description:
      "An easy layer with room for your next idea. Designed to be worn on repeat.",
    image:
      "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?auto=format&fit=crop&w=1100&q=85",
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    id: "bx-tee-04",
    slug: "boxy-crop-tee",
    name: "Boxy Crop Tee",
    category: "T-Shirts",
    price: 29,
    description:
      "A shorter, boxier silhouette for a fresh take on a classic custom tee.",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1100&q=85",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "bx-hood-05",
    slug: "zip-through-layer",
    name: "Zip-Through Layer",
    category: "Hoodies",
    price: 64,
    description:
      "A versatile zip hoodie with a front and back ready for your artwork.",
    image:
      "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=1100&q=85",
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    id: "bx-sweat-06",
    slug: "everyday-sweatshirt",
    name: "Everyday Sweatshirt",
    category: "Sweatshirts",
    price: 48,
    description:
      "A timeless crew silhouette that gives your artwork space to speak.",
    image:
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1100&q=85",
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
];

export const categories = [
  {
    name: "T-Shirts",
    description: "Everyday staples, made personal.",
    image: products[0].image,
    count: "02 STYLES",
  },
  {
    name: "Hoodies",
    description: "Layers with room for your ideas.",
    image: products[1].image,
    count: "02 STYLES",
  },
  {
    name: "Sweatshirts",
    description: "The comfort-zone classics.",
    image: products[2].image,
    count: "02 STYLES",
  },
];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
