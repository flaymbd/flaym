import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

let firebaseConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.error("Failed to read firebase-applet-config.json:", err);
}

let firebaseAdminApp: any = null;
try {
  firebaseAdminApp = initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log("Firebase Admin initialized with project ID:", firebaseConfig.projectId);
} catch (error) {
  console.error("Firebase Admin initialization failed:", error);
}

const app = express();
app.use(express.json());
const PORT = 3000;

app.get('/api/health', async (req, res) => {
  try {
    const db = getFirestore(firebaseAdminApp, firebaseConfig.firestoreDatabaseId);
    await db.collection('test').doc('ping').set({ timestamp: FieldValue.serverTimestamp() });
    res.json({ status: 'ok', firebaseAdmin: 'connected' });
  } catch (error: any) {
    console.warn("Firebase Admin database write check warning:", error.message);
    res.json({ status: 'ok', firebaseAdmin: 'limited-access', warning: error.message });
  }
});

app.post('/api/recommendations', async (req, res) => {
  const { customerId } = req.body;

  try {
    // 1. Get available products from body or fallback to fetching
    let availableProducts = req.body.availableProducts;
    if (!availableProducts || !Array.isArray(availableProducts) || availableProducts.length === 0) {
      try {
        const db = getFirestore(firebaseAdminApp, firebaseConfig.firestoreDatabaseId);
        const productsSnap = await db.collection('products').where('is_available', '==', true).get();
        availableProducts = productsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description || '',
          selling_price: doc.data().selling_price,
          category: doc.data().category || '',
          image_url: doc.data().image_url || '',
          is_vegetarian: !!doc.data().is_vegetarian,
          is_spicy: !!doc.data().is_spicy,
        }));
      } catch (err: any) {
        console.warn("Could not fetch products via firebase-admin backup:", err.message);
        availableProducts = [];
      }
    }

    if (availableProducts.length === 0) {
      return res.json({ recommendations: [] });
    }

    // 2. Get customer orders & items from body or fallback to fetching
    let orderHistoryText = "No previous orders found.";
    if (req.body.orderHistory && Array.isArray(req.body.orderHistory) && req.body.orderHistory.length > 0) {
      orderHistoryText = JSON.stringify(req.body.orderHistory);
    } else if (customerId) {
      try {
        const db = getFirestore(firebaseAdminApp, firebaseConfig.firestoreDatabaseId);
        const ordersSnap = await db.collection('orders')
          .where('customer_id', '==', customerId)
          .orderBy('created_at', 'desc')
          .limit(5)
          .get();

        if (!ordersSnap.empty) {
          const orderHistory: any[] = [];
          for (const orderDoc of ordersSnap.docs) {
            const itemsSnap = await orderDoc.ref.collection('items').get();
            const items = itemsSnap.docs.map(itemDoc => ({
              name: itemDoc.data().name_snapshot || itemDoc.data().name || '',
              quantity: itemDoc.data().quantity || 1,
              unit_price: itemDoc.data().unit_price || 0,
            }));
            orderHistory.push({
              orderNumber: orderDoc.data().order_number,
              status: orderDoc.data().status,
              total: orderDoc.data().total,
              items: items,
            });
          }
          orderHistoryText = JSON.stringify(orderHistory);
        }
      } catch (err: any) {
        console.warn("Could not fetch order history via firebase-admin backup:", err.message);
      }
    }

    // 3. Get Gemini Client
    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      console.error("Gemini initialization failed:", err.message);
      // Fallback gracefully without throwing a 500. Return first 3 available items as defaults
      return res.json({
        recommendations: availableProducts.slice(0, 3).map((p) => ({
          productId: p.id,
          reason: "Signature FLAYM item. Flame-grilled to absolute perfection with bold wood-fired flavors!"
        })),
        isFallback: true,
        error: "Gemini API key is missing or invalid. Displaying signature items instead."
      });
    }

    // 4. Construct Prompt
    const prompt = `You are a personalized culinary recommendation engine for "FLAYM", a premium wood-fired food brand specializing in flame-grilled Meatboxes, Shawarmas, and Combos.
We have the following list of currently available menu items:
${JSON.stringify(availableProducts, null, 2)}

The user has the following order history of past meals:
${orderHistoryText}

Please recommend up to 3 specific available menu items from our list that this customer is most likely to enjoy.
Guidelines for recommendations:
1. Recommend items that are actually on the available menu list. Match them by their exact ID as 'productId'.
2. If the user has a previous order history:
   - Analyze their taste: if they order spicy items, recommend spicy. If they prefer vegetarian/meat boxes/shawarmas, recommend matching profiles, or suggest trying a new highly-rated item from another category they haven't tried yet.
   - Craft a beautiful, highly personalized reason (in English) connecting the recommendation back to their history (e.g., "Since you loved the Spicy Meatbox, you'll adore our signature Spicy Shawarma!").
3. If the user has NO previous order history (empty or guest user):
   - Recommend our absolute best, high-quality, crowd-pleasing signature dishes (e.g., signature Meatbox, specialty Shawarma, or a supreme Combo).
   - Craft an enticing, mouth-watering reason (in English) highlighting the bold flavors and premium flame-grilled nature of the item.
4. Keep the reason concise but descriptive and culinary-focused (1-2 short, appetizing sentences). Do not use placeholders or generic phrases like "Because it is on the menu". Use highly premium culinary words.

Return the recommendations as a JSON array matching the requested schema.`;

    // 5. Generate content using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: {
                type: Type.STRING,
                description: "The exact matching ID of the recommended product."
              },
              reason: {
                type: Type.STRING,
                description: "An appetizing, customized, premium recommendation reason."
              }
            },
            required: ["productId", "reason"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    let parsedRecommendations: any[] = [];
    try {
      parsedRecommendations = JSON.parse(text);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response as JSON. Raw text:", text);
      return res.json({
        recommendations: availableProducts.slice(0, 3).map((p) => ({
          productId: p.id,
          reason: "Flame-grilled to perfection! A FLAYM signature masterpiece with rich, smokey depth."
        }))
      });
    }
    
    // Filter out any recommendations whose productId doesn't exist in availableProducts
    const validRecommendations = parsedRecommendations.filter((rec: any) => 
      availableProducts.some(p => p.id === rec.productId)
    );

    res.json({
      recommendations: validRecommendations.slice(0, 3)
    });

  } catch (error: any) {
    console.error("Recommendations API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate recommendations" });
  }
});

async function startServer() {
  // Serve public directory files statically at /
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
