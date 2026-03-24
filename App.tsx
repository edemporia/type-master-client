import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DatabaseProvider, useDatabase } from './src/hooks/useDatabase';
import type { RootStackParamList, TabParamList } from './src/types';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CampaignScreen from './src/screens/CampaignScreen';
import GamesScreen from './src/screens/GamesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileCreateScreen from './src/screens/ProfileCreateScreen';
import CampaignDetailScreen from './src/screens/CampaignDetailScreen';
import StageDetailScreen from './src/screens/StageDetailScreen';
import TypingLessonScreen from './src/screens/TypingLessonScreen';
import VideoLessonScreen from './src/screens/VideoLessonScreen';
import PromptLessonScreen from './src/screens/PromptLessonScreen';
import LessonCompleteScreen from './src/screens/LessonCompleteScreen';
import MeteorFallScreen from './src/screens/games/MeteorFallScreen';
import WaterfallScreen from './src/screens/games/WaterfallScreen';
import BalloonPopScreen from './src/screens/games/BalloonPopScreen';
import TypingTestScreen from './src/screens/TypingTestScreen';
import MultiplayerScreen from './src/screens/MultiplayerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🏠', Campaign: '📚', Games: '🎮', Profile: '👤' };
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[label] || '•'}</Text>;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#4A90D9',
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarStyle: { height: 60, paddingBottom: 8 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Campaign" component={CampaignScreen} />
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user } = useDatabase();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4A90D9' },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {!user ? (
        <Stack.Screen name="ProfileCreate" component={ProfileCreateScreen} options={{ title: 'Welcome to TypeKids', headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} options={{ title: 'Stages' }} />
          <Stack.Screen name="StageDetail" component={StageDetailScreen} options={{ title: 'Lessons' }} />
          <Stack.Screen name="TypingLesson" component={TypingLessonScreen} options={{ title: 'Typing', headerBackVisible: false }} />
          <Stack.Screen name="VideoLesson" component={VideoLessonScreen} options={{ title: 'Video Lesson' }} />
          <Stack.Screen name="PromptLesson" component={PromptLessonScreen} options={{ title: '', headerTransparent: true }} />
          <Stack.Screen name="LessonComplete" component={LessonCompleteScreen} options={{ title: '', headerShown: false }} />
          <Stack.Screen name="MeteorFall" component={MeteorFallScreen} options={{ title: 'Meteor Fall', headerTransparent: true, headerTintColor: '#FFF' }} />
          <Stack.Screen name="Waterfall" component={WaterfallScreen} options={{ title: 'Waterfall', headerTransparent: true, headerTintColor: '#FFF' }} />
          <Stack.Screen name="BalloonPop" component={BalloonPopScreen} options={{ title: 'Balloon Pop' }} />
          <Stack.Screen name="TypingTest" component={TypingTestScreen} options={{ title: 'Typing Test' }} />
          <Stack.Screen name="Multiplayer" component={MultiplayerScreen} options={{ title: 'Multiplayer' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </DatabaseProvider>
  );
}
