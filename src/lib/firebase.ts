import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export const triggerOrderNotification = async (orderId: string, status: string, type: 'admin' | 'customer') => {
  try {
    await addDoc(collection(db, 'notifications'), {
      orderId,
      status,
      type,
      timestamp: Date.now(),
      acknowledged: false
    });
  } catch (err) {
    console.error("Failed to trigger notification:", err);
  }
};
