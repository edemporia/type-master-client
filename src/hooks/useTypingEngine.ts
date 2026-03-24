import { useState, useCallback, useRef } from 'react';
import type { KeystrokeLog } from '../types';
import { calculateStars, calculateWPM, calculateAccuracy } from '../utils/scoring';

interface TypingEngineConfig {
  prompt: string;
  sessionId: string;
  userId: number;
  lessonId: number;
}

interface TypingResult {
  stars: number;
  wpm: number;
  accuracy: number;
  keystrokes: Omit<KeystrokeLog, 'id'>[];
  troubleSpots: string[];
  durationMs: number;
}

export function useTypingEngine({ prompt, sessionId, userId, lessonId }: TypingEngineConfig) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const lastKeystrokeTimeRef = useRef<number>(0);
  const keystrokesRef = useRef<Omit<KeystrokeLog, 'id'>[]>([]);
  const errorMapRef = useRef<Record<string, number>>({});

  const handleKeyPress = useCallback((key: string) => {
    if (isComplete) return;

    const now = Date.now();
    if (!startTimeRef.current) startTimeRef.current = now;

    const delayMs = lastKeystrokeTimeRef.current ? now - lastKeystrokeTimeRef.current : 0;
    lastKeystrokeTimeRef.current = now;

    const expectedChar = prompt[currentIndex];
    const isCorrect = key.toLowerCase() === expectedChar.toLowerCase();

    // Log every keystroke
    keystrokesRef.current.push({
      sessionId,
      userId,
      lessonId,
      expectedChar,
      pressedChar: key,
      timestamp: now,
      delayMs,
    });

    setTotalAttempts(prev => prev + 1);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex >= prompt.length) {
        setIsComplete(true);
      }
    } else {
      // Track error for trouble spots
      const charKey = expectedChar.toLowerCase();
      errorMapRef.current[charKey] = (errorMapRef.current[charKey] || 0) + 1;
    }
  }, [currentIndex, isComplete, prompt, sessionId, userId, lessonId]);

  const getResult = useCallback((): TypingResult => {
    const durationMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const accuracy = calculateAccuracy(correctCount, totalAttempts);
    const wpm = calculateWPM(prompt.length, durationMs);
    const stars = calculateStars(accuracy);

    // Top trouble spots: chars with most errors
    const troubleSpots = Object.entries(errorMapRef.current)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([char]) => char);

    return {
      stars, wpm, accuracy,
      keystrokes: keystrokesRef.current,
      troubleSpots,
      durationMs,
    };
  }, [correctCount, totalAttempts, prompt]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setTotalAttempts(0);
    setIsComplete(false);
    startTimeRef.current = null;
    lastKeystrokeTimeRef.current = 0;
    keystrokesRef.current = [];
    errorMapRef.current = {};
  }, []);

  return {
    currentIndex,
    isComplete,
    correctCount,
    totalAttempts,
    handleKeyPress,
    getResult,
    reset,
  };
}
