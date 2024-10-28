import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndexDbService {

  private dbPromise: Promise<IDBPDatabase<any>>;
  private dbName = "FormData"

  constructor() {
    this.dbPromise = this.initDB();
  }

  // Initialize the IndexedDB database with custom keyPath
  async initDB() {
    return await openDB(this.dbName, 1, {
      upgrade(db:any) {
        if (!db.objectStoreNames.contains('objectsStore')) {
          // Set the keyPath to 'customKey' instead of 'id'
          db.createObjectStore('objectsStore', { keyPath: 'customKey' });
        }
      }
    });
  }

  // Add an object with a custom key
  addObject(object: any): Observable<any> {
    return from(this.dbPromise.then((db:any) => {
      return db.transaction('objectsStore', 'readwrite')
               .objectStore('objectsStore')
               .add(object);  // 'customKey' should be present in the object
    }));
  }

  // Get an object by the custom key
  getObjectByKey(customKey: any): Observable<any> {
    return from(this.dbPromise.then((db:any) => {
      return db.transaction('objectsStore', 'readonly')
               .objectStore('objectsStore')
               .get(customKey);
    }));
  }

  // Get all objects
  getAllObjects(): Observable<any[]> {
    return from(this.dbPromise.then((db:any) => {
      return db.transaction('objectsStore', 'readonly')
               .objectStore('objectsStore')
               .getAll();
    }));
  }

  // Update an object by custom key
  updateObject(customKey: any, updatedObject: any): Observable<any> {
    return from(this.dbPromise.then((db:any) => {
      return db.transaction('objectsStore', 'readwrite')
               .objectStore('objectsStore')
               .put({ ...updatedObject, customKey });
    }));
  }

  // Delete an object by custom key
  deleteObject(customKey: any): Observable<void> {
    return from(this.dbPromise.then((db:any) => {
      return db.transaction('objectsStore', 'readwrite')
               .objectStore('objectsStore')
               .delete(customKey);
    }));
  }

  clearObjectStore(): Observable<void> {
    return from(this.dbPromise.then((db:any) => {
      const tx = db.transaction('objectsStore', 'readwrite');
      const store = tx.objectStore('objectsStore');
      store.clear(); // Clear all data in the store
      return tx.done; // Return the transaction completion
    }));
  }

  deleteDb() {
    this.dbPromise.then((db:any) => db.close());
    const deleteRequest = indexedDB.deleteDatabase(this.dbName);

    deleteRequest.onsuccess = () => {
      console.log('Database deleted successfully');
    };

    deleteRequest.onerror = (event) => {
      console.error('Error deleting database:', event);
    };

    deleteRequest.onblocked = () => {
      console.warn('Database deletion is blocked');
    };

  }
}
