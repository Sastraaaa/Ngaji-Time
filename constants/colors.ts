// Color palette untuk NgajiTime App
export const colors = {
  // Primary Colors (Green Theme - Islamic)
  primary: {
    50: "#f0fdf4", // green-50
    100: "#dcfce7", // green-100
    200: "#bbf7d0", // green-200
    300: "#86efac", // green-300
    400: "#4ade80", // green-400
    500: "#22c55e", // green-500
    600: "#059669", // green-600 (main primary)
    700: "#047857", // green-700
    800: "#065f46", // green-800
    900: "#064e3b", // green-900
  },

  // Secondary Colors (Blue for variety)
  secondary: {
    50: "#eff6ff", // blue-50
    100: "#dbeafe", // blue-100
    200: "#bfdbfe", // blue-200
    300: "#93c5fd", // blue-300
    400: "#60a5fa", // blue-400
    500: "#3b82f6", // blue-500
    600: "#2563eb", // blue-600
    700: "#1d4ed8", // blue-700
    800: "#1e40af", // blue-800
    900: "#1e3a8a", // blue-900
  },

  // Accent Colors (Orange for highlights)
  accent: {
    50: "#fff7ed", // orange-50
    100: "#ffedd5", // orange-100
    200: "#fed7aa", // orange-200
    300: "#fdba74", // orange-300
    400: "#fb923c", // orange-400
    500: "#f97316", // orange-500
    600: "#ea580c", // orange-600
    700: "#c2410c", // orange-700
    800: "#9a3412", // orange-800
    900: "#7c2d12", // orange-900
  },

  // Neutral Colors (Gray scale)
  neutral: {
    50: "#f9fafb", // gray-50
    100: "#f3f4f6", // gray-100
    200: "#e5e7eb", // gray-200
    300: "#d1d5db", // gray-300
    400: "#9ca3af", // gray-400
    500: "#6b7280", // gray-500
    600: "#4b5563", // gray-600
    700: "#374151", // gray-700
    800: "#1f2937", // gray-800
    900: "#111827", // gray-900
  },

  // Semantic Colors
  success: {
    50: "#f0fdf4",
    500: "#22c55e",
    600: "#059669",
    700: "#047857",
  },

  warning: {
    50: "#fffbeb",
    500: "#f59e0b",
    600: "#d97706",
  },

  error: {
    50: "#fef2f2",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
  },

  info: {
    50: "#eff6ff",
    500: "#3b82f6",
    600: "#2563eb",
  },

  // Common usage shortcuts
  background: "#f9fafb", // neutral-50
  surface: "#ffffff", // white
  text: {
    primary: "#111827", // neutral-900
    secondary: "#6b7280", // neutral-500
    tertiary: "#9ca3af", // neutral-400
    light: "#ffffff", // white
  },
  border: {
    light: "#e5e7eb", // neutral-200
    default: "#d1d5db", // neutral-300
    dark: "#9ca3af", // neutral-400
  },
};

// NativeWind class helpers for consistency
export const tw = {
  // Background colors
  bg: {
    primary: "bg-green-600",
    primaryLight: "bg-green-50",
    secondary: "bg-blue-600",
    surface: "bg-white",
    muted: "bg-gray-50",
  },

  // Text colors
  text: {
    primary: "text-gray-900",
    secondary: "text-gray-600",
    tertiary: "text-gray-400",
    light: "text-white",
    success: "text-green-600",
    error: "text-red-600",
  },

  // Border colors
  border: {
    light: "border-gray-200",
    default: "border-gray-300",
    primary: "border-green-600",
  },

  // Component styles
  card: "bg-white rounded-lg shadow-sm border border-gray-200",
  cardPrimary: "bg-green-50 rounded-lg border border-green-200",
  button: {
    primary: "bg-green-600 rounded-lg px-4 py-3",
    secondary: "bg-gray-100 rounded-lg px-4 py-3",
    outline: "border border-green-600 rounded-lg px-4 py-3",
  },

  // Status colors
  status: {
    online: "text-green-600",
    offline: "text-gray-500",
    cached: "text-blue-600",
  },
};
