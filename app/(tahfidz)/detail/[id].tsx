import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { storageService } from "../../../services/storage";
import { apiService } from "../../../services/api";
import { TahfidzTarget, Ayah } from "../../../types/api";

export default function TahfidzDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [target, setTarget] = useState<TahfidzTarget | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTargetDetail = useCallback(async () => {
    try {
      setLoading(true);
      const targets = await storageService.getTahfidzTargets();
      const foundTarget = targets.find((t) => t.id === id);

      if (!foundTarget) {
        Alert.alert("Error", "Target tidak ditemukan.");
        router.back();
        return;
      }

      setTarget(foundTarget);

      // Load ayahs for the target surah
      const response = await apiService.getSurahDetail(foundTarget.surahNumber);
      setAyahs(response.data);
    } catch (error) {
      console.error("Error loading target detail:", error);
      Alert.alert("Error", "Gagal memuat detail target.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      loadTargetDetail();
    }
  }, [id, loadTargetDetail]);

  const toggleAyahCompletion = async (ayahNumber: number) => {
    if (!target) return;

    try {
      const newCompletedVerses = target.completedVerses.includes(ayahNumber)
        ? target.completedVerses.filter((num) => num !== ayahNumber)
        : [...target.completedVerses, ayahNumber].sort((a, b) => a - b);

      await storageService.updateTahfidzProgress(target.id, newCompletedVerses);

      // Update local state
      const updatedTarget = {
        ...target,
        completedVerses: newCompletedVerses,
        progress: (newCompletedVerses.length / target.totalVerses) * 100,
      };
      setTarget(updatedTarget);
    } catch (error) {
      console.error("Error updating progress:", error);
      Alert.alert("Error", "Gagal mengupdate progres.");
    }
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="mt-4 text-gray-600">Memuat detail target...</Text>
      </SafeAreaView>
    );
  }

  if (!target) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Target tidak ditemukan</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-purple-600 px-6 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-2"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text className="text-white ml-2">Kembali</Text>
        </TouchableOpacity>

        <Text className="text-white text-xl font-bold">
          Target Hafalan: {target.surahName}
        </Text>
        <Text className="text-purple-200 text-sm">
          {target.surahName} • {target.totalVerses} Ayat
        </Text>
      </View>

      {/* Progress Section */}
      <View className="bg-white mx-4 mt-4 p-6 rounded-lg border border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-900 text-lg font-semibold">
            Progres Hafalan
          </Text>
          <Text className="text-purple-600 font-bold">
            {Math.round(target.progress)}%
          </Text>
        </View>

        <View className="bg-gray-200 h-2 rounded-full mb-2">
          <View
            className="bg-purple-600 h-2 rounded-full"
            style={{ width: `${target.progress}%` }}
          />
        </View>

        <Text className="text-gray-600 text-sm">
          {target.completedVerses.length} dari {target.totalVerses} ayat selesai
        </Text>
      </View>

      {/* Ayahs List */}
      <ScrollView className="flex-1">
        <View className="px-4 py-4">
          <Text className="text-gray-900 text-lg font-semibold mb-4">
            Daftar Ayat
          </Text>

          {ayahs.map((ayahData) => {
            const isCompleted = target.completedVerses.includes(
              ayahData.number.inSurah
            );

            return (
              <View
                key={ayahData.number.inSurah}
                className={`rounded-lg mb-4 p-4 border ${
                  isCompleted
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200"
                }`}
              >
                {/* Ayah Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View
                      className={`px-3 py-1 rounded-full ${
                        isCompleted ? "bg-green-600" : "bg-purple-600"
                      }`}
                    >
                      <Text className="text-white text-sm font-bold">
                        {ayahData.number.inSurah}
                      </Text>
                    </View>

                    {isCompleted && (
                      <View className="ml-2 bg-green-600 p-1 rounded-full">
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
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
                      className="bg-blue-600 p-2 rounded-lg"
                    >
                      <Ionicons name="play" size={20} color="white" />
                    </TouchableOpacity>

                    {/* Complete/Incomplete Button */}
                    <TouchableOpacity
                      onPress={() =>
                        toggleAyahCompletion(ayahData.number.inSurah)
                      }
                      className={`p-2 rounded-lg ${
                        isCompleted ? "bg-green-600" : "bg-gray-600"
                      }`}
                    >
                      <Ionicons
                        name={
                          isCompleted
                            ? "checkmark-circle"
                            : "checkmark-circle-outline"
                        }
                        size={20}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Arabic Text */}
                <Text className="text-xl text-right text-gray-900 font-arabic leading-loose mb-4">
                  {ayahData.text.arab}
                </Text>

                {/* Transliteration */}
                <Text className="text-gray-700 italic text-sm leading-relaxed mb-2">
                  {ayahData.text.transliteration.en}
                </Text>

                {/* Translation */}
                <Text className="text-gray-800 text-sm leading-relaxed">
                  {ayahData.translation.id}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
