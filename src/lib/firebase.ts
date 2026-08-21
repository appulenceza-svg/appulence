import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBhLtUe0w3rIDDWCdrlmjnybWrZhjiIVIk",
  authDomain: "gen-lang-client-0440575936.firebaseapp.com",
  projectId: "gen-lang-client-0440575936",
  storageBucket: "gen-lang-client-0440575936.firebasestorage.app",
  messagingSenderId: "1013166344834",
  appId: "1:1013166344834:web:943d461696fd73f90dc29b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-appulencetech-92b3c571-53f4-495b-bb85-19cb7117dfbc");
