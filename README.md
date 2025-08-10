# NgajiTime - Aplikasi Al-Qur'an

NgajiTime adalah aplikasi mobile untuk membaca Al-Qur'an dengan fitur tahfidz tracker, bookmark ayat favorit, dan pencarian masjid terdekat.

## Fitur Utama

### 🕌 Membaca Al-Qur'an

- **Mushaf Digital**: Baca 114 surah Al-Qur'an lengkap
- **Audio Player**: Dengarkan murottal setiap ayat
- **Terjemahan Indonesia**: Terjemahan ayat dalam bahasa Indonesia
- **Tafsir Lengkap**: Tafsir singkat dan detail untuk setiap ayat
- **Bookmark Ayat**: Simpan ayat-ayat favorit
- **Last Read**: Melanjutkan bacaan dari posisi terakhir

### 📚 Target Tahfidz

- **Tracking Hafalan**: Buat target hafalan per surah
- **Progress Monitoring**: Pantau kemajuan hafalan
- **Checklist Ayat**: Tandai ayat yang sudah dihafal
- **Statistik Progres**: Lihat persentase hafalan

### ❤️ Ayat Favorit

- **Simpan Ayat**: Bookmark ayat pilihan
- **Koleksi Personal**: Akses cepat ke ayat favorit
- **Navigasi Mudah**: Langsung ke ayat dari daftar favorit

### 🗺️ Peta Masjid

- **Lokasi Masjid**: Temukan masjid terdekat
- **Google Maps Integration**: Navigasi ke masjid terpilih
- **Informasi Detail**: Nama dan alamat masjid

## Setup Project

### Prerequisites

- Node.js (v16 atau lebih baru)
- Expo CLI
- React Native development environment

### Instalasi

```bash
# Clone repository
git clone <repository-url>
cd NgajiTime

# Install dependencies
npm install

# Start development server
npm start
```

### Running on Device

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Konfigurasi API

### Al-Qur'an API

Project menggunakan API dari `https://api-ngaji-time.vercel.app` dengan endpoint:

- `GET /surah` - Daftar semua surah
- `GET /surah/{id}` - Detail surah dengan semua ayat
- `GET /surah/{surah_id}/{ayah_id}` - Ayat spesifik
- `GET /juz/{id}` - Ayat per juz

### Google Maps API (Opsional)

Untuk fitur peta masjid dengan data real-time:

1. Dapatkan Google Places API Key dari [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Places API
3. Tambahkan API key di file `app/peta.tsx`:
   ```typescript
   const GOOGLE_PLACES_API_KEY = "YOUR_GOOGLE_PLACES_API_KEY";
   ```

**Catatan**: Tanpa API key, aplikasi akan menggunakan data dummy masjid.

## Struktur Project

```
NgajiTime/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Beranda
│   │   ├── favorit.tsx          # Ayat Favorit
│   │   ├── tahfidz.tsx          # Target Tahfidz
│   │   └── peta.tsx             # Peta Masjid
│   ├── mushaf/                   # Mushaf pages
│   │   ├── index.tsx            # Daftar Surah
│   │   ├── surah/[id].tsx       # Detail Surah
│   │   └── _layout.tsx          # Layout Mushaf
│   ├── _layout.tsx              # Root layout
│   └── global.css               # Global styles
├── services/                     # API & Storage services
│   ├── api.ts                   # API service
│   └── storage.ts               # AsyncStorage service
├── types/                        # TypeScript types
│   └── api.ts                   # API types
└── assets/                       # Images & fonts
```

## Teknologi yang Digunakan

- **React Native**: Framework mobile
- **Expo**: Development platform
- **Expo Router**: File-based routing
- **TypeScript**: Type safety
- **Tailwind CSS (NativeWind)**: Styling
- **AsyncStorage**: Local storage
- **Expo AV**: Audio player
- **Expo Location**: GPS location
- **React Native Maps**: Google Maps integration

## Fitur yang Akan Datang

- [ ] Mode gelap/terang
- [ ] Pengaturan ukuran font
- [ ] Notifikasi pengingat baca dan jadwal shalat
- [ ] Jadwal sholat
- [ ] Kiblat direction
- [ ] Peta masjid

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Lisensi

Distributed under the MIT License. See `LICENSE` for more information.
