import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cacheService } from "../services/cache";
import { tw } from "../constants/colors";

interface SettingsItem {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  onPress?: () => void;
  showArrow?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState({
    cachedSurahs: 0,
    totalSurahs: 114,
    percentage: 0,
  });
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    loadCacheInfo();
    loadCacheStats();
  }, []);

  // Handle hardware back button untuk Android - kembali ke beranda
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/"); // Kembali ke beranda
        return true; // Prevent default behavior (keluar aplikasi)
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => backHandler.remove();
    }, [router])
  );

  const loadCacheInfo = async () => {
    try {
      const info = await cacheService.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error("Error loading cache info:", error);
    }
  };

  const loadCacheStats = async () => {
    try {
      const stats = await cacheService.getCacheStatistics();
      setCacheStats(stats);
    } catch (error) {
      console.error("Error loading cache stats:", error);
    }
  };

  const handleDownloadAll = async () => {
    Alert.alert(
      "Download Semua Surah",
      "Mengunduh semua surah Al-Qur'an untuk akses offline. Proses ini membutuhkan koneksi internet yang stabil dan ruang penyimpanan sekitar 50MB.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Download",
          onPress: async () => {
            setShowDownloadModal(true);
            setDownloadingAll(true);
            setDownloadProgress(0);

            try {
              await cacheService.downloadAllSurahs((progress) => {
                setDownloadProgress(progress);
              });

              await loadCacheStats(); // Refresh stats
              Alert.alert("Berhasil", "Semua surah telah berhasil diunduh!");
            } catch (error) {
              console.error("Download error:", error);
              Alert.alert(
                "Error",
                "Gagal mengunduh semua surah. Pastikan koneksi internet stabil."
              );
            } finally {
              setDownloadingAll(false);
              setDownloadProgress(0);
              setShowDownloadModal(false);
            }
          },
        },
      ]
    );
  };

  const clearCache = async () => {
    Alert.alert(
      "Hapus Cache",
      "Menghapus semua data offline yang tersimpan. Anda akan memerlukan koneksi internet untuk membaca Al-Qur'an setelah ini.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await cacheService.clearCache();
              await loadCacheInfo();
              await loadCacheStats();
              Alert.alert("Berhasil", "Cache telah berhasil dihapus!");
            } catch (error) {
              console.error("Error clearing cache:", error);
              Alert.alert("Error", "Gagal menghapus cache.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const settingsItems: { title: string; items: SettingsItem[] }[] = [
    {
      title: "Status Cache Offline",
      items: [
        {
          title: "Surah Tersimpan",
          subtitle: `${cacheStats.cachedSurahs}/${cacheStats.totalSurahs} (${cacheStats.percentage}%)`,
          icon: "library",
          color: "text-green-600",
          bgColor: "bg-green-100",
          showArrow: false,
        },
      ],
    },
    {
      title: "Download Offline",
      items: [
        {
          title: "Download Semua Surah",
          subtitle: "Unduh seluruh Al-Qur'an untuk akses offline",
          icon: "download",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          onPress: handleDownloadAll,
        },
        {
          title: "Hapus Cache",
          subtitle: "Menghapus semua data offline yang tersimpan",
          icon: "trash",
          color: "text-red-600",
          bgColor: "bg-red-100",
          onPress: clearCache,
        },
      ],
    },
    {
      title: "Informasi Aplikasi",
      items: [
        {
          title: "Status Cache",
          subtitle: cacheInfo
            ? `${cacheInfo.totalSurahs} surah tersimpan`
            : "Memuat...",
          icon: "information-circle",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          showArrow: false,
        },
        {
          title: "Ukuran Cache",
          subtitle: cacheInfo
            ? `Terakhir diperbarui: ${
                cacheInfo.lastUpdated
                  ? new Date(cacheInfo.lastUpdated).toLocaleDateString("id-ID")
                  : "Belum pernah"
              }`
            : "Memuat...",
          icon: "analytics",
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          showArrow: false,
        },
      ],
    },
    {
      title: "Lainnya",
      items: [
        {
          title: "Tentang Aplikasi",
          subtitle: "NgajiTime v1.0.0",
          icon: "information",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          onPress: () => {
            Alert.alert(
              "NgajiTime",
              "Aplikasi untuk membaca Al-Qur'an, tahfidz, dan mencari masjid terdekat. Dikembangkan dengan React Native & Expo."
            );
          },
        },
      ],
    },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600">Memproses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-indigo-600 relative overflow-hidden">
        <View className="absolute inset-0 bg-indigo-700 opacity-20" />
        <View className="px-6 py-8">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold mb-2">
                Pengaturan
              </Text>
              <Text className="text-indigo-100 text-base opacity-90">
                Kelola data offline & cache
              </Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <Ionicons name="settings" size={24} color="white" />
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {settingsItems.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <Text className="text-gray-900 text-lg font-semibold mb-3">
              {section.title}
            </Text>

            <View className={tw.card}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                  className={`flex-row items-center p-4 ${
                    itemIndex < section.items.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <View className={`${item.bgColor} p-3 rounded-full mr-4`}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={
                        item.color === "text-green-600"
                          ? "#059669"
                          : item.color === "text-red-600"
                            ? "#dc2626"
                            : item.color === "text-blue-600"
                              ? "#2563eb"
                              : item.color === "text-purple-600"
                                ? "#9333ea"
                                : "#4b5563"
                      }
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold text-base">
                      {item.title}
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1">
                      {item.subtitle}
                    </Text>
                  </View>

                  {item.showArrow !== false && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9ca3af"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View className="mt-8 mb-6">
          <Text className="text-center text-gray-500 text-sm">
            ✨ Semoga aplikasi ini bermanfaat untuk ibadah Anda
          </Text>
        </View>
      </ScrollView>

      {/* Download All Surahs Modal */}
      <Modal
        visible={showDownloadModal}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-6 m-6 shadow-lg max-w-sm w-full">
            <Text className="text-lg font-bold text-gray-800 text-center mb-4">
              Download Semua Surah
            </Text>

            {downloadingAll ? (
              <>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-center text-gray-600 mt-4">
                  Mendownload surah... {Math.round(downloadProgress)}%
                </Text>
                <View className="w-full bg-gray-200 rounded-full h-3 mt-3">
                  <View
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </View>
                <Text className="text-center text-sm text-gray-500 mt-3">
                  Mohon tunggu, sedang mendownload Al-Qur&apos;an untuk akses
                  offline
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={48}
                  color="#2563eb"
                  style={{ alignSelf: "center" }}
                />
                <Text className="text-center text-blue-600 mt-2 font-medium">
                  Download selesai! Al-Qur&apos;an siap dibaca offline.
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
