import { app } from './auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer 
} from 'firebase/firestore';

export const db = getFirestore(app);

// Test connection on boot to verify configuration
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'app_states', 'connection_test'));
    console.log("Firebase Firestore connection verified.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    } else {
      console.warn("Firestore connection check info:", error);
    }
    return false;
  }
}

testConnection();

export interface SyncedAppState {
  records?: any[];
  classDays?: any[];
  studentNotes?: Record<string, string>;
  excusedAbsences?: Record<string, Record<string, boolean>>;
  rubricScores?: Record<string, any>;
  deletedStudentNames?: string[];
  studentPhotos?: Record<string, string>;
  studentLevels?: Record<string, string>;
  customAssignments?: any[];
  submissions?: any[];
  notifications?: any[];
  sheetUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Gets the document reference based on whether a user is logged in
 */
export function getStateDocRef(userEmail: string | null | undefined) {
  const docId = userEmail 
    ? `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` 
    : 'shared_default_state';
  return doc(db, 'app_states', docId);
}

/**
 * Load application state from Firestore
 */
export async function loadFromFirestore(userEmail: string | null | undefined): Promise<SyncedAppState | null> {
  try {
    const docRef = getStateDocRef(userEmail);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SyncedAppState;
    }
    return null;
  } catch (error) {
    console.error("Error loading state from Firestore:", error);
    return null;
  }
}

/**
 * Save application state to Firestore
 */
export async function saveToFirestore(
  userEmail: string | null | undefined, 
  state: SyncedAppState
): Promise<boolean> {
  try {
    const docRef = getStateDocRef(userEmail);
    const dataToSave = {
      ...state,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'anonymous'
    };
    await setDoc(docRef, dataToSave, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving state to Firestore:", error);
    return false;
  }
}
