import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { storageService } from "../services/storage";
import { cacheService } from "../services/cache";
import { LastRead } from "../types/api";
import { tw } from "../constants/colors";

export default function Index() {
  const router = useRouter();
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    loadLastRead();
    checkAndDownloadSurahs();
  }, []);

  const loadLastRead = async () => {
    try {
      const data = await storageService.getLastRead();
      console.log("Loaded last read from home:", data);
      setLastRead(data);
    } catch (error) {
      console.error("Error loading last read:", error);
    }
  };

  const checkAndDownloadSurahs = async () => {
    try {
      const isDownloaded = await cacheService.isAllSurahsDownloaded();
      if (!isDownloaded) {
        setShowDownloadModal(true);
        setIsDownloading(true);

        // Download hanya beberapa surah penting dulu untuk demo
        // Nanti bisa diubah jadi semua surah
        console.log("Starting essential surahs download...");
        await cacheService.preloadEssentialSurahs();

        // Mark as downloaded untuk demo
        await cacheService.markAllSurahsDownloaded();

        setDownloadProgress(100);
        setIsDownloading(false);
        setTimeout(() => {
          setShowDownloadModal(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error downloading surahs:", error);
      setIsDownloading(false);
      setShowDownloadModal(false);
    }
  };

  const navigateToLastRead = () => {
    if (lastRead) {
      router.push(
        `/(mushaf)/surah/${lastRead.surahNumber}?ayah=${lastRead.ayahNumber}` as any
      );
    }
  };

  const menuItems = [
    {
      title: "Mushaf Al-Qur'an",
      subtitle: "Baca Al-Qur'an dengan terjemahan",
      icon: "book-outline",
      color: tw.bg.primary,
      textColor: "text-green-600",
      route: "/mushaf",
    },
    {
      title: "Ayat Favorit",
      subtitle: "Kumpulan ayat pilihan Anda",
      icon: "heart-outline",
      color: "bg-rose-600",
      textColor: "text-rose-600",
      route: "/favorit",
    },
    {
      title: "Peta Masjid",
      subtitle: "Temukan masjid terdekat",
      icon: "location-outline",
      color: "bg-orange-600",
      textColor: "text-orange-600",
      route: "/peta",
    },
    {
      title: "Target Tahfidz",
      subtitle: "Lacak progres hafalan Anda",
      icon: "checkmark-circle-outline",
      color: tw.bg.secondary,
      textColor: "text-blue-600",
      route: "/(tahfidz)",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Modern Header with Gradient Effect */}
        <View className="bg-green-600 relative overflow-hidden">
          <View className="absolute inset-0 bg-green-700 opacity-20" />
          <View className="px-6 py-8">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-white text-2xl font-bold mb-2">
                  السلام عليكم
                </Text>
                <Text className="text-green-100 text-base opacity-90">
                  Selamat datang di NgajiTime
                </Text>
              </View>
              <View className="bg-white/20 p-3 rounded-full">
                <Ionicons name="moon" size={24} color="white" />
              </View>
            </View>
          </View>
        </View>

        {/* Terakhir Dibaca */}
        {/* Last Read Section */}
        {lastRead && (
          <View className="mx-6 mb-6 -mt-4">
            <TouchableOpacity
              onPress={navigateToLastRead}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100"
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-1">
                    Terakhir Dibaca
                  </Text>
                  <Text className="text-gray-900 font-bold text-lg mb-1">
                    {lastRead.surahName}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Ayat {lastRead.ayahNumber}
                  </Text>
                </View>
                <View className="bg-green-100 p-4 rounded-2xl">
                  <Ionicons name="bookmark" size={24} color="#059669" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Grid */}
        <View className="px-6">
          <Text className="text-gray-900 text-xl font-bold mb-6">
            Fitur Utama
          </Text>

          <View className="space-y-4">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(item.route as any)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center">
                  <View className={`${item.color} p-4 rounded-2xl mr-4`}>
                    <Ionicons name={item.icon as any} size={28} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-lg mb-1">
                      {item.title}
                    </Text>
                    <Text className="text-gray-600 text-sm leading-5">
                      {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quote of the Day */}
        <View className="mx-6 mt-4 mb-4">
          <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100 shadow-sm">
            <Text className="text-center text-lg font-bold text-green-800 mb-3">
              وَقُلْ رَبِّ زِدْنِي عِلْمًا
            </Text>
            <Text className="text-center text-green-700 text-sm leading-5">
              &quot;Dan katakanlah: &apos;Ya Tuhanku, tambahkanlah kepadaku ilmu
              pengetahuan.&apos;&quot;
            </Text>
            <Text className="text-center text-green-600 text-xs mt-2 font-medium">
              QS. Taha: 114
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Download Progress Modal */}
      <Modal
        visible={showDownloadModal}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-6 m-6 shadow-lg">
            <Text className="text-lg font-bold text-gray-800 text-center mb-4">
              Menyiapkan Al-Qur&apos;an Offline
            </Text>

            {isDownloading ? (
              <>
                <ActivityIndicator size="large" color="#059669" />
                <Text className="text-center text-gray-600 mt-4">
                  Mendownload surah... {Math.round(downloadProgress)}%
                </Text>
                <View className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <View
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </View>
                <Text className="text-center text-sm text-gray-500 mt-2">
                  Tunggu sebentar, kami sedang menyiapkan semua surah untuk
                  dibaca offline
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={48}
                  color="#059669"
                  style={{ alignSelf: "center" }}
                />
                <Text className="text-center text-green-600 mt-2 font-medium">
                  Siap untuk dibaca offline!
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
