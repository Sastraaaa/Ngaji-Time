import { SurahResponse, SurahDetailResponse, AyahResponse } from "../types/api";
import { cacheService } from "./cache";

const API_BASE_URL = "https://api-ngaji-time.vercel.app";

class ApiService {
  private async fetchData<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Mendapatkan daftar semua surah (dengan cache)
  async getAllSurah(): Promise<SurahResponse> {
    try {
      // Cek cache terlebih dahulu
      const cachedSurahs = await cacheService.getCachedSurahs();
      if (cachedSurahs) {
        console.log("Menggunakan cache untuk daftar surah");
        return {
          code: 200,
          status: "OK",
          message: "Success from cache",
          data: cachedSurahs,
        };
      }

      // Jika tidak ada cache, ambil dari API
      console.log("Mengambil daftar surah dari API");
      const response = await this.fetchData<SurahResponse>("/surah");

      // Cache hasilnya
      if (response.data) {
        await cacheService.cacheSurahs(response.data);
      }

      return response;
    } catch (error) {
      // Jika error, coba gunakan cache lama (expired)
      const cachedSurahs = await cacheService.getCachedSurahs();
      if (cachedSurahs) {
        console.log("API error, menggunakan cache lama");
        return {
          code: 200,
          status: "OK",
          message: "Success from expired cache",
          data: cachedSurahs,
        };
      }
      throw error;
    }
  }

  // Mendapatkan detail surah beserta semua ayatnya (dengan cache dan auto-download)
  async getSurahDetail(surahNumber: number): Promise<SurahDetailResponse> {
    try {
      // Cek cache terlebih dahulu
      const cachedAyahs = await cacheService.getCachedSurahDetail(surahNumber);
      if (cachedAyahs) {
        console.log(`Menggunakan cache untuk surah ${surahNumber}`);
        return {
          code: 200,
          status: "OK",
          message: "Success from cache (offline)",
          data: cachedAyahs,
        };
      }

      // Jika tidak ada cache, ambil dari API
      console.log(`Mengambil surah ${surahNumber} dari API`);

      // Pertama, dapatkan info surah untuk mengetahui jumlah ayat
      console.log(`Mengambil info surah ${surahNumber}...`);
      const surahInfo = await this.fetchData<any>(`/surah/${surahNumber}`);

      if (!surahInfo?.data?.numberOfVerses) {
        throw new Error(
          `Surah ${surahNumber} tidak memiliki informasi numberOfVerses`
        );
      }

      const numberOfVerses = surahInfo.data.numberOfVerses;
      console.log(`Surah ${surahNumber} memiliki ${numberOfVerses} ayat`);

      // Kemudian, ambil semua ayat satu per satu
      const ayahPromises = [];
      for (let i = 1; i <= numberOfVerses; i++) {
        ayahPromises.push(
          this.fetchData<AyahResponse>(`/surah/${surahNumber}/${i}`)
        );
      }

      console.log(
        `Mengambil ${numberOfVerses} ayat untuk surah ${surahNumber}...`
      );
      const ayahResponses = await Promise.all(ayahPromises);
      const ayahs = ayahResponses.map((response) => response.data);

      // Validasi data ayat
      if (ayahs.length === 0) {
        throw new Error(
          `Tidak ada ayat yang berhasil diambil untuk surah ${surahNumber}`
        );
      }

      console.log(
        `Berhasil mengambil ${ayahs.length} ayat untuk surah ${surahNumber}`
      );

      // Cache hasilnya untuk offline access
      await cacheService.cacheSurahDetail(surahNumber, ayahs);

      // Auto-download mark for statistics
      cacheService.autoDownloadSurah(surahNumber).catch((error) => {
        console.warn(
          `Failed to mark auto-download for Surah ${surahNumber}:`,
          error
        );
      });

      // Return dalam format yang diharapkan
      return {
        code: 200,
        status: "OK",
        message: "Success (auto-cached)",
        data: ayahs,
      };
    } catch (error) {
      console.error(`Error fetching surah ${surahNumber}:`, error);

      // Jika error, coba gunakan cache lama (expired)
      const cachedAyahs = await cacheService.getCachedSurahDetail(surahNumber);
      if (cachedAyahs) {
        console.log(
          `API error, menggunakan cache lama untuk surah ${surahNumber}`
        );
        return {
          code: 200,
          status: "OK",
          message: "Success from expired cache",
          data: cachedAyahs,
        };
      }

      console.error("Error fetching surah detail:", error);
      throw error;
    }
  }

  // Mendapatkan ayat spesifik
  async getSpecificAyah(
    surahNumber: number,
    ayahNumber: number
  ): Promise<AyahResponse> {
    return this.fetchData<AyahResponse>(`/surah/${surahNumber}/${ayahNumber}`);
  }

  // Mendapatkan juz spesifik
  async getJuz(juzNumber: number): Promise<SurahDetailResponse> {
    return this.fetchData<SurahDetailResponse>(`/juz/${juzNumber}`);
  }
}

export const apiService = new ApiService();
