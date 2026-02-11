import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import "dotenv/config";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

if (!serviceAccount.project_id) {
  console.error("FIREBASE_SERVICE_ACCOUNT não configurado.");
}

const app = initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore(app);

// Helper para converter Firestore para formato legível (SQLite-like)
export const toJSON = (doc) => {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const toList = (snapshot) => {
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
