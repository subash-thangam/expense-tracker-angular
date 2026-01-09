import { Injectable } from '@angular/core';

export interface Group {
  id: string;
  name: string;
  createdAt: number;
  totalExpenses: number;
  salary?: number;
  budgets?: { [key: string]: number };
}

export interface Entry {
  id: string;
  parentId: string;
  description: string;
  amount: number;
  category: string;
  date: number; // timestamp
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private dbName = 'ExpenseTrackerDB';
  private version = 2;
  private db: IDBDatabase | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize the database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        this.db = request.result;

        // Seed predefined categories if database is new
        const categories = await this.getCategories();
        if (categories.length === 0) {
          await this.seedDefaultCategories();
        }

        resolve(this.db);
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create Parents store (Month/Year groups)
        if (!db.objectStoreNames.contains('parents')) {
          const parentStore = db.createObjectStore('parents', { keyPath: 'id' });
          parentStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create Entries store (Individual expenses)
        if (!db.objectStoreNames.contains('entries')) {
          const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
          entryStore.createIndex('parentId', 'parentId', { unique: false });
          entryStore.createIndex('date', 'date', { unique: false });
          entryStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create Categories store (Global categories)
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('name', 'name', { unique: true });
          categoryStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // ==================== GROUP OPERATIONS ====================

  async createGroup(name: string, monthYear: string | null = null): Promise<Group> {
    await this.init();
    const group: Group = {
      id: monthYear || this.generateMonthYearId(),
      name: name,
      createdAt: Date.now(),
      totalExpenses: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parents'], 'readwrite');
      const store = transaction.objectStore('parents');
      const request = store.add(group);

      request.onsuccess = () => resolve(group);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllGroups(): Promise<Group[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parents'], 'readonly');
      const store = transaction.objectStore('parents');
      const request = store.getAll();

      request.onsuccess = () => {
        const groups = request.result.sort((a: Group, b: Group) => b.createdAt - a.createdAt);
        resolve(groups);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getGroup(id: string): Promise<Group> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parents'], 'readonly');
      const store = transaction.objectStore('parents');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateGroupTotal(parentId: string): Promise<Group> {
    const entries = await this.getEntriesByGroup(parentId);
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parents'], 'readwrite');
      const store = transaction.objectStore('parents');
      const getRequest = store.get(parentId);

      getRequest.onsuccess = () => {
        const parent = getRequest.result;
        if (parent) {
          parent.totalExpenses = total;
          const updateRequest = store.put(parent);
          updateRequest.onsuccess = () => resolve(parent);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Parent not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async updateGroupBudget(parentId: string, salary: number, budgets: { [key: string]: number }): Promise<Group> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parents'], 'readwrite');
      const store = transaction.objectStore('parents');
      const getRequest = store.get(parentId);

      getRequest.onsuccess = () => {
        const parent = getRequest.result;
        if (parent) {
          parent.salary = salary || 0;
          parent.budgets = budgets || {};
          const updateRequest = store.put(parent);
          updateRequest.onsuccess = () => resolve(parent);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Parent not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }


  async deleteGroup(id: string): Promise<void> {
    const entries = await this.getEntriesByGroup(id);
    for (const entry of entries) {
      await this.deleteEntry(entry.id, false);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['parents'], 'readwrite');
      const store = transaction.objectStore('parents');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== ENTRY OPERATIONS ====================

  async createEntry(parentId: string, description: string, amount: number, category: string = '', date: number | null = null): Promise<Entry> {
    await this.init();
    const entry: Entry = {
      id: this.generateUUID(),
      parentId: parentId,
      description: description,
      amount: parseFloat(amount.toString()),
      category: category,
      date: date || Date.now(),
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.add(entry);

      request.onsuccess = async () => {
        await this.updateGroupTotal(parentId);
        resolve(entry);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getEntriesByGroup(parentId: string): Promise<Entry[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const index = store.index('parentId');
      const request = index.getAll(parentId);

      request.onsuccess = () => {
        const entries = request.result.sort((a: Entry, b: Entry) => b.date - a.date);
        resolve(entries);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getEntry(id: string): Promise<Entry> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const getRequest = store.get(id);

      getRequest.onsuccess = async () => {
        const entry = getRequest.result;
        if (entry) {
          Object.assign(entry, updates);
          if (updates.amount !== undefined) {
            entry.amount = parseFloat(updates.amount.toString());
          }
          const updateRequest = store.put(entry);
          updateRequest.onsuccess = async () => {
            await this.updateGroupTotal(entry.parentId);
            resolve(entry);
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Entry not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteEntry(id: string, updateTotal: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const getRequest = store.get(id);

      getRequest.onsuccess = async () => {
        const entry = getRequest.result;
        if (entry) {
          const deleteRequest = store.delete(id);
          deleteRequest.onsuccess = async () => {
            if (updateTotal) {
              await this.updateGroupTotal(entry.parentId);
            }
            resolve();
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ==================== CATEGORY OPERATIONS ====================

  async seedDefaultCategories() {
    const defaultCategories = [
      'Outside Food', 'Recharge & Bills', 'Shopping', 'Transport',
      'Entertainment', 'Health', 'Vegetables & Fruits', 'Non-Veg Items',
      'Household Items', 'Groceries', 'Others'
    ];

    for (const name of defaultCategories) {
      try {
        await this.createCategory(name, true);
      } catch (error) {
        // Ignore duplicate errors
      }
    }
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) { try { await this.init(); } catch (e) { return []; } }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['categories'], 'readonly');
      const store = transaction.objectStore('categories');
      const request = store.getAll();

      request.onsuccess = () => {
        const categories = request.result.sort((a: Category, b: Category) => a.name.localeCompare(b.name));
        resolve(categories);
      };
      request.onerror = () => resolve([]); // Fail gracefully on init
    });
  }

  async createCategory(name: string, isDefault: boolean = false): Promise<Category> {
    const category: Category = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name,
      isDefault: isDefault,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['categories'], 'readwrite');
      const store = transaction.objectStore('categories');
      const request = store.add(category);

      request.onsuccess = () => resolve(category);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCategory(id: string, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['categories'], 'readwrite');
      const store = transaction.objectStore('categories');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const cat = getRequest.result;
        if (cat) {
          cat.name = name;
          const updateRequest = store.put(cat);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Category not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteCategory(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['categories'], 'readwrite');
      const store = transaction.objectStore('categories');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== DATA IMPORT/EXPORT ====================

  async exportData(): Promise<any> {
    await this.init();
    const parents = await this.getAllGroups();
    const categories = await this.getCategories();

    // Get all entries
    const entries: Entry[] = [];
    for (const p of parents) {
      const groupEntries = await this.getEntriesByGroup(p.id);
      entries.push(...groupEntries);
    }

    return {
      parents,
      entries,
      categories,
      exportedAt: Date.now()
    };
  }

  async importData(data: any): Promise<void> {
    await this.init();

    if (!data.parents || !data.entries) {
      throw new Error('Invalid data format');
    }

    // Clear existing? OR Merge?
    // Start fresh for safety as requested in original logic usually
    // But we need to use transactions. For simplicity, we just add/overwrite.

    const transaction = this.db!.transaction(['parents', 'entries', 'categories'], 'readwrite');

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      const parentStore = transaction.objectStore('parents');
      const entryStore = transaction.objectStore('entries');
      const categoryStore = transaction.objectStore('categories');

      // Import Parents
      data.parents.forEach((p: Group) => parentStore.put(p));

      // Import Entries
      data.entries.forEach((e: Entry) => entryStore.put(e));

      // Import Categories
      if (data.categories) {
        data.categories.forEach((c: Category) => categoryStore.put(c));
      }
    });
  }

  // ==================== UTILITY METHODS ====================

  private generateMonthYearId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
