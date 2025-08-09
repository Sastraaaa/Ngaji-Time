### **Fitur 1: Mushaf Digital & Pembaca Al-Qur'an**

**Tujuan Fitur:**
Menyediakan pengalaman membaca Al-Qur'an yang mudah, jelas, dan modern. Pengguna bisa membaca teks Arab, melihat terjemahan, dan mendengarkan bacaan Murottal per ayat.

**Alur Kerja (Step-by-Step):**

1.  **Tampilan Awal (Daftar Surah):**
    - Saat pengguna membuka aplikasi, halaman utama akan menampilkan daftar 114 surah.
    - Setiap item dalam daftar menunjukkan: Nomor surah, Nama surah (Arab & Latin), dan Arti nama surah.
    - **Data API:** Gunakan endpoint `/surah` untuk mendapatkan semua data ini.

2.  **Membuka dan Membaca Surah:**
    - Pengguna mengetuk salah satu surah dari daftar (misalnya, "18. Al-Kahf").
    - Aplikasi akan membuka halaman baru yang khusus menampilkan seluruh ayat dari surah Al-Kahf.
    - **Data API:** Gunakan endpoint `/surah/18` untuk mengambil semua data surah Al-Kahf.

3.  **Tampilan Ayat:**
    - Di halaman surah, setiap ayat ditampilkan dalam satu baris atau blok yang rapi.
    - Setiap blok ayat berisi:
      - Nomor ayat. (`data.number.inSurah`)
      - Teks Arab yang jelas. (`data.text.arab`)
      - Teks terjemahan Bahasa Indonesia di bawahnya. (`data.translation.id`)
      - Ikon "Play" (▶️) di samping setiap ayat.

4.  **Memutar Audio Murottal:**
    - Ketika pengguna mengetuk ikon "Play" (▶️) di samping sebuah ayat (misalnya, ayat ke-10), aplikasi akan memutar audio Murottal khusus untuk ayat tersebut.
    - Saat audio diputar, ikon bisa berubah menjadi "Pause" (⏸️).
    - **Data API:** Gunakan URL dari `data.audio.primary` untuk diputar.

---

### **Fitur 2: Pusat Informasi (Tafsir & Info Surah)**

**Tujuan Fitur:**
Memberikan pemahaman dan konteks yang lebih dalam kepada pengguna saat mereka membaca, tidak hanya sekadar membaca teks.

**Alur Kerja (Step-by-Step):**

1.  **Menampilkan Info Surah:**
    - Di bagian atas halaman setiap surah (misalnya, di bawah judul "Surah Al-Kahf"), tampilkan informasi ringkas tentang surah tersebut.
    - Informasi ini berisi: Jumlah ayat, Tempat diturunkan (Makkiyyah/Madaniyyah), dan sedikit pengenalan tentang surah tersebut.
    - **Data API:** Gunakan `data.surah.numberOfVerses`, `data.surah.revelation.id`, dan `data.surah.tafsir.id`.

2.  **Mengakses Tafsir Ayat:**
    - Di setiap blok ayat (di bawah terjemahan), tambahkan sebuah tombol atau ikon "Info" (ⓘ) atau "Tafsir".
    - Ketika pengguna mengetuk tombol "Tafsir" pada sebuah ayat, sebuah pop-up atau jendela kecil akan muncul.

3.  **Tampilan Jendela Tafsir:**
    - Jendela pop-up tersebut akan menampilkan tafsir singkat dari ayat yang dipilih.
    - Di dalamnya juga ada tombol "Lihat Selengkapnya" untuk membuka tafsir versi panjang.
    - Saat "Lihat Selengkapnya" diketuk, aplikasi akan membuka halaman baru yang menampilkan seluruh teks tafsir panjang.
    - **Data API:** Gunakan `data.tafsir.id.short` untuk pop-up dan `data.tafsir.id.long` untuk halaman detail.

4.  **Penanda Ayat Sajdah:**
    - Saat menampilkan ayat, aplikasi secara otomatis memeriksa apakah ayat tersebut adalah ayat sajdah.
    - Jika ya, tampilkan ikon khusus (misalnya: ۩) di akhir teks Arab ayat tersebut.
    - **Data API:** Periksa `data.meta.sajda.obligatory`. Jika nilainya `true`, tampilkan ikonnya.

---

### **Fitur 3: Penanda & Favorit**

**Tujuan Fitur:**
Memudahkan pengguna untuk menandai bacaan terakhir mereka dan menyimpan ayat-ayat penting atau yang berkesan bagi mereka. Fitur ini tidak banyak menggunakan API, lebih ke logika aplikasi.

**Alur Kerja (Step-by-Step):**

1.  **Penanda Terakhir Dibaca (Bookmark):**
    - Setiap kali pengguna membuka sebuah surah dan menggulir (scroll), aplikasi secara otomatis menyimpan nomor surah dan nomor ayat terakhir yang terlihat di layar.
    - Di halaman utama, tampilkan sebuah tombol/area "Terakhir Dibaca: Surah X, Ayat Y".
    - Ketika tombol ini diketuk, aplikasi langsung membawa pengguna ke surah dan ayat tersebut.
    - **Data API:** Tidak ada. Ini murni menyimpan data (nomor surah & ayat) di penyimpanan lokal perangkat.

2.  **Menyimpan Ayat Favorit:**
    - Di setiap blok ayat, tambahkan ikon "Favorit" atau "Simpan" (misalnya, ikon hati ❤️ atau bintang ⭐).
    - Ketika pengguna mengetuk ikon ini, ikon akan berubah warna (misalnya, menjadi merah) dan aplikasi akan menyimpan informasi ayat tersebut (nomor surah dan nomor ayat).

3.  **Halaman Favorit:**
    - Di menu utama aplikasi, sediakan satu menu "Favorit".
    - Ketika dibuka, halaman ini akan menampilkan daftar semua ayat yang telah ditandai sebagai favorit oleh pengguna.
    - Setiap item di daftar ini bisa diketuk untuk langsung menuju ke lokasi ayat tersebut di dalam Mushaf.
    - **Data API:** Saat menampilkan daftar favorit, Anda perlu memanggil endpoint `/surah/{surah}/{ayat}` untuk setiap ayat yang disimpan guna mengambil kembali teks Arab dan terjemahannya.

### **Fitur 4: Target Tahfidz (Pelacak Hafalan)**

**Tujuan Fitur:**
Memberikan alat bantu bagi pengguna untuk menetapkan target hafalan Al-Qur'an, melacak progres mereka secara visual, dan mempermudah proses `muroja'ah` (mengulang hafalan).

**Alur Kerja (Step-by-Step):**

1.  **Halaman Utama Tahfidz:**
    - Di menu utama aplikasi, tambahkan menu "Target Tahfidz".
    - Saat dibuka, halaman ini menampilkan daftar target yang sedang dikerjakan pengguna (awalnya kosong). Ada tombol besar "Buat Target Baru".

2.  **Membuat Target Baru:**
    - Ketika pengguna menekan "Buat Target Baru", aplikasi menampilkan daftar 114 surah.
    - Pengguna memilih surah yang ingin dihafal (misalnya, "78. An-Naba'").
    - Setelah memilih, surah tersebut akan muncul di halaman utama Tahfidz sebagai "kartu target" baru.
    - **Data API:** Gunakan endpoint `/surah` dari `https://api-ngaji-time.vercel.app` untuk menampilkan daftar pilihan surah.

3.  **Halaman Detail Target (Checklist Hafalan):**
    - Pengguna mengetuk kartu target "An-Naba'".
    - Aplikasi membuka halaman detail yang berisi:
      - Judul surah "An-Naba'".
      - Baris Progres (misalnya, "0/40 Ayat (0%)").
      - Daftar lengkap 40 ayat dari surah tersebut.
    - **Data API:** Panggil endpoint `/surah/78` untuk mendapatkan semua ayat dan `numberOfVerses` untuk menghitung total ayat (yaitu 40).

4.  **Melacak Progres Hafalan:**
    - Di samping setiap ayat dalam daftar, ada sebuah kotak centang (checkbox).
    - Ketika pengguna merasa sudah hafal satu ayat, mereka bisa mencentang kotak di sampingnya.
    - Setiap kali sebuah kotak dicentang atau dihilangkan centangnya, Baris Progres di bagian atas akan otomatis diperbarui (misalnya, menjadi "1/40 Ayat (2.5%)").
    - **Logika Aplikasi:** Status "tercentang" untuk setiap ayat (misalnya, `An-Naba ayat 1: true`, `ayat 2: false`) harus disimpan di penyimpanan lokal perangkat. Ini bukan tugas API.

5.  **Alat Bantu Muroja'ah (Mengulang):**
    - Pengguna bisa mengetuk teks ayat mana pun dalam daftar checklist.
    - Saat diketuk, aplikasi akan memutar audio Murottal khusus untuk ayat itu, membantu pengguna memvalidasi hafalannya.
    - **Data API:** Gunakan URL audio dari `data.audio.primary` untuk ayat yang dipilih.

---

### **Fitur 5: Peta Masjid Terdekat**

**Tujuan Fitur:**
Memberikan kemudahan bagi pengguna untuk menemukan lokasi masjid terdekat dari posisi mereka saat ini, lengkap dengan informasi jarak dan navigasi.

**Alur Kerja (Step-by-Step):**

1.  **Membuka Fitur Peta:**
    - Di menu utama aplikasi, tambahkan menu "Peta Masjid".
    - Saat pertama kali dibuka, aplikasi akan meminta izin kepada pengguna untuk mengakses lokasi perangkat. Ini adalah langkah wajib untuk fungsionalitas peta.

2.  **Menampilkan Peta dan Lokasi Pengguna:**
    - Setelah izin diberikan, aplikasi akan menampilkan antarmuka peta (dari Google Maps).
    - Sebuah penanda (pin) biru akan menunjukkan lokasi pengguna saat ini di tengah peta.
    - **API & Logika:** Gunakan library Geolocation untuk mendapatkan koordinat GPS pengguna. Gunakan komponen Peta dari Google Maps Platform untuk menampilkan peta yang berpusat pada koordinat tersebut.

3.  **Mencari Masjid Terdekat:**
    - Aplikasi secara otomatis melakukan pencarian "masjid" di sekitar lokasi pengguna.
    - **API:** Gunakan **Google Maps Places API**. Kirim permintaan pencarian dengan parameter: `keyword=masjid`, `location={lokasi_pengguna}`, dan `radius={misalnya, 5000 meter}`.

4.  **Menampilkan Lokasi Masjid:**
    - Hasil pencarian dari Google Maps (berupa daftar masjid) akan ditampilkan sebagai penanda (pin) merah di peta.
    - Di bagian bawah layar, bisa ditampilkan daftar masjid yang ditemukan dalam bentuk kartu (card), diurutkan berdasarkan jarak terdekat. Setiap kartu berisi nama masjid dan perkiraan jarak.

5.  **Interaksi dengan Penanda Masjid:**
    - Ketika pengguna mengetuk salah satu penanda masjid di peta (atau kartu di daftar), aplikasi akan menampilkan informasi lebih detail seperti alamat lengkap.
    - Akan ada tombol "Arahkan" atau "Navigasi".
    - Saat tombol "Arahkan" diketuk, aplikasi akan membuka aplikasi Google Maps (yang sudah terinstall di ponsel pengguna) untuk memulai navigasi rute dari lokasi pengguna ke masjid yang dipilih.

- **API Utama:** `https://api-ngaji-time.vercel.app`

- **Endpoint usage:**
- /surah = Returns the list of surahs in Al-Quran.
- /surah/{surah} = Returns spesific surah. Example: /surah/110
- /surah/{surah}/{ayah} = Returns spesific ayah with requested surah. Example: /surah/2/255
- /juz/{juz} = Returns spesific juz with all ayah.Example: /juz/2
