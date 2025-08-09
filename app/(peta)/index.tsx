import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

interface Mosque {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export default function PetaPage() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);

  const loadNearbyMosques = async (latitude: number, longitude: number) => {
    try {
      // TODO: Ganti dengan API Key Google Places yang valid
      // Untuk sementara menggunakan data dummy

      // CATATAN: Anda perlu menambahkan Google Places API Key
      // const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';
      // const radius = 5000; // 5km
      // const type = 'mosque';

      // const response = await fetch(
      //   `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`
      // );

      // const data = await response.json();

      // Dummy data untuk contoh
      const dummyMosques: Mosque[] = [
        {
          id: "1",
          name: "Masjid Istiqlal",
          address: "Jl. Taman Wijaya Kusuma, Pasar Baru, Jakarta Pusat",
          latitude: latitude + 0.005,
          longitude: longitude + 0.003,
          distance: 0.8,
        },
        {
          id: "2",
          name: "Masjid Al-Azhar",
          address: "Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan",
          latitude: latitude - 0.003,
          longitude: longitude + 0.005,
          distance: 1.2,
        },
        {
          id: "3",
          name: "Masjid Agung",
          address: "Jl. Medan Merdeka Timur, Gambir, Jakarta Pusat",
          latitude: latitude + 0.002,
          longitude: longitude - 0.004,
          distance: 0.6,
        },
        {
          id: "4",
          name: "Masjid An-Nur",
          address: "Jl. Pramuka Raya, Matraman, Jakarta Timur",
          latitude: latitude - 0.006,
          longitude: longitude - 0.002,
          distance: 2.1,
        },
      ];

      setMosques(dummyMosques);
    } catch (error) {
      console.error("Error loading mosques:", error);
      Alert.alert("Error", "Gagal memuat data masjid terdekat.");
    } finally {
      setLoading(false);
    }
  };

  const getLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin Lokasi Diperlukan",
          "Aplikasi memerlukan akses lokasi untuk menampilkan masjid terdekat.",
          [
            { text: "Batal", style: "cancel" },
            { text: "Buka Pengaturan", onPress: () => Linking.openSettings() },
          ]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Load nearby mosques
      await loadNearbyMosques(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Gagal mendapatkan lokasi. Silakan coba lagi.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getLocationPermission();
  }, [getLocationPermission]);

  const openDirections = (mosque: Mosque) => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${mosque.latitude},${mosque.longitude}`;
    const label = mosque.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const refreshLocation = () => {
    setLoading(true);
    getLocationPermission();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className="mt-4 text-gray-600">Mencari masjid terdekat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Custom Header dengan Back Button */}
      <View className="bg-orange-600 px-6 py-6">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Peta Masjid</Text>
          </View>
          <TouchableOpacity
            onPress={refreshLocation}
            className="bg-orange-700 p-3 rounded-lg"
          >
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-orange-100 text-base ml-10">
          {mosques.length} masjid ditemukan
        </Text>
      </View>

      {/* Location Info */}
      {location && (
        <View className="bg-orange-50 px-6 py-3 border-b border-orange-200">
          <Text className="text-purple-800 text-sm">
            📍 Lokasi Anda: {location.coords.latitude.toFixed(4)},{" "}
            {location.coords.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      {/* Note */}
      <View className="bg-blue-50 px-6 py-3 border-b border-blue-200">
        <Text className="text-blue-800 text-sm text-center">
          🗺️ Fitur peta akan tersedia setelah konfigurasi Google Maps API
        </Text>
      </View>

      {/* Mosque List */}
      <ScrollView className="flex-1">
        <View className="px-4 py-4">
          <Text className="text-gray-900 text-lg font-semibold mb-4">
            Masjid Terdekat
          </Text>

          {mosques.map((mosque) => (
            <TouchableOpacity
              key={mosque.id}
              onPress={() => setSelectedMosque(mosque)}
              className={`rounded-lg mb-4 p-4 border ${
                selectedMosque?.id === mosque.id
                  ? "bg-purple-50 border-purple-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-green-600 p-2 rounded-full mr-3">
                      <Ionicons name="business" size={16} color="white" />
                    </View>
                    <Text className="text-gray-900 font-bold text-lg flex-1">
                      {mosque.name}
                    </Text>
                  </View>

                  <Text className="text-gray-600 text-sm mb-2 ml-11">
                    {mosque.address}
                  </Text>

                  {mosque.distance && (
                    <Text className="text-purple-600 text-sm font-semibold ml-11">
                      📏 {mosque.distance} km dari Anda
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => openDirections(mosque)}
                  className="bg-purple-600 p-3 rounded-lg ml-3"
                >
                  <Ionicons name="navigate" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Note about API Key */}
      <View className="bg-yellow-50 px-4 py-3 border-t border-yellow-200">
        <Text className="text-yellow-800 text-xs text-center">
          ⚠️ CATATAN: Untuk data masjid real-time dan peta interaktif, tambahkan
          Google Places API Key
        </Text>
      </View>
    </SafeAreaView>
  );
}
