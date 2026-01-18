import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="intro" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="frequency" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}