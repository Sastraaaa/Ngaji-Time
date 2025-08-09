import { Stack } from "expo-router";

export default function MushafLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="surah/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
