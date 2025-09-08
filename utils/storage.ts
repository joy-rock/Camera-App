import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CapturedItem {
  id: string;
  photoUri: string;
  wasteType: string;
  description?: string;
  volume?: string;
  weight?: string;
  dimensions?: {
    height: string;
    width: string;
    breadth: string;
  };
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  capturedAt: string;
  capturedBy: string;
}

const ITEMS_STORAGE_KEY = '@captured_items';

export const StorageService = {
  // Get all items
  async getItems(): Promise<CapturedItem[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(ITEMS_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error reading items:', e);
      return [];
    }
  },

  // Save a new item
  async saveItem(item: CapturedItem): Promise<void> {
    try {
      const items = await this.getItems();
      items.unshift(item); // Add to beginning of array
      const jsonValue = JSON.stringify(items);
      await AsyncStorage.setItem(ITEMS_STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Error saving item:', e);
      throw e;
    }
  },

  // Update an existing item
  async updateItem(id: string, updates: Partial<CapturedItem>): Promise<void> {
    try {
      const items = await this.getItems();
      const index = items.findIndex(item => item.id === id);
      if (index >= 0) {
        items[index] = { ...items[index], ...updates };
        const jsonValue = JSON.stringify(items);
        await AsyncStorage.setItem(ITEMS_STORAGE_KEY, jsonValue);
      }
    } catch (e) {
      console.error('Error updating item:', e);
      throw e;
    }
  },

  // Delete an item
  async deleteItem(id: string): Promise<void> {
    try {
      const items = await this.getItems();
      const filtered = items.filter(item => item.id !== id);
      const jsonValue = JSON.stringify(filtered);
      await AsyncStorage.setItem(ITEMS_STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Error deleting item:', e);
      throw e;
    }
  },

  // Clear all items
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ITEMS_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing items:', e);
      throw e;
    }
  }
};
