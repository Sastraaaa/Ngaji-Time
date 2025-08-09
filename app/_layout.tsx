import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { cacheService } from "../services/cache";
import { colors } from "../constants/colors";
import "./global.css";

export default function RootLayout() {
  useEffect(() => {
    // Initialize offline capabilities on app startup
    const initializeOfflineFeatures = async () => {
      try {
        console.log("Initializing offline features...");
        // Preload essential surahs in background
        cacheService.preloadEssentialSurahs();
      } catch (error) {
        console.error("Error initializing offline features:", error);
      }
    };

    initializeOfflineFeatures();
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary[600],
          },
          headerTintColor: colors.text.light,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: colors.neutral[900],
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.neutral[400],
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Beranda",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mushaf"
          options={{
            title: "Mushaf",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorit"
          options={{
            title: "Favorit",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Pengaturan",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />

        {/* Hidden Routes - tidak akan muncul di tabs */}
        <Tabs.Screen
          name="(mushaf)"
          options={{
            href: null, // Hide from tabs
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="(peta)"
          options={{
            href: null, // Hide from tabs
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="(tahfidz)"
          options={{
            href: null, // Hide from tabs
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="peta"
          options={{
            href: null, // Hide from tabs
            headerShown: false,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
