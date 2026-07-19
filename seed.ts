import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./firebase-applet-config.json');
let firebaseConfig;
try {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Error reading firebase-applet-config.json:', error);
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const seedData = async () => {
  try {
    console.log('Seeding data...');
    // Insert Products
    const batch = writeBatch(db);
    const products = [
      { id: 'prod_1', name: 'Flaym Meatbox', category: 'Meatbox', description: 'Loaded boxes of grilled chicken, beef, and lamb - served with fries, garlic sauce, and our secret Flaym spice blend.', cost_price: 150, selling_price: 280, image_url: '/src/assets/images/flaym_meatbox_1784290718155.jpg', is_available: true, sort_order: 1, is_vegetarian: false, is_spicy: true, is_gluten_free: false },
      { id: 'prod_2', name: 'Chicken Meatbox', category: 'Meatbox', description: 'Juicy chicken with fries and garlic sauce.', cost_price: 120, selling_price: 220, image_url: '/src/assets/images/flaym_meatbox_1784290718155.jpg', is_available: true, sort_order: 2, is_vegetarian: false, is_spicy: false, is_gluten_free: false },
      { id: 'prod_3', name: 'Flaym Shawarma', category: 'Shawarma', description: 'Tender, juicy meat wrapped in fresh bread with crispy veggies, creamy sauces, and the perfect kick of spice.', cost_price: 80, selling_price: 160, image_url: '/src/assets/images/flaym_shawarma_1784290704330.jpg', is_available: true, sort_order: 3, is_vegetarian: false, is_spicy: true, is_gluten_free: false },
      { id: 'prod_4', name: 'Beef Shawarma', category: 'Shawarma', description: 'Flavorful beef wrap with fresh veggies and tahini.', cost_price: 100, selling_price: 190, image_url: '/src/assets/images/flaym_shawarma_1784290704330.jpg', is_available: true, sort_order: 4, is_vegetarian: false, is_spicy: false, is_gluten_free: false },
      { id: 'prod_5', name: 'Meatbox & Shawarma Combo', category: 'Combos', description: 'Can\'t choose? Don\'t. Our combo platters bring the best of both worlds - Meatbox + Shawarma, side by side.', cost_price: 200, selling_price: 380, image_url: '/src/assets/images/flaym_hero_meat_1784290684310.jpg', is_available: true, sort_order: 5, is_vegetarian: false, is_spicy: true, is_gluten_free: false },
      { id: 'prod_6', name: 'Family Feast', category: 'Combos', description: 'The ultimate feast for the bold. 2 Meatboxes, 2 Shawarmas, and extra fries.', cost_price: 450, selling_price: 850, image_url: '/src/assets/images/flaym_hero_meat_1784290684310.jpg', is_available: true, sort_order: 6, is_vegetarian: false, is_spicy: true, is_gluten_free: false },
      { id: 'prod_7', name: 'Veggie Falafel Shawarma', category: 'Shawarma', description: 'Crispy, spiced chickpea falafel patties wrapped in warm pita bread with shredded lettuce, pickled turnips, and sesame tahini sauce.', cost_price: 60, selling_price: 130, image_url: '/src/assets/images/flaym_shawarma_1784290704330.jpg', is_available: true, sort_order: 7, is_vegetarian: true, is_spicy: true, is_gluten_free: false },
      { id: 'prod_8', name: 'Cheesy Paneer Meatbox', category: 'Meatbox', description: 'Grilled chunks of marinated paneer (cottage cheese) served over golden hand-cut fries, drizzled with sweet chili and Flaym special garlic sauce.', cost_price: 110, selling_price: 240, image_url: '/src/assets/images/flaym_meatbox_1784290718155.jpg', is_available: true, sort_order: 8, is_vegetarian: true, is_spicy: false, is_gluten_free: true },
      { id: 'prod_9', name: 'Spicy Veggie Platter', category: 'Combos', description: 'The ultimate green combo. 1 Veggie Falafel Shawarma, 1 Paneer Box, and extra spicy dipping sauce.', cost_price: 160, selling_price: 350, image_url: '/src/assets/images/flaym_hero_meat_1784290684310.jpg', is_available: true, sort_order: 9, is_vegetarian: true, is_spicy: true, is_gluten_free: true }
    ];

    products.forEach(p => {
      const { id, ...data } = p;
      batch.set(doc(db, 'products', id), data);
    });

    // Insert Settings
    batch.set(doc(db, 'settings', 'store_config'), {
      delivery_charge: 70,
      bkash_number: '01712345678',
      nagad_number: '01912345678',
      bank_details: 'City Bank, Acc: 1234567890',
      delivery_area: 'Mirpur, Dhaka'
    });

    await batch.commit();
    console.log('Database seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
