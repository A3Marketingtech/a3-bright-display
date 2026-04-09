import "./polyfills";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ensureFirestoreReady } from "./lib/firebase";

// Render immediately — never block on Firebase
createRoot(document.getElementById("root")!).render(<App />);

// Kick off Firestore network in background with timeout
// On Smart TVs this may hang; the app works regardless
ensureFirestoreReady(10000).then(function () {
  console.log('[A3] Firestore network ready or timed out');
});
