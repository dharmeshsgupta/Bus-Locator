import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface RouteDraftDB extends DBSchema {
  drafts: {
    key: string;
    value: {
      id: string;
      routeInfo: any;
      stops: any[];
      schedules: any[];
      busId: string | null;
      driverId: string | null;
      currentStep: number;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'buslocator-drafts-db';
const STORE_NAME = 'drafts';
const DB_VERSION = 1;

class RouteDraftService {
  private dbPromise: Promise<IDBPDatabase<RouteDraftDB>>;

  constructor() {
    this.dbPromise = openDB<RouteDraftDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  async saveDraft(draft: any) {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, {
      ...draft,
      id: 'current_route_draft', // We only maintain one draft at a time
      updatedAt: Date.now(),
    });
  }

  async getDraft() {
    const db = await this.dbPromise;
    return await db.get(STORE_NAME, 'current_route_draft');
  }

  async clearDraft() {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, 'current_route_draft');
  }
}

export const routeDraftService = new RouteDraftService();
