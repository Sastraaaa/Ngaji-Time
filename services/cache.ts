import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Surah, Ayah } from "../types/api";

class CacheService {
  private static readonly CACHE_KEYS = {
    SURAHS: "cache_surahs",
    SURAH_DETAIL: "cache_surah_",
    CACHE_TIMESTAMP: "cache_timestamp_",
    DOWNLOAD_STATUS: "all_surahs_downloaded",
  };

  private static readonly CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 hari (lebih lama)

  // External storage paths
  private static readonly EXTERNAL_CACHE_DIR = `${FileSystem.documentDirectory}ngaji_cache/`;

  // Initialize external cache directory
  private async initExternalCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(
        CacheService.EXTERNAL_CACHE_DIR
      );
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CacheService.EXTERNAL_CACHE_DIR, {
          intermediates: true,
        });
        console.log("External cache directory created");
      }
    } catch (error) {
      console.error("Error creating external cache directory:", error);
    }
  }

  // Check if cache is still valid (using AsyncStorage for metadata)
  private async isCacheValid(key: string): Promise<boolean> {
    try {
      const timestamp = await AsyncStorage.getItem(
        CacheService.CACHE_KEYS.CACHE_TIMESTAMP + key
      );
      if (!timestamp) return false;

      const cacheTime = parseInt(timestamp);
      const now = Date.now();
      return now - cacheTime < CacheService.CACHE_EXPIRY;
    } catch {
      return false;
    }
  }

  // Set cache using file system untuk data besar, AsyncStorage untuk metadata
  private async setCache(key: string, data: any): Promise<void> {
    try {
      await this.initExternalCache();

      // Simpan data besar ke file system
      const filePath = `${CacheService.EXTERNAL_CACHE_DIR}${key}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));

      // Simpan metadata timestamp ke AsyncStorage
      await AsyncStorage.setItem(
        CacheService.CACHE_KEYS.CACHE_TIMESTAMP + key,
        Date.now().toString()
      );

      console.log(`Cache saved to file: ${key}`);
    } catch (error) {
      console.error("Error setting cache:", error);
      // Fallback ke AsyncStorage untuk data kecil
      try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
        await AsyncStorage.setItem(
          CacheService.CACHE_KEYS.CACHE_TIMESTAMP + key,
          Date.now().toString()
        );
      } catch (fallbackError) {
        console.error("Fallback cache also failed:", fallbackError);
      }
    }
  }

  // Get cache data dari file system atau AsyncStorage
  private async getCache<T>(key: string): Promise<T | null> {
    try {
      // Coba baca dari file system dulu
      const filePath = `${CacheService.EXTERNAL_CACHE_DIR}${key}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists) {
        const data = await FileSystem.readAsStringAsync(filePath);
        return JSON.parse(data);
      }

      // Fallback ke AsyncStorage
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting cache:", error);
      return null;
    }
  }

  // Cache all surahs
  async cacheSurahs(surahs: Surah[]): Promise<void> {
    await this.setCache(CacheService.CACHE_KEYS.SURAHS, surahs);
  }

  // Get cached surahs
  async getCachedSurahs(): Promise<Surah[] | null> {
    const isValid = await this.isCacheValid(CacheService.CACHE_KEYS.SURAHS);
    if (!isValid) return null;

    return await this.getCache<Surah[]>(CacheService.CACHE_KEYS.SURAHS);
  }

  // Cache surah detail (all ayahs)
  async cacheSurahDetail(surahNumber: number, ayahs: Ayah[]): Promise<void> {
    const key = CacheService.CACHE_KEYS.SURAH_DETAIL + surahNumber;
    await this.setCache(key, ayahs);
  }

  // Get cached surah detail
  async getCachedSurahDetail(surahNumber: number): Promise<Ayah[] | null> {
    const key = CacheService.CACHE_KEYS.SURAH_DETAIL + surahNumber;
    const isValid = await this.isCacheValid(key);
    if (!isValid) return null;

    return await this.getCache<Ayah[]>(key);
  }

  // Preload essential surahs for offline use
  async preloadEssentialSurahs(): Promise<void> {
    // Surah-surah yang sering dibaca: Al-Fatihah, Al-Baqarah, Ali-Imran, dll.
    const essentialSurahs = [1, 2, 3, 18, 36, 55, 67, 112, 113, 114];

    console.log("Memulai preload surah penting untuk offline...");

    for (const surahNumber of essentialSurahs) {
      try {
        const cached = await this.getCachedSurahDetail(surahNumber);
        if (!cached) {
          // Import apiService di sini untuk menghindari circular dependency
          const { apiService } = await import("./api");
          const response = await apiService.getSurahDetail(surahNumber);
          await this.cacheSurahDetail(surahNumber, response.data);
          console.log(`Surah ${surahNumber} berhasil di-cache`);
        }
      } catch (error) {
        console.error(`Error preloading surah ${surahNumber}:`, error);
      }
    }

    console.log("Preload selesai");
  }

  // Check if all surahs have been downloaded
  async isAllSurahsDownloaded(): Promise<boolean> {
    try {
      const flag = await AsyncStorage.getItem(
        CacheService.CACHE_KEYS.DOWNLOAD_STATUS
      );
      return flag === "true";
    } catch {
      return false;
    }
  }

  // Mark all surahs as downloaded
  async markAllSurahsDownloaded(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CacheService.CACHE_KEYS.DOWNLOAD_STATUS,
        "true"
      );
    } catch (error) {
      console.error("Error marking surahs as downloaded:", error);
    }
  }

  // Preload ALL surahs dengan optimisasi storage
  async preloadAllSurahs(
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const totalSurahs = 114;
    console.log("Memulai download semua surah untuk offline...");

    try {
      // First, get the list of surahs
      const { apiService } = await import("./api");

      for (let surahNumber = 1; surahNumber <= totalSurahs; surahNumber++) {
        try {
          const cached = await this.getCachedSurahDetail(surahNumber);
          if (!cached) {
            console.log(`Downloading surah ${surahNumber}...`);

            // Download dengan batch size yang lebih kecil untuk menghindari memory issue
            const response = await apiService.getSurahDetail(surahNumber);

            // Optimisasi: Simpan data yang sudah dikompresi
            const compressedData = this.compressSurahData(response.data);
            await this.cacheSurahDetail(surahNumber, compressedData);

            console.log(`Surah ${surahNumber} berhasil di-cache`);
          } else {
            console.log(`Surah ${surahNumber} sudah ada di cache`);
          }

          // Update progress
          if (onProgress) {
            onProgress(surahNumber, totalSurahs);
          }

          // Delay yang lebih lama untuk mencegah overload
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error downloading surah ${surahNumber}:`, error);
          // Continue dengan surah berikutnya
        }
      }

      // Set flag bahwa semua surah sudah di-download
      await this.markAllSurahsDownloaded();
      console.log("Semua surah berhasil didownload untuk offline!");
    } catch (error) {
      console.error("Error preloading all surahs:", error);
    }
  }

  // Kompresi data surah untuk menghemat space
  private compressSurahData(ayahs: Ayah[]): Ayah[] {
    return ayahs.map((ayah) => ({
      // Hanya simpan data yang benar-benar diperlukan
      number: ayah.number,
      text: {
        arab: ayah.text.arab,
      },
      translation: {
        id: ayah.translation.id,
      },
      audio: {
        primary: ayah.audio.primary,
      },
      surah: ayah.surah
        ? {
            number: ayah.surah.number,
            name: {
              transliteration: {
                id: ayah.surah.name.transliteration.id,
              },
            },
          }
        : undefined,
      meta: ayah.meta
        ? {
            sajda: ayah.meta.sajda,
          }
        : undefined,
    })) as Ayah[];
  }

  // Clear all cache
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (key) => key.startsWith("cache_") || key.startsWith("ngajitime_")
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  // Get cache size info
  async getCacheInfo(): Promise<{ totalSurahs: number; totalAyahs: number }> {
    try {
      const surahs = await this.getCachedSurahs();
      let totalAyahs = 0;

      if (surahs) {
        for (const surah of surahs) {
          const ayahs = await this.getCachedSurahDetail(surah.number);
          if (ayahs) {
            totalAyahs += ayahs.length;
          }
        }
      }

      return {
        totalSurahs: surahs?.length || 0,
        totalAyahs,
      };
    } catch {
      return { totalSurahs: 0, totalAyahs: 0 };
    }
  }
}

export const cacheService = new CacheService();
