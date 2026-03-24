/**
 * Background Sync Queue
 * Queues failed requests for retry when back online
 */

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

const DB_NAME = 'shopopti-sync-queue';
const STORE_NAME = 'requests';

class RequestQueue {
  private db: IDBDatabase | null = null;
  private processing = false;

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onerror = () => reject(request.error);
    });
  }

  async enqueue(req: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    await this.init();
    const entry: QueuedRequest = {
      ...req,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = () => resolve(entry.id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAll(): Promise<QueuedRequest[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async remove(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async processQueue(): Promise<{ processed: number; failed: number }> {
    if (this.processing || !navigator.onLine) return { processed: 0, failed: 0 };
    this.processing = true;

    let processed = 0;
    let failed = 0;

    try {
      const entries = await this.getAll();

      for (const entry of entries) {
        try {
          const response = await fetch(entry.url, {
            method: entry.method,
            headers: entry.headers,
            body: entry.body,
          });

          if (response.ok) {
            await this.remove(entry.id);
            processed++;
          } else if (entry.retries >= entry.maxRetries) {
            await this.remove(entry.id);
            failed++;
          } else {
            // Update retry count
            entry.retries++;
            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(entry);
          }
        } catch {
          if (entry.retries >= entry.maxRetries) {
            await this.remove(entry.id);
            failed++;
          }
        }
      }
    } finally {
      this.processing = false;
    }

    return { processed, failed };
  }

  startAutoSync(intervalMs = 30_000): () => void {
    const handler = () => this.processQueue();
    window.addEventListener('online', handler);
    const interval = setInterval(handler, intervalMs);

    return () => {
      window.removeEventListener('online', handler);
      clearInterval(interval);
    };
  }
}

export const requestQueue = new RequestQueue();
