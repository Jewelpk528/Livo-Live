import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { RoomImage, BackgroundMusicState, CallHistoryRecord, UserProfile } from '../types';

let isFirebaseInitialized = false;
let db: any = null;
let storage: any = null;

// Initialize Firebase dynamically based on server configuration availability
async function ensureFirebase(): Promise<boolean> {
  if (isFirebaseInitialized) return true;
  try {
    const res = await fetch('/api/firebase-config');
    const data = await res.json();
    if (data.available && data.config) {
      if (getApps().length === 0) {
        const app = initializeApp(data.config);
        db = getFirestore(app);
        storage = getStorage(app);
      } else {
        const app = getApp();
        db = getFirestore(app);
        storage = getStorage(app);
      }
      isFirebaseInitialized = true;
      return true;
    }
  } catch (error) {
    console.warn("Firebase not provisioned. Falling back to simulated storage:", error);
  }
  return false;
}

// Helper to convert File to Base64 for the mock Express upload endpoint fallback
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Syncs room settings (images & background music) in real-time.
 * If Firebase is configured, uses Firestore onSnapshot;
 * otherwise, polls the Express simulation every 2 seconds.
 */
export function onRoomSettingsSync(
  roomId: string,
  callback: (settings: { images: RoomImage[]; backgroundMusic: BackgroundMusicState | null }) => void
): () => void {
  let active = true;
  let unsubscribeFirestore: (() => void) | null = null;
  let pollInterval: any = null;

  const initSync = async () => {
    const hasFirebase = await ensureFirebase();
    if (!active) return;

    if (hasFirebase && db) {
      try {
        unsubscribeFirestore = onSnapshot(
          doc(db, 'live_rooms', roomId),
          (docSnap) => {
            if (active && docSnap.exists()) {
              const data = docSnap.data();
              callback({
                images: data.images || [],
                backgroundMusic: data.backgroundMusic || null,
              });
            }
          },
          (error) => {
            console.error("Firestore onSnapshot error, falling back to polling:", error);
            // Fallback to polling if permission fails
            startPolling();
          }
        );
      } catch (err) {
        console.error("Failed to set up Firestore sync:", err);
        startPolling();
      }
    } else {
      startPolling();
    }
  };

  const startPolling = () => {
    if (pollInterval) return;
    // Initial fetch
    fetchRoomSettingsDirect();
    pollInterval = setInterval(fetchRoomSettingsDirect, 2000);
  };

  const fetchRoomSettingsDirect = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (active) {
          callback({
            images: data.images || [],
            backgroundMusic: data.backgroundMusic || null,
          });
        }
      }
    } catch (err) {
      console.warn("Error polling room settings:", err);
    }
  };

  initSync();

  return () => {
    active = false;
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  };
}

/**
 * Uploads a file (Image or MP3) to Firebase Storage if available,
 * or saves it on the local Express backend under /uploads/
 */
export async function uploadRoomFile(roomId: string, file: File, folder: 'images' | 'music'): Promise<string> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && storage) {
    try {
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const storageRef = ref(storage, `live_rooms/${roomId}/${folder}/${safeName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error("Firebase Storage upload failed, trying local upload:", error);
    }
  }

  // Fallback to local Express upload
  const fileData = await fileToBase64(file);
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileData,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to upload file to local storage');
  }

  const result = await response.json();
  return result.url;
}

/**
 * Saves the current images list for a room.
 * Stores in Firestore or posts to local Express endpoint.
 */
export async function saveRoomImages(roomId: string, images: RoomImage[]): Promise<void> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && db) {
    try {
      await setDoc(doc(db, 'live_rooms', roomId), { images }, { merge: true });
      return;
    } catch (error) {
      console.error("Firestore save images failed, using local fallback:", error);
    }
  }

  // Fallback
  const response = await fetch(`/api/rooms/${roomId}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  });

  if (!response.ok) {
    throw new Error('Failed to update room images on backend');
  }
}

/**
 * Saves the current background music state for a room.
 * Stores in Firestore or posts to local Express endpoint.
 */
export async function saveRoomMusic(roomId: string, music: BackgroundMusicState | null): Promise<void> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && db) {
    try {
      await setDoc(doc(db, 'live_rooms', roomId), { backgroundMusic: music }, { merge: true });
      return;
    } catch (error) {
      console.error("Firestore save music failed, using local fallback:", error);
    }
  }

  // Fallback
  const response = await fetch(`/api/rooms/${roomId}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backgroundMusic: music }),
  });

  if (!response.ok) {
    throw new Error('Failed to update room background music on backend');
  }
}

/**
 * Saves a completed, missed, or cancelled Voice/Video call record to Firestore
 * and posts it to the local Express backend call history.
 */
export async function saveCallHistory(record: CallHistoryRecord): Promise<void> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && db) {
    try {
      // Save directly to the 'call_history' collection in Firestore as requested
      const callDocRef = doc(db, 'call_history', record.callId);
      await setDoc(callDocRef, record);
      console.log(`[Firestore] Saved call history: ${record.callId}`);
    } catch (error) {
      console.error("Firestore save call_history failed, falling back to server database:", error);
    }
  }

  // Always post to Express server for local synchronization
  try {
    const response = await fetch('/api/calls/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      console.warn('Local call history endpoint returned failure status');
    }
  } catch (err) {
    console.error('Failed to post call history to local Express server:', err);
  }
}

/**
 * Saves generated demo users to Firestore under demo_users/ collection.
 */
export async function saveDemoUsersToFirestore(users: UserProfile[]): Promise<boolean> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && db) {
    try {
      console.log(`[Firestore] Syncing ${users.length} demo users to Firestore...`);
      const promises = users.map(user => {
        const userDocRef = doc(db, 'demo_users', user.id);
        return setDoc(userDocRef, user);
      });
      await Promise.all(promises);
      console.log(`[Firestore] Successfully synced all demo users.`);
      return true;
    } catch (error) {
      console.error("Firestore save demo_users failed:", error);
    }
  }
  return false;
}

/**
 * Deletes all documents in demo_users/ collection from Firestore.
 */
export async function deleteDemoUsersFromFirestore(): Promise<boolean> {
  const hasFirebase = await ensureFirebase();
  if (hasFirebase && db) {
    try {
      console.log("[Firestore] Fetching all demo users to delete...");
      const colRef = collection(db, 'demo_users');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        console.log("[Firestore] No demo users found to delete.");
        return true;
      }
      
      const deletePromises = snapshot.docs.map(docSnap => {
        return deleteDoc(docSnap.ref);
      });
      await Promise.all(deletePromises);
      console.log(`[Firestore] Deleted ${snapshot.size} demo users successfully.`);
      return true;
    } catch (error) {
      console.error("Firestore delete demo_users failed:", error);
    }
  }
  return false;
}
