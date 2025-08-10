import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { storageService } from "../services/storage";
import { BookmarkAyah } from "../types/api";

export default function FavoritPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkAyah[]>([]);
  const [loading, setLoading] = useState(true);

  // Load bookmarks setiap kali halaman difokuskan
  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await storageService.getBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [loadBookmarks])
  );

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

  const removeBookmark = async (surahNumber: number, ayahNumber: number) => {
    Alert.alert(
      "Hapus Favorit",
      "Apakah Anda yakin ingin menghapus ayat ini dari favorit?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await storageService.removeBookmark(surahNumber, ayahNumber);
              await loadBookmarks();
            } catch (error) {
              console.error("Error removing bookmark:", error);
              Alert.alert("Error", "Gagal menghapus favorit.");
            }
          },
        },
      ]
    );
  };

  const navigateToAyah = (bookmark: BookmarkAyah) => {
    // Tambahkan parameter from=favorit untuk tracking
    router.push(
      `/(mushaf)/surah/${bookmark.surahNumber}?ayah=${bookmark.ayahNumber}&from=favorit` as any
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#dc2626" />
        <Text className="mt-4 text-gray-600">Memuat ayat favorit...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-rose-600 relative overflow-hidden">
        <View className="absolute inset-0 bg-rose-700 opacity-20" />
        <View className="px-6 py-8">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold mb-2">
                Ayat Favorit
              </Text>
              <Text className="text-rose-100 text-base opacity-90">
                {bookmarks.length} ayat tersimpan
              </Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <Ionicons name="heart" size={24} color="white" />
            </View>
          </View>
        </View>
      </View>

      {bookmarks.length === 0 ? (
        // Empty State
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-100 p-6 rounded-full mb-6">
            <Ionicons name="heart" size={48} color="#dc2626" />
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-2 text-center">
            Belum Ada Ayat Favorit
          </Text>
          <Text className="text-gray-600 text-center mb-8 leading-6">
            Mulai menandai ayat-ayat pilihan Anda dengan menekan tombol hati
            saat membaca
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/mushaf")}
            className="bg-red-600 px-8 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold text-base">
              Buka Mushaf
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Bookmark List
        <ScrollView className="flex-1">
          <View className="px-4 py-4">
            {bookmarks.map((bookmark, index) => (
              <TouchableOpacity
                key={`${bookmark.surahNumber}-${bookmark.ayahNumber}`}
                onPress={() => navigateToAyah(bookmark)}
                className="bg-white rounded-lg mb-4 p-4 shadow-sm border border-gray-200"
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="bg-red-100 rounded-full px-3 py-1 mr-3">
                      <Text className="text-red-800 font-semibold text-sm">
                        {bookmark.surahNumber}:{bookmark.ayahNumber}
                      </Text>
                    </View>
                    <Text className="text-gray-900 font-semibold text-base">
                      {bookmark.surahName}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      removeBookmark(bookmark.surahNumber, bookmark.ayahNumber)
                    }
                    className="p-2"
                  >
                    <Ionicons name="heart" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>

                {/* Arabic Text */}
                <Text className="text-right text-lg leading-loose mb-3 font-arabic">
                  {bookmark.text}
                </Text>

                {/* Translation */}
                <Text className="text-gray-700 text-base leading-6 mb-3">
                  {bookmark.translation}
                </Text>

                {/* Footer */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <Text className="text-gray-500 text-xs">
                    Ketuk untuk membuka ayat
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
