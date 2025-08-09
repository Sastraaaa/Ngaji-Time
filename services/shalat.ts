import * as Location from "expo-location";

const SHALAT_API_BASE_URL = "https://api.myquran.com/v2";

export interface JadwalShalat {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  date: string;
}

export interface JadwalShalatResponse {
  status: boolean;
  request: {
    path: string;
  };
  data: {
    id: number;
    lokasi: string;
    daerah: string;
    jadwal: JadwalShalat | JadwalShalat[];
  };
}

export interface Kota {
  id: string;
  lokasi: string;
}

export interface KotaResponse {
  status: boolean;
  data: Kota[];
}

class ShalatService {
  // Cache untuk menyimpan mapping yang sudah ditemukan
  private cityMappingCache: Record<string, string> = {};

  private async fetchData<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${SHALAT_API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Shalat API Error:", error);
      throw error;
    }
  }

  // Mendapatkan lokasi pengguna
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permission to access location was denied");
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error("Location Error:", error);
      throw error;
    }
  }

  // Reverse geocoding untuk mendapatkan nama kota
  async getCityFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<{ city: string; region: string; fullLocation: any }> {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const location = reverseGeocode[0];
        console.log("Location data:", location);

        // Prioritas: city > subregion > region
        const city =
          location.city || location.subregion || location.region || "Unknown";
        const region = location.region || location.subregion || "Unknown";

        return {
          city,
          region,
          fullLocation: location,
        };
      }

      throw new Error("Unable to get city name");
    } catch (error) {
      console.error("Reverse Geocoding Error:", error);
      throw error;
    }
  }

  // Mencari kota terdekat berdasarkan hirarki geografis
  async findNearestCity(locationInfo: {
    city: string;
    region: string;
    fullLocation: any;
  }): Promise<string | null> {
    const cacheKey = `${locationInfo.city.toLowerCase()}_${locationInfo.region.toLowerCase()}`;

    // Cek cache terlebih dahulu
    if (this.cityMappingCache[cacheKey]) {
      console.log(
        `Using cached mapping: ${cacheKey} -> ${this.cityMappingCache[cacheKey]}`
      );
      return this.cityMappingCache[cacheKey];
    }

    try {
      // 1. Coba dengan semua kota yang tersedia di API
      const allCities = await this.getAllCities();

      // 2. Buat kandidat berdasarkan hirarki geografis (prioritas subregion)
      const searchCandidates = [
        // PRIORITAS UTAMA: subregion (biasanya kabupaten/kota yang benar)
        locationInfo.fullLocation.subregion, // "Bandung Regency"
        locationInfo.fullLocation.subregion?.replace(" Regency", ""), // "Bandung"
        locationInfo.fullLocation.subregion?.replace(" City", ""), // "Bandung"

        // Format variations untuk subregion
        locationInfo.fullLocation.subregion?.toUpperCase(),
        `KOTA ${locationInfo.fullLocation.subregion?.replace(" Regency", "").toUpperCase()}`,
        `KABUPATEN ${locationInfo.fullLocation.subregion?.replace(" Regency", "").toUpperCase()}`,

        // Fallback ke district
        locationInfo.fullLocation.district,
        `KOTA ${locationInfo.fullLocation.district?.toUpperCase()}`,
        `KABUPATEN ${locationInfo.fullLocation.district?.toUpperCase()}`,

        // Terakhir: city dan region dari GPS (sering salah hirarki)
        locationInfo.city,
        locationInfo.region,

        // Variasi format nama lainnya
        locationInfo.city.toLowerCase(),
        locationInfo.city.toUpperCase(),
        `KOTA ${locationInfo.city.toUpperCase()}`,
        `KABUPATEN ${locationInfo.city.toUpperCase()}`,

        locationInfo.region.toLowerCase(),
        locationInfo.region.toUpperCase(),
      ].filter(Boolean);

      // 3. Cari exact match dengan daftar kota API
      for (const candidate of searchCandidates) {
        const exactMatch = allCities.find(
          (city) => city.lokasi.toLowerCase() === candidate.toLowerCase()
        );
        if (exactMatch) {
          console.log(
            `Found exact match: ${candidate} -> ${exactMatch.lokasi}`
          );
          this.cityMappingCache[cacheKey] = exactMatch.lokasi;
          return exactMatch.lokasi;
        }
      }

      // 4. Cari partial match (kota yang mengandung nama lokasi)
      for (const candidate of searchCandidates) {
        const partialMatch = allCities.find(
          (city) =>
            city.lokasi.toLowerCase().includes(candidate.toLowerCase()) ||
            candidate.toLowerCase().includes(city.lokasi.toLowerCase())
        );
        if (partialMatch) {
          console.log(
            `Found partial match: ${candidate} -> ${partialMatch.lokasi}`
          );
          this.cityMappingCache[cacheKey] = partialMatch.lokasi;
          return partialMatch.lokasi;
        }
      }

      // 5. Fallback berdasarkan region/provinsi
      const regionMatch = allCities.find((city) =>
        city.lokasi.toLowerCase().includes(locationInfo.region.toLowerCase())
      );
      if (regionMatch) {
        console.log(
          `Found region fallback: ${locationInfo.region} -> ${regionMatch.lokasi}`
        );
        this.cityMappingCache[cacheKey] = regionMatch.lokasi;
        return regionMatch.lokasi;
      }

      return null;
    } catch (error) {
      console.error("Error finding nearest city:", error);
      return null;
    }
  }

  // Mencari ID kota berdasarkan nama
  async searchCityId(cityName: string): Promise<string | null> {
    try {
      const response = await this.fetchData<KotaResponse>(
        `/sholat/kota/cari/${encodeURIComponent(cityName)}`
      );

      if (response.status && response.data && response.data.length > 0) {
        return response.data[0].id;
      }

      return null;
    } catch (error) {
      console.error("Search City Error:", error);
      return null;
    }
  }

  // Mendapatkan semua kota (untuk fallback)
  async getAllCities(): Promise<Kota[]> {
    try {
      const response = await this.fetchData<KotaResponse>("/sholat/kota/semua");
      return response.data || [];
    } catch (error) {
      console.error("Get All Cities Error:", error);
      return [];
    }
  }

  // Mendapatkan jadwal shalat harian
  async getDailySchedule(
    cityId: string,
    year: number,
    month: number,
    day: number
  ): Promise<JadwalShalatResponse> {
    const endpoint = `/sholat/jadwal/${cityId}/${year}/${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
    return await this.fetchData<JadwalShalatResponse>(endpoint);
  }

  // Mendapatkan jadwal shalat bulanan
  async getMonthlySchedule(
    cityId: string,
    year: number,
    month: number
  ): Promise<JadwalShalatResponse> {
    const endpoint = `/sholat/jadwal/${cityId}/${year}/${month.toString().padStart(2, "0")}`;
    return await this.fetchData<JadwalShalatResponse>(endpoint);
  }

  // Workflow lengkap: dari lokasi ke jadwal shalat
  async getShalatScheduleFromLocation(): Promise<JadwalShalatResponse | null> {
    try {
      // 1. Dapatkan koordinat GPS
      const coordinates = await this.getCurrentLocation();

      // 2. Reverse geocoding untuk nama kota
      const locationInfo = await this.getCityFromCoordinates(
        coordinates.latitude,
        coordinates.longitude
      );
      console.log("Location info:", locationInfo);

      // 3. Cari kota terdekat menggunakan sistem dinamis
      console.log("Finding nearest city using dynamic system...");
      const nearestCity = await this.findNearestCity(locationInfo);

      // 4. Jika berhasil menemukan kota, cari ID-nya
      let cityId = null;
      if (nearestCity) {
        console.log(`Found nearest city: ${nearestCity}`);
        cityId = await this.searchCityId(nearestCity);
      }

      // 5. Jika masih belum ada, coba dengan hirarki geografis yang benar
      if (!cityId) {
        console.log("Dynamic system failed, trying geographic hierarchy...");

        // Prioritas: subregion (Kabupaten/Kota) -> region (Provinsi) -> manual patterns
        const cityVariations = [
          // Prioritas utama: subregion karena biasanya ini kabupaten/kota
          locationInfo.fullLocation.subregion, // "Bandung Regency"
          locationInfo.fullLocation.subregion?.replace(" Regency", ""), // "Bandung"
          locationInfo.fullLocation.subregion?.replace(" City", ""), // untuk yang "City"

          // Format variations untuk subregion
          locationInfo.fullLocation.subregion?.toUpperCase(),
          `KOTA ${locationInfo.fullLocation.subregion?.replace(" Regency", "").toUpperCase()}`,
          `KABUPATEN ${locationInfo.fullLocation.subregion?.replace(" Regency", "").toUpperCase()}`,

          // Fallback ke district jika subregion gagal
          locationInfo.fullLocation.district,

          // Manual patterns berdasarkan area knowledge
          ...(locationInfo.fullLocation.subregion
            ?.toLowerCase()
            .includes("bandung")
            ? [
                "BANDUNG",
                "KOTA BANDUNG",
                "KABUPATEN BANDUNG",
                "KABUPATEN BANDUNG BARAT",
              ]
            : []),

          ...(locationInfo.fullLocation.subregion
            ?.toLowerCase()
            .includes("jakarta") ||
          locationInfo.region?.toLowerCase().includes("jakarta")
            ? ["JAKARTA", "DKI JAKARTA", "KOTA JAKARTA PUSAT"]
            : []),

          ...(locationInfo.fullLocation.subregion
            ?.toLowerCase()
            .includes("surabaya")
            ? ["SURABAYA", "KOTA SURABAYA"]
            : []),

          // Terakhir coba region (provinsi)
          locationInfo.region,
        ].filter(Boolean);

        for (const variation of cityVariations) {
          console.log(`Trying geographic variation: "${variation}"`);
          cityId = await this.searchCityId(variation);
          if (cityId) {
            console.log(`Found city ID: ${cityId} for "${variation}"`);
            break;
          }
        }
      }

      if (!cityId) {
        throw new Error(
          `Tidak dapat menemukan ID kota untuk area "${locationInfo.fullLocation.subregion || locationInfo.city}" (${locationInfo.region})`
        );
      }

      // 6. Ambil jadwal hari ini
      const today = new Date();
      const schedule = await this.getDailySchedule(
        cityId,
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );

      return schedule;
    } catch (error) {
      console.error("Get Shalat Schedule Error:", error);
      return null;
    }
  }

  // Helper: format waktu untuk display
  formatShalatTime(time: string): string {
    return time || "-";
  }

  // Helper: mendapatkan waktu shalat berikutnya
  getNextShalatTime(
    jadwal: JadwalShalat
  ): { name: string; time: string } | null {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const shalatTimes = [
      { name: "Subuh", time: jadwal.subuh },
      { name: "Dzuhur", time: jadwal.dzuhur },
      { name: "Ashar", time: jadwal.ashar },
      { name: "Maghrib", time: jadwal.maghrib },
      { name: "Isya", time: jadwal.isya },
    ];

    for (const shalat of shalatTimes) {
      const [hours, minutes] = shalat.time.split(":").map(Number);
      const shalatMinutes = hours * 60 + minutes;

      if (shalatMinutes > currentTime) {
        return shalat;
      }
    }

    // Jika semua shalat hari ini sudah lewat, return Subuh besok
    return { name: "Subuh", time: jadwal.subuh };
  }
}

export const shalatService = new ShalatService();
