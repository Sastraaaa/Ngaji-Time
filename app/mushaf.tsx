import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "../services/api";
import { Surah } from "../types/api";

export default function MushafIndex() {
  const router = useRouter();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadSurahs();
  }, []);

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

  const navigateToSurah = (surahNumber: number) => {
    router.push(`/(mushaf)/surah/${surahNumber}` as any);
  };

  const renderSurahItem = ({ item: surah }: { item: Surah }) => (
    <TouchableOpacity
      onPress={() => navigateToSurah(surah.number)}
      className="bg-white rounded-lg mb-3 p-4 shadow-sm border border-gray-200"
    >
      <View className="flex-row items-center">
        {/* Nomor Surah */}
        <View className="bg-green-600 rounded-full w-10 h-10 justify-center items-center mr-4">
          <Text className="text-white font-bold text-sm">{surah.number}</Text>
        </View>

        {/* Info Surah */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-gray-900 font-semibold text-base">
              {surah.name.transliteration.id}
            </Text>
            <Text className="text-green-700 text-lg font-arabic">
              {surah.name.short}
            </Text>
          </View>

          <Text className="text-gray-600 text-sm mb-1">
            {surah.name.translation.id}
          </Text>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-500 text-xs">
              {surah.numberOfVerses} Ayat • {surah.revelation.id}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#6b7280" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
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

      {/* Surah List */}
      <FlatList
        data={filteredSurahs}
        renderItem={renderSurahItem}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
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
