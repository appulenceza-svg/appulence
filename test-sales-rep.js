import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

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
  await signInWithEmailAndPassword(auth, "sales@example.com", "password123");
  console.log("Logged in:", auth.currentUser.uid);
  
  // Test customers query as sales_rep
  const q = query(collection(db, "customers"), where("ownerId", "==", auth.currentUser.uid));
  try {
    const snap = await getDocs(q);
    console.log("Customers fetch OK, docs:", snap.docs.length);
  } catch(e) {
    console.log("Customers fetch ERROR:", e.message);
  }
  
  // Test deals query
  try {
    const qDeals = query(collection(db, "deals"));
    const snapDeals = await getDocs(qDeals);
    console.log("Deals fetch OK");
  } catch(e) {
    console.log("Deals fetch ERROR:", e.message);
  }

  // Test contacts
  try {
    const qContacts = collection(db, "customers", "ANY_ID", "contacts");
    const snapContacts = await getDocs(qContacts);
    console.log("Contacts fetch OK");
  } catch(e) {
    console.log("Contacts fetch ERROR:", e.message);
  }
  process.exit(0);
}

test().catch(console.error);
