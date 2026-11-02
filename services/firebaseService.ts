
import { initializeApp } from 'firebase/app';
import { securityService } from './securityService';
// We import 'firebase/auth' and 'firebase/firestore' for their side effects (registering the services)
// even if we destructure specific functions.
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, deleteUser, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// --- PASTE YOUR FIREBASE KEYS HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyAqVo1KVUpMW5bv64iT91TioQmbkBdI4zU",
  authDomain: "the-lazy-billionaire.firebaseapp.com",
  projectId: "the-lazy-billionaire",
  storageBucket: "the-lazy-billionaire.firebasestorage.app",
  messagingSenderId: "772016952780",
  appId: "1:772016952780:web:28ed5cd2f43a0e386af969",
  measurementId: "G-N65FXC4TQM"
};

// Check if keys are present
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;

let auth: any;
let db: any;
let googleProvider: any;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    console.log("Firebase Initialized Successfully");
  } catch (e) {
    console.error("Firebase Init Failed:", e);
  }
} else {
  console.log("Firebase Keys Missing - Running in Simulation Mode");
}

export const firebaseService = {
  isConfigured,

  // GOOGLE LOGIN
  loginGoogle: async (): Promise<{ user: User | null, error: string | null }> => {
    if (!isConfigured) return { user: null, error: "Simulation Mode" };
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // EMAIL LOGIN
  loginEmail: async (email: string, pass: string) => {
    if (!isConfigured) return { user: null, error: "Simulation Mode" };
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // SIGN UP
  signupEmail: async (email: string, pass: string, username: string) => {
    if (!isConfigured) return { user: null, error: "Simulation Mode" };
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await updateProfile(result.user, { displayName: username });
      }
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // LOGOUT
  logout: async () => {
    if (isConfigured) await signOut(auth);
  },

  // SAVE GAME DATA
  saveGame: async (userId: string, data: any) => {
    if (!isConfigured || !userId || !db) return;
    try {
        // 1. SECURITY: Sign the data before any transformation
        const signature = await securityService.signData(data);
        
        // 2. TRANSFORM: Convert Array to Map to fix database readability issues
        const assetsMap = (data.assets || []).reduce((acc: any, asset: any) => {
           acc[asset.id] = asset;
           return acc;
        }, {});

        // Prepare the payload
        const saveData = {
            ...JSON.parse(JSON.stringify(data)),
            assets: assetsMap, // Overwrite array with Map for Firestore storage
            securitySignature: signature,
            lastServerUpdate: Date.now(),
            _schemaVersion: "2.0_MAP_STRUCTURE",
            _securityVersion: "1.0_SIGNED"
        };

        await setDoc(doc(db, "users", userId), saveData, { merge: true });
        console.log("Cloud save successful (Secure + Structured)");
    } catch (e) {
        console.error("Cloud Save Failed", e);
    }
  },

  // LOAD GAME DATA
  loadGame: async (userId: string) => {
    if (!isConfigured || !userId || !db) return null;
    try {
        const docSnap = await getDoc(doc(db, "users", userId));
        if (docSnap.exists()) {
            console.log("Cloud save found");
            const rawData = docSnap.data();

            // 1. DETRANSFORM: Map -> Array
            let assetsArray = [];
            if (rawData.assets && !Array.isArray(rawData.assets)) {
                // It is a Map (Object), convert back to Array
                assetsArray = Object.values(rawData.assets);
            } else if (Array.isArray(rawData.assets)) {
                // Legacy Array support
                assetsArray = rawData.assets;
            }

            // Reconstruct the logical state object for the app
            const logicalState = {
                ...rawData,
                assets: assetsArray
            };

            // 2. SECURITY: Validate Signature
            const check = await securityService.validateData(logicalState);
            if (!check.valid) {
                 console.warn("SECURITY ALERT:", check.reason);
                 // We flag this in the state so the App can decide what to do (e.g. show 'Cheater' badge)
                 (logicalState as any).securityAlert = check.reason;
            }

            return logicalState;
        }
    } catch (e) {
         console.error("Cloud Load Failed", e);
    }
    return null;
  },

  // FETCH GLOBAL LEADERBOARD
  getGlobalLeaderboard: async (count: number = 50) => {
    if (!isConfigured || !db) return [];
    try {
        const q = query(collection(db, "users"), orderBy("money", "desc"), limit(count));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.userName || "Unknown Mogul",
                money: data.money || 0,
                avatar: data.avatar || "👤",
                isRemote: true,
            };
        });
    } catch (e) {
        console.error("Leaderboard Fetch Failed", e);
        return [];
    }
  },

  // DELETE ACCOUNT & ERASE CLOUD RECORD (Google Play Compliance)
  deleteAccount: async (userId: string): Promise<{ success: boolean, error: string | null }> => {
    try {
      if (isConfigured && db && userId) {
        // Erase document from Firestore
        await deleteDoc(doc(db, "users", userId));
      }
      if (isConfigured && auth && auth.currentUser) {
        // Delete Firebase Auth identity
        await deleteUser(auth.currentUser);
      }
      return { success: true, error: null };
    } catch (e: any) {
      console.error("Account deletion failed:", e);
      return { success: false, error: e?.message || "Deletion failed" };
    }
  }
};
