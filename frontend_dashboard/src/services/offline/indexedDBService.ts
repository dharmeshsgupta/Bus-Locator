import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'BusLocatorDriverDB';
const STORE_NAME = 'offline_queue';
const MAX_QUEUE_SIZE = 500;

export interface OfflinePayload {
  id?: number;
  type: 'location' | 'occupancy' | 'emergency';
  data: any;
  timestamp: number;
}

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }

  async enqueue(type: OfflinePayload['type'], data: any) {
    const db = await this.dbPromise;
    const count = await db.count(STORE_NAME);
    
    // Manage Queue Size
    if (count >= MAX_QUEUE_SIZE) {
      // Delete oldest entry
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const cursor = await store.index('timestamp').openCursor();
      if (cursor) {
        await cursor.delete();
      }
      await tx.done;
    }

    await db.add(STORE_NAME, { type, data, timestamp: Date.now() });
  }

  async dequeueAll(): Promise<OfflinePayload[]> {
    const db = await this.dbPromise;
    return await db.getAll(STORE_NAME);
  }

  async clearQueue() {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }
}

export const offlineDB = new IndexedDBService();
