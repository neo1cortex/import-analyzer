import type { ListingAnalysis } from '../shared/messages';

const dbName = 'import-analyzer';
const storeName = 'analyses';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'listing.url' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveAnalysis(analysis: ListingAnalysis): Promise<void> {
  const db = await database();
  await new Promise<void>((resolve, reject) => { const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(analysis); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  db.close();
}
export async function getAnalysis(url: string): Promise<ListingAnalysis | undefined> {
  const db = await database();
  const result = await new Promise<ListingAnalysis | undefined>((resolve, reject) => { const request = db.transaction(storeName).objectStore(storeName).get(url); request.onsuccess = () => resolve(request.result as ListingAnalysis | undefined); request.onerror = () => reject(request.error); });
  db.close(); return result;
}
