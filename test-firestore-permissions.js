import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhLtUe0w3rIDDWCdrlmjnybWrZhjiIVIk",
  authDomain: "gen-lang-client-0440575936.firebaseapp.com",
  projectId: "gen-lang-client-0440575936",
  storageBucket: "gen-lang-client-0440575936.firebasestorage.app",
  messagingSenderId: "1013166344834",
  appId: "1:1013166344834:web:943d461696fd73f90dc29b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-appulencetech-92b3c571-53f4-495b-bb85-19cb7117dfbc");

async function test() {
  await signInWithEmailAndPassword(auth, "demo@appulence.co.za", "password123");
  console.log("Logged in:", auth.currentUser.uid);
  
  // Test customers query as sales_rep
  const q = query(collection(db, "customers"), where("ownerId", "==", auth.currentUser.uid));
  try {
    const snap = await getDocs(q);
    console.log("Customers fetch OK, docs:", snap.docs.length);
  } catch(e) {
    console.log("Customers fetch ERROR:", e.message);
  }
}

test().catch(console.error);
