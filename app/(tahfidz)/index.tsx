import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { storageService } from "../../services/storage";
import { apiService } from "../../services/api";
import { TahfidzTarget, Surah } from "../../types/api";

export default function TahfidzPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<TahfidzTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSurahList, setShowSurahList] = useState(false);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(false);

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const data = await storageService.getTahfidzTargets();
      setTargets(data);
    } catch (error) {
      console.error("Error loading targets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSurahs = async () => {
    try {
      setLoadingSurahs(true);
      const response = await apiService.getAllSurah();
      setSurahs(response.data);
      setShowSurahList(true);
    } catch (error) {
      console.error("Error loading surahs:", error);
      Alert.alert(
        "Error",
        "Gagal memuat daftar surah. Pastikan koneksi internet Anda stabil."
      );
    } finally {
      setLoadingSurahs(false);
    }
  };

  const createNewTarget = async (surah: Surah) => {
    try {
      // Check if target already exists
      const existingTarget = targets.find(
        (t) => t.surahNumber === surah.number
      );
      if (existingTarget) {
        Alert.alert("Info", "Target untuk surah ini sudah ada.");
        return;
      }

      await storageService.addTahfidzTarget({
        surahNumber: surah.number,
        surahName: surah.name.transliteration.id,
        totalVerses: surah.numberOfVerses,
        completedVerses: [],
      });

      await loadTargets();
      setShowSurahList(false);
      Alert.alert(
        "Sukses",
        `Target tahfidz untuk ${surah.name.transliteration.id} berhasil dibuat!`
      );
    } catch (error) {
      console.error("Error creating target:", error);
      Alert.alert("Error", "Gagal membuat target baru.");
    }
  };

  const deleteTarget = async (targetId: string) => {
    Alert.alert("Konfirmasi", "Apakah Anda yakin ingin menghapus target ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await storageService.deleteTahfidzTarget(targetId);
            await loadTargets();
          } catch (error) {
            console.error("Error deleting target:", error);
            Alert.alert("Error", "Gagal menghapus target.");
          }
        },
      },
    ]);
  };

  const navigateToTargetDetail = (target: TahfidzTarget) => {
    router.push(`/(tahfidz)/detail/${target.id}`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Memuat target tahfidz...</Text>
      </View>
    );
  }

  if (showSurahList) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-blue-600 px-6 py-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => setShowSurahList(false)}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Pilih Surah</Text>
        </View>

        {loadingSurahs ? (
          <SafeAreaView className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-4 text-gray-600">Memuat daftar surah...</Text>
          </SafeAreaView>
        ) : (
          <ScrollView className="flex-1">
            <View className="px-4 py-4">
              {surahs.map((surah) => (
                <TouchableOpacity
                  key={surah.number}
                  onPress={() => createNewTarget(surah)}
                  className="bg-white rounded-lg mb-3 p-4 shadow-sm border border-gray-200"
                >
                  <View className="flex-row items-center">
                    <View className="bg-blue-600 rounded-full w-10 h-10 justify-center items-center mr-4">
                      <Text className="text-white font-bold text-sm">
                        {surah.number}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-gray-900 font-semibold text-base">
                          {surah.name.transliteration.id}
                        </Text>
                        <Text className="text-blue-700 text-lg font-arabic">
                          {surah.name.short}
                        </Text>
                      </View>

                      <Text className="text-gray-600 text-sm mb-1">
                        {surah.name.translation.id}
                      </Text>

                      <Text className="text-gray-500 text-xs">
                        {surah.numberOfVerses} Ayat • {surah.revelation.id}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header dengan Back Button */}
      <View className="bg-blue-600 px-6 py-4">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">Target Tahfidz</Text>
          </View>
        </View>
        <Text className="text-blue-100 text-sm ml-10">
          Lacak progres hafalan Al-Qur&apos;an Anda
        </Text>
      </View>

      <ScrollView className="flex-1">
        {targets.length === 0 ? (
          // Empty State
          <View className="flex-1 justify-center items-center px-6 py-20">
            <View className="bg-blue-100 p-6 rounded-full mb-6">
              <Ionicons name="checkmark-circle" size={48} color="#2563eb" />
            </View>
            <Text className="text-gray-900 text-xl font-bold mb-2 text-center">
              Belum Ada Target
            </Text>
            <Text className="text-gray-600 text-center mb-8 leading-6">
              Mulai perjalanan tahfidz Anda dengan membuat target hafalan
              pertama
            </Text>
            <TouchableOpacity
              onPress={loadSurahs}
              className="bg-blue-600 px-8 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold text-base">
                Buat Target Baru
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Target List
          <View className="px-4 py-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-900 text-lg font-semibold">
                Target Aktif ({targets.length})
              </Text>
              <TouchableOpacity
                onPress={loadSurahs}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold text-sm">
                  Tambah Target
                </Text>
              </TouchableOpacity>
            </View>

            {targets.map((target) => (
              <TouchableOpacity
                key={target.id}
                onPress={() => navigateToTargetDetail(target)}
                className="bg-white rounded-lg mb-4 p-4 shadow-sm border border-gray-200"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-lg mb-1">
                      {target.surahName}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {target.completedVerses.length}/{target.totalVerses} Ayat
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteTarget(target.id)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View className="mb-3">
                  <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <View
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${target.progress}%` }}
                    />
                  </View>
                  <Text className="text-gray-600 text-xs mt-1 text-center">
                    {target.progress.toFixed(1)}% Selesai
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 text-xs">
                    Dibuat: {target.createdAt.toLocaleDateString("id-ID")}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
