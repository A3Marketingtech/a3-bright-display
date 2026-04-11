import { initializeApp } from "firebase/app";
import { getFirestore, enableNetwork, disableNetwork, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB1f6i210TeL9Ahf33-UpvMgRyESZy-UR4",
  authDomain: "display-pro-f34ed.firebaseapp.com",
  projectId: "display-pro-f34ed",
  storageBucket: "display-pro-f34ed.firebasestorage.app",
  messagingSenderId: "150474706532",
  appId: "1:150474706532:web:08a68e732b8fa0a07b5971",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence — data survives network loss
enableIndexedDbPersistence(db).catch(function (err) {
  if (err.code === 'failed-precondition') {
    console.warn('[A3] Persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('[A3] Persistence not available in this browser');
  }
});

/**
 * Ensure Firestore network is enabled with a timeout.
 * On Smart TVs (especially LG WebOS), network setup can hang.
 * This resolves after timeout even if network isn't ready,
 * so the app never blocks indefinitely.
 */
export function ensureFirestoreReady(timeoutMs: number = 10000): Promise<void> {
  return Promise.race([
    enableNetwork(db).catch(function () {
      console.warn('[A3] Firestore enableNetwork failed, continuing offline');
    }),
    new Promise<void>(function (resolve) {
      setTimeout(function () {
        console.warn('[A3] Firestore ready timeout after ' + timeoutMs + 'ms, proceeding anyway');
        resolve();
      }, timeoutMs);
    }),
  ]);
}
