import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  TextInput,
  BackHandler,
  FlatList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "../../../services/api";
import { storageService } from "../../../services/storage";
import { Ayah } from "../../../types/api";
import { PerformanceTracker } from "../../../utils/performance";

// Memoized AyahCard component untuk prevent unnecessary re-renders
const AyahCard = memo(
  ({
    ayahData,
    isBookmarked,
    isTarget,
    onBookmarkToggle,
    onTafsirOpen,
    onPlayAudio,
  }: {
    ayahData: Ayah;
    isBookmarked: boolean;
    isTarget: boolean;
    onBookmarkToggle: (ayahNumber: number) => void;
    onTafsirOpen: (ayahData: Ayah) => void;
    onPlayAudio: (audioUrl: string, ayahNumber: number) => void;
  }) => {
    return (
      <View
        className={`bg-white mx-4 mt-4 p-6 rounded-lg border ${
          isTarget ? "border-purple-400 bg-purple-50" : "border-gray-200"
        }`}
      >
        {/* Header with Ayah Number and Action Buttons */}
        <View className="flex-row items-center justify-between mb-4">
          {/* Ayah Number */}
          <View className="bg-purple-600 px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-bold">
              {ayahData.number.inSurah}
            </Text>
          </View>

          <View className="flex-row space-x-2">
            {/* Audio Button */}
            <TouchableOpacity
              onPress={() =>
                onPlayAudio(ayahData.audio.primary, ayahData.number.inSurah)
              }
              className="bg-green-600 p-2 rounded-lg"
            >
              <Ionicons name="play" size={20} color="white" />
            </TouchableOpacity>

            {/* Bookmark Button */}
            <TouchableOpacity
              onPress={() => onBookmarkToggle(ayahData.number.inSurah)}
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
              onPress={() => onTafsirOpen(ayahData)}
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
  },
  (prevProps, nextProps) => {
    // Custom comparison untuk optimasi rendering
    return (
      prevProps.ayahData.number.inSurah === nextProps.ayahData.number.inSurah &&
      prevProps.isBookmarked === nextProps.isBookmarked &&
      prevProps.isTarget === nextProps.isTarget
    );
  }
);

AyahCard.displayName = "AyahCard";

export default function SurahDetailPage() {
  const { id, ayah } = useLocalSearchParams<{ id: string; ayah?: string }>();
  const router = useRouter();
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(
    new Set()
  );
  const [selectedTafsir, setSelectedTafsir] = useState<Ayah | null>(null);
  const [tafsirModalVisible, setTafsirModalVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadSurahDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
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
      setError(`Gagal memuat surah ${id}. ${errorMessage}`);
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

  // Retry function untuk handle error
  const handleRetry = () => {
    setError(null);
    loadSurahDetail();
    loadBookmarks();
  };

  // Memoized filtered ayahs untuk performa optimal
  const filteredAyahsMemo = useMemo(() => {
    if (!searchQuery.trim()) return ayahs;

    const searchLower = searchQuery.toLowerCase();
    return ayahs.filter((ayah) => {
      return (
        ayah.text.arab.includes(searchQuery) ||
        ayah.translation.id.toLowerCase().includes(searchLower) ||
        ayah.number.inSurah.toString().includes(searchQuery)
      );
    });
  }, [ayahs, searchQuery]);

  // Optimized bookmark toggle
  const toggleBookmarkOptimized = useCallback(
    async (ayahNumber: number) => {
      return PerformanceTracker.measureAsync(
        `Bookmark-Toggle-${ayahNumber}`,
        async () => {
          try {
            const surahNumber = parseInt(id);
            const isBookmarked = bookmarkedAyahs.has(ayahNumber);

            if (isBookmarked) {
              await storageService.removeBookmark(surahNumber, ayahNumber);
              setBookmarkedAyahs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(ayahNumber);
                return newSet;
              });
            } else {
              // Ambil data ayah untuk bookmark
              const ayahData = ayahs.find(
                (a) => a.number.inSurah === ayahNumber
              );
              if (ayahData) {
                const surahName =
                  ayahData.surah?.name?.transliteration?.id ||
                  ayahs[0]?.surah?.name?.transliteration?.id ||
                  `Surah ${id}`;

                await storageService.addBookmark({
                  surahNumber,
                  ayahNumber,
                  surahName,
                  text: ayahData.text.arab,
                  translation: ayahData.translation.id,
                });
                setBookmarkedAyahs((prev) => new Set([...prev, ayahNumber]));
              }
            }

            Alert.alert(
              "Berhasil",
              isBookmarked
                ? "Bookmark berhasil dihapus"
                : "Ayat berhasil dibookmark"
            );
          } catch (error) {
            console.error("Error toggling bookmark:", error);
            Alert.alert("Error", "Gagal mengubah bookmark");
          }
        }
      );
    },
    [id, bookmarkedAyahs, ayahs]
  );

  // Optimized tafsir modal
  const openTafsirOptimized = useCallback((ayahData: Ayah) => {
    setSelectedTafsir(ayahData);
    setTafsirModalVisible(true);
  }, []);

  const playAudio = useCallback(
    async (audioUrl: string, ayahNumber: number) => {
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
    },
    []
  );

  // Update render item untuk menggunakan fungsi yang benar
  const renderAyahItem = useCallback(
    ({ item: ayahData }: { item: Ayah }) => {
      const isBookmarked = bookmarkedAyahs.has(ayahData.number.inSurah);
      const isTarget = ayah && parseInt(ayah) === ayahData.number.inSurah;

      return (
        <AyahCard
          ayahData={ayahData}
          isBookmarked={isBookmarked}
          isTarget={!!isTarget}
          onBookmarkToggle={toggleBookmarkOptimized}
          onTafsirOpen={openTafsirOptimized}
          onPlayAudio={playAudio}
        />
      );
    },
    [
      bookmarkedAyahs,
      ayah,
      toggleBookmarkOptimized,
      openTafsirOptimized,
      playAudio,
    ]
  );

  // Header component untuk FlatList
  const ListHeaderComponent = useCallback(
    () => (
      <View>
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

        {/* Search result info */}
        {searchQuery.length > 0 && filteredAyahsMemo.length === 0 && (
          <View className="bg-white mx-4 mt-4 p-6 rounded-lg border border-gray-200">
            <Text className="text-center text-gray-500">
              Tidak ada ayat yang ditemukan untuk &quot;{searchQuery}&quot;
            </Text>
            <Text className="text-center text-gray-400 text-sm mt-2">
              Coba kata kunci lain atau nomor ayat
            </Text>
          </View>
        )}
      </View>
    ),
    [id, searchQuery, filteredAyahsMemo.length]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearch(false);
  };

  // Error Screen
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white rounded-lg p-6 mx-4 border border-red-200">
            <View className="items-center mb-4">
              <Ionicons name="alert-circle" size={64} color="#ef4444" />
            </View>

            <Text className="text-center text-xl font-bold text-gray-800 mb-2">
              Terjadi Kesalahan
            </Text>

            <Text className="text-center text-gray-600 mb-6 leading-relaxed">
              {error}
            </Text>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleRetry}
                className="bg-purple-600 py-3 px-6 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-center text-white font-semibold">
                  Coba Lagi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBackButton}
                className="bg-gray-200 py-3 px-6 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-center text-gray-700 font-medium">
                  Kembali ke Daftar Surah
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
                Ditemukan {filteredAyahsMemo.length} ayat dari {ayahs.length}{" "}
                ayat
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

      {/* Konten Surah dengan FlatList untuk performa optimal */}
      <FlatList
        ref={flatListRef}
        data={filteredAyahsMemo}
        renderItem={renderAyahItem}
        ListHeaderComponent={ListHeaderComponent}
        keyExtractor={(item) => `ayah-${item.number.inSurah}`}
        getItemLayout={(data, index) => ({
          length: 200,
          offset: 200 * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        onScrollToIndexFailed={(info) => {
          console.warn("Scroll to index failed:", info);
          // Fallback scroll
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: info.index * 200,
              animated: true,
            });
          }, 100);
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        contentInsetAdjustmentBehavior="automatic"
      />

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
