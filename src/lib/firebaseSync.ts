import { app } from './auth';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firestore using the explicit database ID from config
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence if available in browser context
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore offline persistence failed-precondition: multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore offline persistence is unimplemented in this browser.");
    } else {
      console.warn("Firestore offline persistence failed to initialize:", err);
    }
  });
}

// Test connection to verify configuration
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'app_states', 'connection_test'));
    console.log("Firebase Firestore connection verified.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration. Client is operating in offline mode.");
    } else {
      console.warn("Firestore connection check info:", error);
    }
    return false;
  }
}


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
  courses?: any[];
  schedules?: any[];
  libraryResources?: any[];
  classroomMedia?: any[];
  payments?: any[];
  zoomExceptionNote?: string;
  hasZoomException?: boolean;
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
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('failed to get document'))) {
      console.warn("Firestore is operating offline. Falling back to local state.", error.message);
    } else {
      console.error("Error loading state from Firestore:", error);
    }
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
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firestore is offline. Save is queued and will synchronize once online:", error.message);
      return true; // Return true because Firestore automatically queues and syncs offline writes
    }
    console.error("Error saving state to Firestore:", error);
    return false;
  }
}
