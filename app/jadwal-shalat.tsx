import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { shalatService, JadwalShalat } from "../services/shalat";

export default function JadwalShalatPage() {
  const router = useRouter();
  const [jadwal, setJadwal] = useState<JadwalShalat | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lokasi, setLokasi] = useState<string>("");
  const [nextShalat, setNextShalat] = useState<{
    name: string;
    time: string;
  } | null>(null);

  const loadShalatSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const response = await shalatService.getShalatScheduleFromLocation();

      if (response && response.status) {
        const schedule = Array.isArray(response.data.jadwal)
          ? response.data.jadwal[0]
          : response.data.jadwal;

        setJadwal(schedule);
        setLokasi(response.data.lokasi);

        // Hitung waktu shalat berikutnya
        const next = shalatService.getNextShalatTime(schedule);
        setNextShalat(next);
      } else {
        throw new Error("Gagal mengambil jadwal shalat");
      }
    } catch (error) {
      console.error("Error loading shalat schedule:", error);
      Alert.alert(
        "Error",
        "Gagal memuat jadwal shalat. Pastikan GPS aktif dan koneksi internet tersedia.",
        [
          { text: "Coba Lagi", onPress: loadShalatSchedule },
          { text: "Batal", style: "cancel" },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShalatSchedule();
    setRefreshing(false);
  }, [loadShalatSchedule]);

  useEffect(() => {
    loadShalatSchedule();
  }, [loadShalatSchedule]);

  const formatTimeDisplay = (time: string) => {
    return time.replace(":", ".");
  };

  const getShalatIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "subuh":
        return "sunny-outline";
      case "dzuhur":
        return "sunny";
      case "ashar":
        return "partly-sunny";
      case "maghrib":
        return "cloudy-night-outline";
      case "isya":
        return "moon";
      default:
        return "time";
    }
  };

  const ShalatTimeItem = ({
    name,
    time,
    isNext = false,
  }: {
    name: string;
    time: string;
    isNext?: boolean;
  }) => (
    <View
      className={`flex-row items-center justify-between p-4 rounded-lg mb-3 ${
        isNext
          ? "bg-green-50 border border-green-200"
          : "bg-white border border-gray-100"
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View
          className={`p-3 rounded-full mr-4 ${
            isNext ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          <Ionicons
            name={getShalatIcon(name)}
            size={24}
            color={isNext ? "#059669" : "#6B7280"}
          />
        </View>
        <View>
          <Text
            className={`font-semibold text-lg ${
              isNext ? "text-green-900" : "text-gray-900"
            }`}
          >
            {name}
          </Text>
          {isNext && (
            <Text className="text-green-600 text-sm font-medium">
              Shalat Berikutnya
            </Text>
          )}
        </View>
      </View>
      <Text
        className={`font-bold text-2xl ${
          isNext ? "text-green-800" : "text-gray-700"
        }`}
      >
        {formatTimeDisplay(time)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-green-600 px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Jadwal Shalat</Text>
          </View>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-4 text-gray-600">Memuat jadwal shalat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!jadwal) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-green-600 px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Jadwal Shalat</Text>
          </View>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-100 p-6 rounded-full mb-6">
            <Ionicons name="warning" size={48} color="#DC2626" />
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-2 text-center">
            Gagal Memuat Jadwal
          </Text>
          <Text className="text-gray-600 text-center mb-8 leading-6">
            Tidak dapat mengambil jadwal shalat. Pastikan GPS aktif dan koneksi
            internet tersedia.
          </Text>
          <TouchableOpacity
            onPress={loadShalatSchedule}
            className="bg-green-600 px-8 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold text-base">
              Coba Lagi
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 px-6 py-4">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">Jadwal Shalat</Text>
          </View>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-green-100 text-sm ml-10">{lokasi}</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tanggal */}
        <View className="bg-white mx-4 mt-4 p-4 rounded-lg border border-gray-100">
          <Text className="text-center text-gray-700 font-medium text-lg">
            {jadwal.tanggal}
          </Text>
        </View>

        {/* Waktu Shalat */}
        <View className="mx-4 mt-4">
          <ShalatTimeItem
            name="Subuh"
            time={jadwal.subuh}
            isNext={nextShalat?.name === "Subuh"}
          />
          <ShalatTimeItem
            name="Dzuhur"
            time={jadwal.dzuhur}
            isNext={nextShalat?.name === "Dzuhur"}
          />
          <ShalatTimeItem
            name="Ashar"
            time={jadwal.ashar}
            isNext={nextShalat?.name === "Ashar"}
          />
          <ShalatTimeItem
            name="Maghrib"
            time={jadwal.maghrib}
            isNext={nextShalat?.name === "Maghrib"}
          />
          <ShalatTimeItem
            name="Isya"
            time={jadwal.isya}
            isNext={nextShalat?.name === "Isya"}
          />
        </View>

        {/* Waktu Tambahan */}
        <View className="mx-4 mt-6 mb-4">
          <Text className="text-gray-700 font-semibold text-lg mb-3">
            Waktu Tambahan
          </Text>

          <View className="bg-white rounded-lg border border-gray-100">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-50">
              <View className="flex-row items-center">
                <Ionicons name="moon-outline" size={20} color="#6B7280" />
                <Text className="ml-3 text-gray-700 font-medium">Imsak</Text>
              </View>
              <Text className="text-gray-600 font-semibold">
                {formatTimeDisplay(jadwal.imsak)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center p-4 border-b border-gray-50">
              <View className="flex-row items-center">
                <Ionicons name="sunny-outline" size={20} color="#6B7280" />
                <Text className="ml-3 text-gray-700 font-medium">Terbit</Text>
              </View>
              <Text className="text-gray-600 font-semibold">
                {formatTimeDisplay(jadwal.terbit)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="partly-sunny-outline"
                  size={20}
                  color="#6B7280"
                />
                <Text className="ml-3 text-gray-700 font-medium">Dhuha</Text>
              </View>
              <Text className="text-gray-600 font-semibold">
                {formatTimeDisplay(jadwal.dhuha)}
              </Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View className="mx-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#2563EB" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-900 font-medium text-sm mb-1">
                Informasi
              </Text>
              <Text className="text-blue-700 text-sm leading-5">
                Jadwal shalat berdasarkan lokasi GPS Anda. Tarik ke bawah untuk
                memperbarui jadwal.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
