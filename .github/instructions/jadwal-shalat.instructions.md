# 📅 React Native Jadwal Sholat (Berbasis Lokasi)

---

## ✨ Fitur

- Mengambil **lokasi GPS** pengguna secara real-time.
- **Reverse geocoding** untuk mendapatkan nama kota.
- **Pencocokan ID kota** ke API myQuran.
- Menampilkan **jadwal sholat harian** (Subuh, Dzuhur, Ashar, Maghrib, Isya) + opsional (`imsak`, `terbit`, `dhuha`).
- Mendukung **jadwal bulanan**.
- **Fallback** jika kota tidak ditemukan (pencarian kota terdekat).
- Caching daftar kota & jadwal untuk menghemat request.

---

## 📡 API Reference

**Base URL**

```
https://api.myquran.com/v2
```

### 1. Cari Kota

```
GET /sholat/kota/cari/{keyword}
```

Gunakan untuk mencari `id_kota` berdasarkan nama kota.

### 2. Daftar Semua Kota

```
GET /sholat/kota/semua
```

Berguna untuk caching atau pencarian manual.

### 3. Jadwal Harian

```
GET /sholat/jadwal/{id_kota}/{tahun}/{bulan}/{tanggal}
```

Mengembalikan `data.jadwal` dengan waktu sholat.

### 4. Jadwal Bulanan

```
GET /sholat/jadwal/{id_kota}/{tahun}/{bulan}
```

> **Note:** API ini **tidak memerlukan API key** dan respons berbentuk JSON.

---

## 🗺️ Alur Aplikasi

1. Minta izin lokasi dari pengguna.
2. Ambil koordinat (`latitude`, `longitude`) menggunakan `expo-location`.
3. Lakukan **reverse geocoding** untuk mendapatkan nama kota.
4. Cari `id_kota` dari API `/sholat/kota/cari/{keyword}`.
5. Panggil API `/sholat/jadwal/{id_kota}/{tahun}/{bulan}/{tanggal}` untuk jadwal harian.
6. Tampilkan di UI.

---

## 📦 Instalasi

- Gunakan expo-location

---

## ⚠️ Catatan Penting

- Pastikan `expo-location` sudah diinstal dan izin lokasi diaktifkan.
- Di Android, tambahkan izin di `app.json`:

```json
"android": {
  "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
}
```

- Di iOS, tambahkan di `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Aplikasi memerlukan lokasi untuk menampilkan jadwal sholat</string>
```

- API ini bekerja optimal untuk kota besar di Indonesia. Kota kecil mungkin perlu fallback ke kota terdekat.

---
