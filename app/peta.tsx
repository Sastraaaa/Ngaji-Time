import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function PetaPage() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-purple-600 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">
              Peta & Arah Kiblat
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="compass" size={64} color="#7c3aed" />
        <Text className="text-gray-800 text-xl font-bold mt-4 text-center">
          Fitur Peta & Kiblat
        </Text>
        <Text className="text-gray-600 text-center mt-2 leading-6">
          Fitur ini akan menampilkan peta dan arah kiblat untuk membantu Anda
          dalam menentukan arah shalat.
        </Text>
        <Text className="text-gray-500 text-sm text-center mt-4">
          Segera hadir dalam update berikutnya
        </Text>
      </View>
    </SafeAreaView>
  );
}
