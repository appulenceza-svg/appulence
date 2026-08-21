import { initializeApp as initAdmin, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

const adminApp = initAdmin({ projectId: "gen-lang-client-0440575936" });
const adminAuth = getAdminAuth(adminApp);
const adminDb = getAdminFirestore(adminApp, "ai-studio-appulencetech-92b3c571-53f4-495b-bb85-19cb7117dfbc");

async function setup() {
  try {
    const user = await adminAuth.createUser({
      email: 'sales@example.com',
      password: 'password123',
    });
    await adminAuth.setCustomUserClaims(user.uid, { role: 'sales_rep' });
    console.log("Created sales_rep user:", user.uid);
  } catch(e) {
    console.log("Error creating user:", e.message);
  }
}
setup();
