// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ✅ Reemplaza esto con tu configuración real
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID",
  databaseURL: "https://TU_PROJECT_ID-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, get, set, push, update, remove, onValue };
