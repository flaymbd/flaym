export interface Product {
  id: string;
  name: string;
  category: 'Meatbox' | 'Shawarma' | 'Combos';
  description: string;
  price: number;
}

export const menuProducts: Product[] = [
  { id: '1', name: 'Flaym Meatbox', category: 'Meatbox', description: 'Grilled chicken, beef, and lamb with fries.', price: 250 },
  { id: '2', name: 'Chicken Meatbox', category: 'Meatbox', description: 'Juicy chicken with fries.', price: 200 },
  { id: '3', name: 'Flaym Shawarma', category: 'Shawarma', description: 'Tender meat in fresh bread.', price: 150 },
  { id: '4', name: 'Beef Shawarma', category: 'Shawarma', description: 'Flavorful beef wrap.', price: 180 },
  { id: '5', name: 'Meatbox & Shawarma Combo', category: 'Combos', description: 'The best of both worlds.', price: 350 },
  { id: '6', name: 'Family Feast', category: 'Combos', description: 'A massive feast for the bold.', price: 600 },
];
