const DATABASE_NAME = "bizzx-artwork";
const STORE_NAME = "uploads";

function openArtworkDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open artwork storage."));
  });
}

export async function saveArtwork(file: Blob): Promise<string> {
  const database = await openArtworkDatabase();
  const id = crypto.randomUUID();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not save artwork."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Artwork storage was interrupted."));
    });
  } finally {
    database.close();
  }

  return id;
}

export async function loadArtwork(id: string): Promise<Blob | undefined> {
  const database = await openArtworkDatabase();

  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const artwork: unknown = request.result;
        resolve(artwork instanceof Blob ? artwork : undefined);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Could not load saved artwork."));
    });
  } finally {
    database.close();
  }
}
