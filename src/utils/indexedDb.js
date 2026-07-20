export async function saveFileToIndexedDB(documentId, blob) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('generatedDocumentsDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const data = { id: documentId, blob };
      const putRequest = store.put(data);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = (e) => reject(e);
      tx.oncomplete = () => db.close();
    };
    request.onerror = (e) => reject(e);
  });
}
