import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shalatService, JadwalShalat } from "../services/shalat";

interface ShalatCardProps {
  onPress?: () => void;
}

const ShalatCard: React.FC<ShalatCardProps> = ({ onPress }) => {
  const [jadwal, setJadwal] = useState<JadwalShalat | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadShalatSchedule();
  }, [loadShalatSchedule]);

  const formatTimeDisplay = (time: string) => {
    return time.replace(":", ".");
  };

  if (loading) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="bg-white rounded-xl p-4 mx-4 mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="bg-green-100 p-2 rounded-lg mr-3">
              <Ionicons name="time" size={20} color="#059669" />
            </View>
            <Text className="text-gray-900 font-semibold text-base">
              Jadwal Shalat
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </View>

        <View className="flex-row items-center justify-center py-4">
          <ActivityIndicator size="small" color="#059669" />
          <Text className="ml-2 text-gray-600 text-sm">Memuat jadwal...</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!jadwal) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="bg-white rounded-xl p-4 mx-4 mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="bg-red-100 p-2 rounded-lg mr-3">
              <Ionicons name="warning" size={20} color="#DC2626" />
            </View>
            <Text className="text-gray-900 font-semibold text-base">
              Jadwal Shalat
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </View>

        <Text className="text-gray-600 text-sm text-center py-2">
          Gagal memuat jadwal shalat
        </Text>
        <TouchableOpacity
          onPress={loadShalatSchedule}
          className="bg-green-600 py-2 px-4 rounded-lg mt-2"
        >
          <Text className="text-white text-center text-sm font-medium">
            Coba Lagi
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mx-4 mb-4 shadow-sm border border-gray-100"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="bg-green-100 p-2 rounded-lg mr-3">
            <Ionicons name="time" size={20} color="#059669" />
          </View>
          <View>
            <Text className="text-gray-900 font-semibold text-base">
              Jadwal Shalat
            </Text>
            <Text className="text-gray-500 text-xs">{lokasi}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </View>

      {/* Waktu Shalat Berikutnya */}
      {nextShalat && (
        <View className="bg-green-50 rounded-lg p-3 mb-3">
          <Text className="text-green-700 text-xs font-medium mb-1">
            Shalat Berikutnya
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-green-900 font-bold text-lg">
              {nextShalat.name}
            </Text>
            <Text className="text-green-800 font-bold text-xl">
              {formatTimeDisplay(nextShalat.time)}
            </Text>
          </View>
        </View>
      )}

      {/* Jadwal Hari Ini (Ringkas) */}
      <View className="flex-row justify-between">
        <View className="items-center flex-1">
          <Text className="text-gray-500 text-xs">Subuh</Text>
          <Text className="text-gray-900 font-semibold text-sm">
            {formatTimeDisplay(jadwal.subuh)}
          </Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-gray-500 text-xs">Dzuhur</Text>
          <Text className="text-gray-900 font-semibold text-sm">
            {formatTimeDisplay(jadwal.dzuhur)}
          </Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-gray-500 text-xs">Ashar</Text>
          <Text className="text-gray-900 font-semibold text-sm">
            {formatTimeDisplay(jadwal.ashar)}
          </Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-gray-500 text-xs">Maghrib</Text>
          <Text className="text-gray-900 font-semibold text-sm">
            {formatTimeDisplay(jadwal.maghrib)}
          </Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-gray-500 text-xs">Isya</Text>
          <Text className="text-gray-900 font-semibold text-sm">
            {formatTimeDisplay(jadwal.isya)}
          </Text>
        </View>
      </View>

      {/* Tanggal */}
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-gray-500 text-xs text-center">
          {jadwal.tanggal}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ShalatCard;
