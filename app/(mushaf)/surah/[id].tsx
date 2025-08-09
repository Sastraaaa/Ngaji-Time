import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  TextInput,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "../../../services/api";
import { storageService } from "../../../services/storage";
import { Ayah } from "../../../types/api";

export default function SurahDetailPage() {
  const { id, ayah } = useLocalSearchParams<{ id: string; ayah?: string }>();
  const router = useRouter();
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(
    new Set()
  );
  const [selectedTafsir, setSelectedTafsir] = useState<Ayah | null>(null);
  const [tafsirModalVisible, setTafsirModalVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAyahs, setFilteredAyahs] = useState<Ayah[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const loadSurahDetail = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`Loading surah detail for surah ${id}`);

      const response = await apiService.getSurahDetail(parseInt(id));

      if (!response?.data || response.data.length === 0) {
        throw new Error(`Data surah ${id} kosong atau tidak valid`);
      }

      setAyahs(response.data);
      console.log(
        `Successfully loaded ${response.data.length} ayahs for surah ${id}`
      );

      // Check if data came from cache
      if (response.message.includes("cache")) {
        setIsOffline(true);
      }

      // Set last read
      if (response.data.length > 0) {
        const targetAyah = ayah ? parseInt(ayah) : 1;
        const surahName =
          response.data[0]?.surah?.name?.transliteration?.id || `Surah ${id}`;

        console.log(
          `Setting last read: Surah ${id}, Ayah ${targetAyah}, Name: ${surahName}`
        );

        const lastReadData = {
          surahNumber: parseInt(id),
          ayahNumber: targetAyah,
          surahName: surahName,
          timestamp: new Date(),
        };

        console.log("Last read data to save:", lastReadData);
        await storageService.setLastRead(lastReadData);

        // Verify it was saved
        const savedLastRead = await storageService.getLastRead();
        console.log("Verified saved last read:", savedLastRead);
      }
    } catch (error) {
      console.error("Error loading surah detail:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Pastikan koneksi internet Anda stabil.";
      Alert.alert("Error", `Gagal memuat surah ${id}. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [id, ayah]);

  const loadBookmarks = useCallback(async () => {
    try {
      const bookmarks = await storageService.getBookmarks();
      const bookmarkedSet = new Set(
        bookmarks
          .filter((b) => b.surahNumber === parseInt(id))
          .map((b) => b.ayahNumber)
      );
      setBookmarkedAyahs(bookmarkedSet);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadSurahDetail();
      loadBookmarks();
    }
  }, [id, loadSurahDetail, loadBookmarks]);

  // Handle hardware back button untuk Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Selalu kembali ke mushaf, tidak peduli dari mana datangnya
        router.replace("/mushaf");
        return true; // Prevent default behavior
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => backHandler.remove();
    }, [router])
  );

  const handleBackButton = () => {
    // Selalu kembali ke mushaf untuk konsistensi
    router.replace("/mushaf");
  };

  // Filter ayahs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAyahs(ayahs);
    } else {
      const filtered = ayahs.filter((ayah) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          ayah.text.arab.includes(searchQuery) ||
          ayah.translation.id.toLowerCase().includes(searchLower) ||
          ayah.number.inSurah.toString().includes(searchQuery)
        );
      });
      setFilteredAyahs(filtered);
    }
  }, [ayahs, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearch(false);
  };

  const playAudio = async (audioUrl: string, ayahNumber: number) => {
    try {
      Alert.alert(
        "Audio Murottal",
        `Memutar audio untuk ayat ${ayahNumber}. Audio akan dibuka di aplikasi pemutar default.`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Putar",
            onPress: () => {
              Linking.openURL(audioUrl);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error playing audio:", error);
      Alert.alert("Error", "Gagal membuka audio");
    }
  };

  const toggleBookmark = async (ayahData: Ayah) => {
    try {
      const isBookmarked = bookmarkedAyahs.has(ayahData.number.inSurah);

      if (isBookmarked) {
        await storageService.removeBookmark(
          parseInt(id),
          ayahData.number.inSurah
        );
        setBookmarkedAyahs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(ayahData.number.inSurah);
          return newSet;
        });
      } else {
        // Ambil nama surah dari ayahs yang sudah dimuat atau fallback
        const surahName =
          ayahData.surah?.name?.transliteration?.id ||
          ayahs[0]?.surah?.name?.transliteration?.id ||
          `Surah ${id}`;

        await storageService.addBookmark({
          surahNumber: parseInt(id),
          ayahNumber: ayahData.number.inSurah,
          surahName: surahName,
          text: ayahData.text.arab,
          translation: ayahData.translation.id,
        });
        setBookmarkedAyahs(
          (prev) => new Set([...prev, ayahData.number.inSurah])
        );
      }

      Alert.alert(
        "Berhasil",
        isBookmarked ? "Bookmark berhasil dihapus" : "Ayat berhasil dibookmark"
      );
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Gagal mengubah bookmark");
    }
  };

  const openTafsir = (ayahData: Ayah) => {
    setSelectedTafsir(ayahData);
    setTafsirModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="mt-4 text-gray-600">Memuat surah...</Text>
      </SafeAreaView>
    );
  }

  if (ayahs.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Tidak ada data ayat</Text>
      </SafeAreaView>
    );
  }

  const surahInfo = ayahs[0]?.surah;

  if (!surahInfo) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Data surah tidak tersedia</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header dengan Back Button */}
      <View className="bg-purple-600 px-4 py-3">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity
            onPress={handleBackButton}
            className="mr-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">
              {surahInfo?.name?.transliteration?.id || `Surah ${id}`}
            </Text>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            className="mr-2 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="search" size={22} color="white" />
          </TouchableOpacity>

          {isOffline && (
            <View className="flex-row items-center bg-purple-700 px-2 py-1 rounded-full">
              <Ionicons name="cloud-offline" size={12} color="white" />
              <Text className="text-white text-xs ml-1">Offline</Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View className="mt-3 mb-2">
            <View className="flex-row items-center bg-purple-700 rounded-lg px-3 py-2">
              <Ionicons name="search" size={16} color="white" />
              <TextInput
                className="flex-1 text-white ml-2 text-base"
                placeholder="Cari ayat... (nomor ayat, teks arab, atau terjemahan)"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} className="ml-2">
                  <Ionicons name="close-circle" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.length > 0 && (
              <Text className="text-purple-200 text-xs mt-1">
                Ditemukan {filteredAyahs.length} ayat dari {ayahs.length} ayat
              </Text>
            )}
          </View>
        )}

        <Text className="text-purple-200 text-sm ml-10">
          {surahInfo?.name?.translation?.id || `Surah ${id}`} • {ayahs.length}{" "}
          Ayat (1-{ayahs.length})
        </Text>
        {surahInfo?.revelation?.id && (
          <Text className="text-purple-200 text-xs mt-1">
            Diturunkan di {surahInfo.revelation.id}
          </Text>
        )}
      </View>

      {/* Scroll to specific ayah if provided */}
      <ScrollView className="flex-1" contentInsetAdjustmentBehavior="automatic">
        {/* Basmallah for non-Taubah */}
        {parseInt(id) !== 9 && (
          <View className="bg-white mx-4 mt-4 p-6 rounded-lg border border-gray-200">
            <Text className="text-2xl text-center text-gray-800 font-arabic leading-10">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
            <Text className="text-center text-gray-600 text-sm mt-2">
              Dengan nama Allah Yang Maha Pengasih, Maha Penyayang
            </Text>
          </View>
        )}

        {/* Ayahs */}
        <View className="px-4 pb-4">
          {searchQuery.length > 0 && filteredAyahs.length === 0 ? (
            <View className="bg-white mt-4 p-6 rounded-lg border border-gray-200">
              <Text className="text-center text-gray-500">
                Tidak ada ayat yang ditemukan untuk &quot;{searchQuery}&quot;
              </Text>
              <Text className="text-center text-gray-400 text-sm mt-2">
                Coba kata kunci lain atau nomor ayat
              </Text>
            </View>
          ) : (
            filteredAyahs.map((ayahData, index) => {
              const isBookmarked = bookmarkedAyahs.has(ayahData.number.inSurah);
              const isTarget =
                ayah && parseInt(ayah) === ayahData.number.inSurah;

              return (
                <View
                  key={ayahData.number.inSurah}
                  className={`bg-white mt-4 p-6 rounded-lg border ${
                    isTarget
                      ? "border-purple-400 bg-purple-50"
                      : "border-gray-200"
                  }`}
                >
                  {/* Ayah Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="bg-purple-600 px-3 py-1 rounded-full">
                      <Text className="text-white text-sm font-bold">
                        {ayahData.number.inSurah}
                      </Text>
                    </View>

                    <View className="flex-row space-x-2">
                      {/* Audio Button */}
                      <TouchableOpacity
                        onPress={() =>
                          playAudio(
                            ayahData.audio.primary,
                            ayahData.number.inSurah
                          )
                        }
                        className="bg-green-600 p-2 rounded-lg"
                      >
                        <Ionicons name="play" size={20} color="white" />
                      </TouchableOpacity>

                      {/* Bookmark Button */}
                      <TouchableOpacity
                        onPress={() => toggleBookmark(ayahData)}
                        className={`p-2 rounded-lg ${
                          isBookmarked ? "bg-red-600" : "bg-gray-600"
                        }`}
                      >
                        <Ionicons
                          name={isBookmarked ? "heart" : "heart-outline"}
                          size={20}
                          color="white"
                        />
                      </TouchableOpacity>

                      {/* Tafsir Button */}
                      <TouchableOpacity
                        onPress={() => openTafsir(ayahData)}
                        className="bg-blue-600 p-2 rounded-lg"
                      >
                        <Ionicons name="book" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Arabic Text */}
                  <Text className="text-2xl text-right text-gray-900 font-arabic leading-loose mb-4">
                    {ayahData.text.arab}
                  </Text>

                  {/* Transliteration */}
                  <Text className="text-gray-700 italic text-base leading-relaxed mb-2">
                    {ayahData.text.transliteration.en}
                  </Text>

                  {/* Translation */}
                  <Text className="text-gray-800 text-base leading-relaxed">
                    {ayahData.translation.id}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Tafsir Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={tafsirModalVisible}
        onRequestClose={() => setTafsirModalVisible(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-3/4">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">
                Tafsir Ayat {selectedTafsir?.number.inSurah}
              </Text>
              <TouchableOpacity
                onPress={() => setTafsirModalVisible(false)}
                className="bg-gray-200 p-2 rounded-full"
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView className="px-6 py-4">
              {selectedTafsir && (
                <>
                  {/* Arabic Text */}
                  <Text className="text-xl text-right text-gray-900 font-arabic leading-loose mb-4">
                    {selectedTafsir.text.arab}
                  </Text>

                  {/* Translation */}
                  <Text className="text-gray-800 text-base leading-relaxed mb-4">
                    {selectedTafsir.translation.id}
                  </Text>

                  {/* Tafsir Note */}
                  <View className="bg-blue-50 p-4 rounded-lg">
                    <Text className="text-blue-800 text-sm">
                      💡 Tafsir: Fitur tafsir lengkap akan ditambahkan di versi
                      mendatang. Saat ini Anda dapat melihat terjemahan resmi
                      dari Kementerian Agama RI.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
