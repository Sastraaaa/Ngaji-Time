import AsyncStorage from "@react-native-async-storage/async-storage";
import { BookmarkAyah, LastRead, TahfidzTarget } from "../types/api";

class StorageService {
  private static readonly KEYS = {
    BOOKMARKS: "ngajitime_bookmarks",
    LAST_READ: "ngajitime_last_read",
    TAHFIDZ_TARGETS: "ngajitime_tahfidz_targets",
  };

  // Bookmark methods
  async getBookmarks(): Promise<BookmarkAyah[]> {
    try {
      const bookmarks = await AsyncStorage.getItem(
        StorageService.KEYS.BOOKMARKS
      );
      return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error("Error getting bookmarks:", error);
      return [];
    }
  }

  async addBookmark(bookmark: BookmarkAyah): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      const isAlreadyBookmarked = bookmarks.some(
        (b) =>
          b.surahNumber === bookmark.surahNumber &&
          b.ayahNumber === bookmark.ayahNumber
      );

      if (!isAlreadyBookmarked) {
        bookmarks.push(bookmark);
        await AsyncStorage.setItem(
          StorageService.KEYS.BOOKMARKS,
          JSON.stringify(bookmarks)
        );
      }
    } catch (error) {
      console.error("Error adding bookmark:", error);
    }
  }

  async removeBookmark(surahNumber: number, ayahNumber: number): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      const filteredBookmarks = bookmarks.filter(
        (b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
      );
      await AsyncStorage.setItem(
        StorageService.KEYS.BOOKMARKS,
        JSON.stringify(filteredBookmarks)
      );
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  }

  async isBookmarked(
    surahNumber: number,
    ayahNumber: number
  ): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      return bookmarks.some(
        (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
      );
    } catch (error) {
      console.error("Error checking bookmark:", error);
      return false;
    }
  }

  // Last read methods
  async getLastRead(): Promise<LastRead | null> {
    try {
      const lastRead = await AsyncStorage.getItem(
        StorageService.KEYS.LAST_READ
      );
      if (lastRead) {
        const parsed = JSON.parse(lastRead);
        return {
          ...parsed,
          timestamp: new Date(parsed.timestamp),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting last read:", error);
      return null;
    }
  }

  async setLastRead(lastRead: LastRead): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.LAST_READ,
        JSON.stringify(lastRead)
      );
    } catch (error) {
      console.error("Error setting last read:", error);
    }
  }

  // Tahfidz targets methods
  async getTahfidzTargets(): Promise<TahfidzTarget[]> {
    try {
      const targets = await AsyncStorage.getItem(
        StorageService.KEYS.TAHFIDZ_TARGETS
      );
      if (targets) {
        const parsed = JSON.parse(targets);
        return parsed.map((target: any) => ({
          ...target,
          createdAt: new Date(target.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error("Error getting tahfidz targets:", error);
      return [];
    }
  }

  async addTahfidzTarget(
    target: Omit<TahfidzTarget, "id" | "createdAt" | "progress">
  ): Promise<void> {
    try {
      const targets = await this.getTahfidzTargets();
      const newTarget: TahfidzTarget = {
        ...target,
        id: Date.now().toString(),
        createdAt: new Date(),
        progress: 0,
        completedVerses: [],
      };
      targets.push(newTarget);
      await AsyncStorage.setItem(
        StorageService.KEYS.TAHFIDZ_TARGETS,
        JSON.stringify(targets)
      );
    } catch (error) {
      console.error("Error adding tahfidz target:", error);
    }
  }

  async updateTahfidzProgress(
    targetId: string,
    completedVerses: number[]
  ): Promise<void> {
    try {
      const targets = await this.getTahfidzTargets();
      const targetIndex = targets.findIndex((t) => t.id === targetId);

      if (targetIndex !== -1) {
        targets[targetIndex].completedVerses = completedVerses;
        targets[targetIndex].progress =
          (completedVerses.length / targets[targetIndex].totalVerses) * 100;
        await AsyncStorage.setItem(
          StorageService.KEYS.TAHFIDZ_TARGETS,
          JSON.stringify(targets)
        );
      }
    } catch (error) {
      console.error("Error updating tahfidz progress:", error);
    }
  }

  async deleteTahfidzTarget(targetId: string): Promise<void> {
    try {
      const targets = await this.getTahfidzTargets();
      const filteredTargets = targets.filter((t) => t.id !== targetId);
      await AsyncStorage.setItem(
        StorageService.KEYS.TAHFIDZ_TARGETS,
        JSON.stringify(filteredTargets)
      );
    } catch (error) {
      console.error("Error deleting tahfidz target:", error);
    }
  }
}

export const storageService = new StorageService();
