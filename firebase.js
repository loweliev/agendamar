
// Importa Firebase y configura tu base de datos
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_TH5CFzXrAHWUffsjy6IHe5AexSw1fcg",
  authDomain: "agenda-mya.firebaseapp.com",
  projectId: "agenda-mya",
  storageBucket: "agenda-mya.appspot.com",
  messagingSenderId: "640452417589",
  appId: "1:640452417589:web:10135d2a635afb1713397c",
  databaseURL: "https://agenda-mya-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, get, set, push, update, remove, onValue };
