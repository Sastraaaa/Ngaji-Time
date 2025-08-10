import React, {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "../services/api";
import { Surah } from "../types/api";
import { PerformanceTracker } from "../utils/performance";

// Memoized SurahCard component untuk prevent unnecessary re-renders
const SurahCard = memo(
  ({ surah, onPress }: { surah: Surah; onPress: (surah: Surah) => void }) => {
    const handlePress = useCallback(() => {
      onPress(surah);
    }, [surah, onPress]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-2xl text-right mb-2 text-gray-800 font-medium">
              {surah.name.short}
            </Text>
            <Text className="text-lg font-bold text-gray-900 mb-1">
              {surah.name.transliteration.id}
            </Text>
            <Text className="text-gray-600 mb-2">
              {surah.name.translation.id}
            </Text>
            <View className="flex-row items-center">
              <View className="bg-blue-50 px-2 py-1 rounded-full mr-2">
                <Text className="text-blue-600 text-xs font-medium">
                  {surah.numberOfVerses} ayat
                </Text>
              </View>
              <View className="bg-green-50 px-2 py-1 rounded-full">
                <Text className="text-green-600 text-xs font-medium capitalize">
                  {surah.revelation.id}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-center justify-center w-12 h-12 bg-blue-100 rounded-full ml-3">
            <Text className="text-blue-600 font-bold text-sm">
              {surah.number}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison untuk optimize re-renders
    return prevProps.surah.number === nextProps.surah.number;
  }
);

SurahCard.displayName = "SurahCard";

export default function MushafIndex() {
  const router = useRouter();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadSurahs();
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

  const loadSurahs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllSurah();
      setSurahs(response.data);

      // Check if data came from cache
      if (response.message.includes("cache")) {
        setIsOffline(true);
      }
    } catch (error) {
      console.error("Error loading surahs:", error);
      Alert.alert(
        "Error",
        "Gagal memuat daftar surah. Pastikan koneksi internet Anda stabil."
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter surahs based on search query
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahs;

    const query = searchQuery.toLowerCase();
    return surahs.filter(
      (surah) =>
        surah.name.transliteration.id.toLowerCase().includes(query) ||
        surah.name.translation.id.toLowerCase().includes(query) ||
        surah.number.toString().includes(query)
    );
  }, [surahs, searchQuery]);

  // Optimized navigation dengan performance tracking
  const navigateToSurah = useCallback(
    (surah: Surah) => {
      PerformanceTracker.startTimer(`Navigate-Surah-${surah.number}`);
      router.replace(`/(mushaf)/surah/${surah.number}` as any);
    },
    [router]
  );

  // Optimized render item menggunakan SurahCard
  const renderSurahItem = useCallback(
    ({ item: surah }: { item: Surah }) => (
      <SurahCard surah={surah} onPress={navigateToSurah} />
    ),
    [navigateToSurah]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-gray-600">Memuat daftar surah...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Modern Header */}
      <View className="bg-green-600 relative overflow-hidden">
        <View className="absolute inset-0 bg-green-700 opacity-20" />
        <View className="px-6 py-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold mb-2">
                Mushaf Al-Qur&apos;an
              </Text>
              <Text className="text-green-100 text-base opacity-90">
                {filteredSurahs.length} dari {surahs.length} surah
                {isOffline && (
                  <Text className="text-green-200 text-sm"> • Offline</Text>
                )}
              </Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <Ionicons name="book" size={24} color="white" />
            </View>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View className="bg-white mx-4 mt-4 mb-2 rounded-lg border border-gray-200">
        <View className="flex-row items-center px-4 py-3">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-900 text-base"
            placeholder="Cari surah berdasarkan nama atau nomor..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Info */}
      <View className="px-4 mb-2">
        <Text className="text-gray-600 text-sm">
          {searchQuery.trim()
            ? `${filteredSurahs.length} surah ditemukan`
            : `${surahs.length} surah tersedia`}
        </Text>
      </View>

      {/* Surah List dengan FlatList yang dioptimasi untuk performa */}
      <FlatList
        data={filteredSurahs}
        renderItem={renderSurahItem}
        keyExtractor={(item: Surah) => item.number.toString()}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        getItemLayout={(data, index) => ({
          length: 120, // estimated item height
          offset: 120 * index,
          index,
        })}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="search" size={48} color="#6b7280" />
            <Text className="text-gray-600 text-center mt-4 text-base">
              Tidak ada surah yang ditemukan
            </Text>
            <Text className="text-gray-500 text-center mt-2 text-sm">
              Coba ubah kata kunci pencarian
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
