import { Stack } from "expo-router";

export default function TahfidzLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="detail/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
