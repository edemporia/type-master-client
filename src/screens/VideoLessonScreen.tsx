import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { getLesson, saveProgress } from '../db/repository';
import type { Lesson, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Map contentRef strings to bundled video assets
// Videos are bundled with the APK per client requirement
const VIDEO_ASSETS: Record<string, any> = {
  // These will be replaced with actual video files when assets are provided
  // For now, we use a placeholder approach
  // 'welcome': require('../../assets/videos/welcome.mp4'),
};

export default function VideoLessonScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'VideoLesson'>>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [hasWatched, setHasWatched] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    getLesson(db, route.params.lessonId).then(setLesson);
  }, []);

  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      setHasWatched(true);
      setIsPlaying(false);
    }
  }

  async function handleComplete() {
    if (!user) return;
    await saveProgress(db, {
      userId: user.id,
      lessonId: route.params.lessonId,
      completed: true,
      stars: 5,
      accuracy: 100,
      wpm: 0,
    });
    navigation.goBack();
  }

  const videoSource = lesson ? VIDEO_ASSETS[lesson.contentRef] : null;

  return (
    <View style={styles.container}>
      {videoSource ? (
        // Real video player when assets are bundled
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay
        />
      ) : (
        // Educational placeholder with lesson content
        <View style={styles.placeholderContainer}>
          <View style={styles.videoFrame}>
            <Text style={styles.playIcon}>▶</Text>
            <Text style={styles.lessonTitle}>{lesson?.title || 'Loading...'}</Text>

            {/* Show instructional content based on lesson type */}
            {lesson?.contentRef === 'welcome' && (
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Welcome to TypeKids!</Text>
                <Text style={styles.instruction}>In this app, you will learn to type using all your fingers.</Text>
                <Text style={styles.instruction}>Each finger has its own keys to press.</Text>
                <Text style={styles.instruction}>We will start with the home row - the middle row of keys.</Text>
                <Text style={styles.instruction}>Place your fingers on A S D F (left hand) and J K L ; (right hand).</Text>
                <Text style={styles.instruction}>The bumps on F and J help you find the right position without looking!</Text>
              </View>
            )}
            {lesson?.contentRef === 'posture' && (
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Good Typing Posture</Text>
                <Text style={styles.instruction}>1. Sit up straight with your feet flat on the floor</Text>
                <Text style={styles.instruction}>2. Keep your wrists slightly raised above the keyboard</Text>
                <Text style={styles.instruction}>3. Your elbows should be at a 90-degree angle</Text>
                <Text style={styles.instruction}>4. Look at the screen, not at your hands!</Text>
                <Text style={styles.instruction}>5. Keep your fingers curved and resting lightly on the home row</Text>
              </View>
            )}
            {lesson?.contentRef === 'top-row-intro' && (
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Reaching the Top Row</Text>
                <Text style={styles.instruction}>Your fingers will stretch up from the home row to reach the top row.</Text>
                <Text style={styles.instruction}>After pressing a top row key, return your finger to its home position.</Text>
                <Text style={styles.instruction}>Left index finger: R and T</Text>
                <Text style={styles.instruction}>Right index finger: Y and U</Text>
                <Text style={styles.instruction}>Practice moving up and back smoothly!</Text>
              </View>
            )}
            {lesson?.contentRef === 'bottom-row-intro' && (
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>The Bottom Row</Text>
                <Text style={styles.instruction}>Now let's reach down to the bottom row: Z X C V B N M</Text>
                <Text style={styles.instruction}>Your fingers stretch down, then return to the home row.</Text>
                <Text style={styles.instruction}>Left index finger covers V and B</Text>
                <Text style={styles.instruction}>Right index finger covers N and M</Text>
                <Text style={styles.instruction}>Keep it smooth and steady!</Text>
              </View>
            )}

            <Text style={styles.videoNote}>
              Tap Continue when you're ready
            </Text>
          </View>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.completeBtn, !hasWatched && !videoSource && styles.completeBtnReady]}
          onPress={handleComplete}
        >
          <Text style={styles.completeBtnText}>
            {hasWatched || !videoSource ? 'Continue' : 'Watching...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A202C', justifyContent: 'center', alignItems: 'center' },
  video: { width: '85%', aspectRatio: 16 / 9, borderRadius: 12 },
  placeholderContainer: { width: '85%', alignItems: 'center' },
  videoFrame: {
    width: '100%', aspectRatio: 16 / 9, backgroundColor: '#2D3748',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  playIcon: { fontSize: 32, color: '#4A90D9', marginBottom: 8 },
  lessonTitle: { fontSize: 22, color: '#FFF', fontWeight: '700', marginBottom: 16 },
  instructionContent: { alignItems: 'flex-start', width: '100%', paddingHorizontal: 20 },
  instructionTitle: { fontSize: 18, color: '#ECC94B', fontWeight: '700', marginBottom: 10 },
  instruction: { fontSize: 15, color: '#E2E8F0', lineHeight: 24, marginBottom: 2 },
  videoNote: { fontSize: 11, color: '#4A5568', marginTop: 16, fontStyle: 'italic' },
  controls: { marginTop: 24 },
  completeBtn: {
    backgroundColor: '#48BB78', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  completeBtnReady: { backgroundColor: '#48BB78' },
  completeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
