import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { createServer } from "http";

// Initialize Firebase Admin lazily/gracefully
let adminApp: App | null = null;
function getFirebaseAdmin(): App {
  if (!adminApp) {
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0];
    } else {
      try {
        adminApp = initializeApp({
          projectId: "gen-lang-client-0440575936"
        });
        console.log("Firebase Admin initialized successfully with project ID: gen-lang-client-0440575936");
      } catch (err) {
        console.error("Firebase Admin initialization error, trying default init:", err);
        try {
          adminApp = initializeApp();
        } catch (err2) {
          console.error("Firebase Admin default init failed too:", err2);
          throw err2;
        }
      }
    }
  }
  return adminApp;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);

  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (clientWs: WebSocket) => {
    let session: any = null;
    let sessionPromise = ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
        },
        systemInstruction: "You are the Appulence Champion, a sales assistant for Appulence Tech (School Web Dev services). Your job is to talk to users, answer their questions about our school apps and development services, and collect their contact information (name, school name, phone/email, and what they are looking for) to log a lead. Once you have enough information, use the logLead tool to save it. Be polite and concise.",
        tools: [{
          functionDeclarations: [
            {
              name: "logLead",
              description: "Log a sales lead with contact info and requirements.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the person" },
                  schoolName: { type: Type.STRING, description: "Name of the school" },
                  contactInfo: { type: Type.STRING, description: "Email or phone number" },
                  requirements: { type: Type.STRING, description: "What they are looking for" }
                },
                required: ["name", "schoolName", "contactInfo"]
              }
            }
          ]
        }]
      },
      callbacks: {
        onmessage: async (message: LiveServerMessage) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
          
          if (message.toolCall) {
            const functionCalls = message.toolCall.functionCalls;
            if (functionCalls) {
              for (const call of functionCalls) {
                if (call.name === "logLead") {
                  const args = call.args as any;
                  try {
                    const db = getFirestore(getFirebaseAdmin());
                    await db.collection("ai_leads").add({
                      name: args.name,
                      schoolName: args.schoolName,
                      contactInfo: args.contactInfo,
                      requirements: args.requirements || "",
                      createdAt: new Date().toISOString(),
                      status: "new"
                    });
                    
                    if (session) {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { result: "Lead successfully logged. Thank the user." }
                        }]
                      });
                    }
                  } catch (e: any) {
                    console.error("Failed to log lead:", e);
                    if (session) {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { error: e.message }
                        }]
                      });
                    }
                  }
                }
              }
            }
          }
        },
      },
    });
    
    session = await sessionPromise;

    clientWs.on("message", (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
          });
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    });
    
    clientWs.on("close", () => {
      if (session) {
        // Any cleanup if necessary
      }
    });
  });

  app.use(express.json());


  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const contents = [];
      if (history && history.length > 0) {
        history.forEach((msg) => {
          contents.push({
            role: msg.role,
            parts: [{ text: msg.text }]
          });
        });
      }
      
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: "You are a helpful, professional Appulence Tech assistant. You guide users in finding the right application development services, CRMs, and school administration solutions.",
        }
      });
      
      res.json({ response: response.text });
    } catch (err) {
      console.error("Chat error:", err);
      res.status(500).json({ error: err.message || "Failed to generate response" });
    }
  });

  // API Route to Set Custom Claims and Sync with Firestore

  app.post("/api/set-user-claims", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const { uid, role, customerId, name, email } = req.body;

      if (!uid || !role) {
        return res.status(400).json({ error: "Missing required fields: uid or role" });
      }

      if (!["admin", "sales_rep", "customer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role value" });
      }

      const firebaseApp = getFirebaseAdmin();
      const auth = getAuth(firebaseApp);
      const db = getFirestore(firebaseApp);

      // Verify ID Token of the requester
      const decodedToken = await auth.verifyIdToken(idToken);
      const requesterUid = decodedToken.uid;
      const requesterEmail = decodedToken.email || "";

      // Authorization Logic:
      // 1. A user can set their own role to 'sales_rep' during initial self-onboarding/signup.
      // 2. An user who is already an 'admin' can set any user's role and customerId.
      // 3. For bootstrapping purposes: the user with email 'appulenceza@gmail.com' or 'demo@appulence.co.za' or containing 'admin' is authorized to set roles/claims.
      const isSelfSignup = requesterUid === uid && role === "sales_rep";
      const isRequesterAdmin = decodedToken.role === "admin";
      const isBootstraper = 
        requesterEmail === "appulenceza@gmail.com" || 
        requesterEmail === "demo@appulence.co.za" || 
        requesterEmail.toLowerCase().includes("admin");

      if (!isSelfSignup && !isRequesterAdmin && !isBootstraper) {
        return res.status(403).json({ error: "Forbidden: You do not have permissions to set roles or claims." });
      }

      // Set Custom Claims on Firebase Auth
      const claims: Record<string, any> = { role };
      if (role === "customer" && customerId) {
        claims.customerId = customerId;
      }
      await auth.setCustomUserClaims(uid, claims);
      console.log(`Successfully set claims for ${uid}:`, claims);

      // Sync with Firestore collection /users/{uid}
      const userRef = db.collection("users").doc(uid);
      const updateData: Record<string, any> = {
        role,
        uid,
        email: email || decodedToken.email || "",
        updatedAt: new Date().toISOString()
      };

      if (name) updateData.name = name;
      if (role === "customer" && customerId) {
        updateData.customerId = customerId;
      } else {
        updateData.customerId = null; // Clear out customerId for non-customers
      }

      await userRef.set(updateData, { merge: true });
      console.log(`Successfully synced Firestore /users/${uid} with data:`, updateData);

      return res.json({ success: true, message: `User claims set and Firestore updated.`, claims });
    } catch (error: any) {
      console.error("Error setting custom user claims:", error);
      return res.status(500).json({ error: error.message || "Failed to set user claims" });
    }
  });

  // API Route to Get All Schools
  app.get("/api/schools", (req, res) => {
    try {
      const schoolsPath = path.join(process.cwd(), 'src', 'data', 'schools.json');
      const fs = require('fs');
      if (fs.existsSync(schoolsPath)) {
        const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
        return res.json({ schools });
      } else {
        return res.status(404).json({ error: "Schools data not found" });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch schools" });
    }
  });

  // API Route to Get All Users (Admin Only)
  app.get("/api/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing auth header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const firebaseApp = getFirebaseAdmin();
      const auth = getAuth(firebaseApp);
      const db = getFirestore(firebaseApp);

      const decodedToken = await auth.verifyIdToken(idToken);
      
      const requesterEmail = decodedToken.email || "";
      const isRequesterAdmin = decodedToken.role === "admin";
      const isBootstraper = 
        requesterEmail === "appulenceza@gmail.com" || 
        requesterEmail === "demo@appulence.co.za" || 
        requesterEmail.toLowerCase().includes("admin");

      if (!isRequesterAdmin && !isBootstraper) {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }

      // Fetch all users from Firestore
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs.map(doc => doc.data());

      return res.json({ users });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
