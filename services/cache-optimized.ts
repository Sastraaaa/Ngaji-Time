import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Surah } from "../types/api";
import { PerformanceTracker } from "../utils/performance";

class CacheService {
  private static readonly CACHE_KEYS = {
    SURAHS: "cache_surahs",
    SURAH_DETAIL: "cache_surah_",
    CACHE_TIMESTAMP: "cache_timestamp_",
    DOWNLOAD_STATUS: "all_surahs_downloaded",
    CACHE_METADATA: "cache_metadata",
  };

  private static readonly CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 hari (lebih lama)
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit
  private static readonly CACHE_CLEANUP_THRESHOLD = 0.9; // 90% of max size

  // External storage paths
  private static readonly EXTERNAL_CACHE_DIR = `${FileSystem.documentDirectory}ngaji_cache/`;

  // Compress data sebelum save untuk menghemat space
  private compressData(data: any): string {
    try {
      // Untuk production bisa ditambahkan compression library seperti lz-string
      return JSON.stringify(data);
    } catch (error) {
      console.error("Compression error:", error);
      return JSON.stringify(data);
    }
  }

  // Decompress data saat load
  private decompressData<T>(compressedData: string): T {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error("Decompression error:", error);
      throw error;
    }
  }

  // Initialize external cache directory
  private async initExternalCache(): Promise<void> {
    return PerformanceTracker.measureAsync("InitExternalCache", async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(
          CacheService.EXTERNAL_CACHE_DIR
        );
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(CacheService.EXTERNAL_CACHE_DIR, {
            intermediates: true,
          });
          console.log("📁 External cache directory created");
        }
      } catch (error) {
        console.error("Failed to init external cache:", error);
        throw error;
      }
    });
  }

  // Smart cache cleanup berdasarkan usage frequency
  private async cleanupOldCache(): Promise<void> {
    return PerformanceTracker.measureAsync("CleanupCache", async () => {
      try {
        const cacheDir = CacheService.EXTERNAL_CACHE_DIR;
        const files = await FileSystem.readDirectoryAsync(cacheDir);

        if (files.length === 0) return;

        // Get file stats dan sort by last access
        const fileStats = await Promise.all(
          files.map(async (file) => {
            try {
              const info = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
              return { name: file, ...info };
            } catch {
              return null;
            }
          })
        );

        const validFiles = fileStats.filter(Boolean) as any[];
        if (validFiles.length === 0) return;

        // Remove oldest files jika cache size > threshold
        const totalSize = validFiles.reduce(
          (sum, file) => sum + (file.size || 0),
          0
        );

        if (
          totalSize >
          CacheService.MAX_CACHE_SIZE * CacheService.CACHE_CLEANUP_THRESHOLD
        ) {
          const sortedFiles = validFiles.sort(
            (a, b) => (a.modificationTime || 0) - (b.modificationTime || 0)
          );

          // Remove 25% oldest files
          const filesToRemove = sortedFiles.slice(
            0,
            Math.floor(sortedFiles.length * 0.25)
          );

          for (const file of filesToRemove) {
            try {
              await FileSystem.deleteAsync(`${cacheDir}${file.name}`);
            } catch (error) {
              console.warn(`Failed to delete cache file ${file.name}:`, error);
            }
          }

          console.log(`🧹 Cleaned up ${filesToRemove.length} old cache files`);
        }
      } catch (error) {
        console.error("Cache cleanup error:", error);
      }
    });
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

  // Set cache using file system dengan optimasi
  private async setCache(key: string, data: any): Promise<void> {
    return PerformanceTracker.measureAsync("SetCache", async () => {
      try {
        await this.initExternalCache();
        await this.cleanupOldCache(); // Cleanup sebelum save baru

        // Compress data sebelum save
        const compressedData = this.compressData(data);

        // Simpan data besar ke file system
        const filePath = `${CacheService.EXTERNAL_CACHE_DIR}${key}.json`;
        await FileSystem.writeAsStringAsync(filePath, compressedData);

        // Simpan metadata timestamp ke AsyncStorage
        await AsyncStorage.setItem(
          CacheService.CACHE_KEYS.CACHE_TIMESTAMP + key,
          Date.now().toString()
        );

        console.log(
          `💾 Cached ${key} (${(compressedData.length / 1024).toFixed(1)}KB)`
        );
      } catch (error) {
        console.error(`Failed to cache ${key}:`, error);
        throw error;
      }
    });
  }

  // Get cache dengan performance tracking
  private async getCache<T>(key: string): Promise<T | null> {
    return PerformanceTracker.measureAsync("GetCache", async () => {
      try {
        // Check if cache is valid
        const isValid = await this.isCacheValid(key);
        if (!isValid) return null;

        const filePath = `${CacheService.EXTERNAL_CACHE_DIR}${key}.json`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists) {
          const compressedData = await FileSystem.readAsStringAsync(filePath);
          const data = this.decompressData<T>(compressedData);
          console.log(
            `📖 Loaded ${key} from cache (${(compressedData.length / 1024).toFixed(1)}KB)`
          );
          return data;
        }

        return null;
      } catch (error) {
        console.error(`Failed to get cache ${key}:`, error);
        return null;
      }
    });
  }

  // Cache surahs list dengan optimasi
  async cacheSurahs(surahs: Surah[]): Promise<void> {
    await this.setCache(CacheService.CACHE_KEYS.SURAHS, surahs);
  }

  // Get cached surahs
  async getCachedSurahs(): Promise<Surah[] | null> {
    return this.getCache<Surah[]>(CacheService.CACHE_KEYS.SURAHS);
  }

  // Cache surah detail dengan prioritas
  async cacheSurahDetail(
    surahNumber: number,
    surahDetail: any,
    priority: "high" | "medium" | "low" = "medium"
  ): Promise<void> {
    const key = `${CacheService.CACHE_KEYS.SURAH_DETAIL}${surahNumber}_${priority}`;

    // Untuk low priority, hapus audio URL untuk menghemat space
    let dataToCache = surahDetail;
    if (priority === "low" && surahDetail.verses) {
      dataToCache = {
        ...surahDetail,
        verses: surahDetail.verses.map((verse: any) => ({
          ...verse,
          audio: undefined, // Remove audio untuk save space
        })),
      };
    }

    await this.setCache(key, dataToCache);
  }

  // Get cached surah detail
  async getCachedSurah(surahNumber: number): Promise<any | null> {
    // Try different priorities
    const priorities = ["high", "medium", "low"];

    for (const priority of priorities) {
      const key = `${CacheService.CACHE_KEYS.SURAH_DETAIL}${surahNumber}_${priority}`;
      const cached = await this.getCache(key);
      if (cached) {
        console.log(
          `📱 Found cached surah ${surahNumber} with ${priority} priority`
        );
        return cached;
      }
    }

    // Fallback ke format lama
    const legacyKey = `${CacheService.CACHE_KEYS.SURAH_DETAIL}${surahNumber}`;
    return this.getCache(legacyKey);
  }

  // Auto download surah dengan performance tracking
  async autoDownloadSurah(surahNumber: number): Promise<void> {
    return PerformanceTracker.measureAsync(
      `AutoDownload-Surah${surahNumber}`,
      async () => {
        try {
          const metadata = await this.getCacheMetadata();

          if (!metadata.cachedSurahs.includes(surahNumber)) {
            // Mark sebagai downloaded di metadata
            metadata.cachedSurahs.push(surahNumber);
            await this.updateCacheMetadata(surahNumber, true);

            console.log(`✅ Auto-downloaded surah ${surahNumber}`);
          }
        } catch (error) {
          console.error(`Failed to auto-download surah ${surahNumber}:`, error);
          throw error;
        }
      }
    );
  }

  // Update cache metadata dengan batch operations
  async updateCacheMetadata(
    surahNumber: number,
    isCached: boolean,
    priority?: string
  ): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();

      if (isCached && !metadata.cachedSurahs.includes(surahNumber)) {
        metadata.cachedSurahs.push(surahNumber);
      } else if (!isCached) {
        metadata.cachedSurahs = metadata.cachedSurahs.filter(
          (num) => num !== surahNumber
        );
      }

      metadata.lastUpdated = Date.now();

      // Batch save untuk performance
      await AsyncStorage.setItem(
        CacheService.CACHE_KEYS.CACHE_METADATA,
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.error("Failed to update cache metadata:", error);
    }
  }

  // Get cache metadata dengan defaults
  async getCacheMetadata(): Promise<{
    cachedSurahs: number[];
    lastUpdated: number;
  }> {
    try {
      const metadata = await AsyncStorage.getItem(
        CacheService.CACHE_KEYS.CACHE_METADATA
      );
      return metadata
        ? JSON.parse(metadata)
        : { cachedSurahs: [], lastUpdated: 0 };
    } catch (error) {
      console.error("Failed to get cache metadata:", error);
      return { cachedSurahs: [], lastUpdated: 0 };
    }
  }

  // Get cache statistics dengan optimasi
  async getCacheStatistics(): Promise<{
    cachedSurahs: number;
    totalSurahs: number;
    percentage: number;
    totalSize: string;
    lastCleanup: string;
  }> {
    return PerformanceTracker.measureAsync("GetCacheStatistics", async () => {
      try {
        const metadata = await this.getCacheMetadata();
        const totalSurahs = 114;
        const cachedSurahs = metadata.cachedSurahs.length;
        const percentage = Math.round((cachedSurahs / totalSurahs) * 100);

        // Calculate total cache size
        let totalSize = 0;
        try {
          await this.initExternalCache();
          const files = await FileSystem.readDirectoryAsync(
            CacheService.EXTERNAL_CACHE_DIR
          );

          for (const file of files) {
            try {
              const info = await FileSystem.getInfoAsync(
                `${CacheService.EXTERNAL_CACHE_DIR}${file}`
              );
              if (info.exists && "size" in info) {
                totalSize += (info as any).size || 0;
              }
            } catch {
              // Ignore individual file errors
            }
          }
        } catch {
          // Ignore directory read errors
        }

        const totalSizeFormatted =
          totalSize > 1024 * 1024
            ? `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
            : `${(totalSize / 1024).toFixed(1)} KB`;

        const lastCleanup = metadata.lastUpdated
          ? new Date(metadata.lastUpdated).toLocaleDateString("id-ID")
          : "Tidak ada";

        return {
          cachedSurahs,
          totalSurahs,
          percentage,
          totalSize: totalSizeFormatted,
          lastCleanup,
        };
      } catch (error) {
        console.error("Failed to get cache statistics:", error);
        return {
          cachedSurahs: 0,
          totalSurahs: 114,
          percentage: 0,
          totalSize: "0 KB",
          lastCleanup: "Error",
        };
      }
    });
  }

  // Download all surahs dengan progress callback
  async downloadAllSurahs(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return PerformanceTracker.measureAsync("DownloadAllSurahs", async () => {
      try {
        const totalSurahs = 114;
        const metadata = await this.getCacheMetadata();

        for (let i = 1; i <= totalSurahs; i++) {
          if (!metadata.cachedSurahs.includes(i)) {
            await this.autoDownloadSurah(i);

            // Update progress
            const progress = (i / totalSurahs) * 100;
            onProgress?.(progress);

            // Small delay untuk tidak overwhelm system
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        // Mark as all downloaded
        await AsyncStorage.setItem(
          CacheService.CACHE_KEYS.DOWNLOAD_STATUS,
          "true"
        );
        console.log("✅ All surahs downloaded successfully");
      } catch (error) {
        console.error("Failed to download all surahs:", error);
        throw error;
      }
    });
  }

  // Clear all cache dengan confirmation
  async clearCache(): Promise<void> {
    return PerformanceTracker.measureAsync("ClearCache", async () => {
      try {
        // Clear file system cache
        const dirInfo = await FileSystem.getInfoAsync(
          CacheService.EXTERNAL_CACHE_DIR
        );
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(CacheService.EXTERNAL_CACHE_DIR, {
            idempotent: true,
          });
          console.log("🗑️ Cleared external cache directory");
        }

        // Clear AsyncStorage cache
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(
          (key) =>
            key.startsWith("cache_") ||
            key.includes(CacheService.CACHE_KEYS.DOWNLOAD_STATUS)
        );

        if (cacheKeys.length > 0) {
          await AsyncStorage.multiRemove(cacheKeys);
          console.log(
            `🗑️ Cleared ${cacheKeys.length} cache keys from AsyncStorage`
          );
        }

        console.log("✅ All cache cleared successfully");
      } catch (error) {
        console.error("Failed to clear cache:", error);
        throw error;
      }
    });
  }

  // Performance monitoring methods
  getPerformanceReport() {
    return PerformanceTracker.getPerformanceReport();
  }

  clearPerformanceData() {
    PerformanceTracker.clearMeasurements();
  }
}

export const cacheService = new CacheService();
