import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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
