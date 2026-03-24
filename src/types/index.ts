// ─── User ───────────────────────────────────────
export interface User {
  id: number;
  fullName: string;
  nickname: string;
  avatarConfig: string; // JSON string for DiceBear config
  age: number;
  school: string | null;
  createdAt: string;
}

// ─── Campaign Content ───────────────────────────
export interface Campaign {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  totalStages: number;
}

export interface Stage {
  id: number;
  campaignId: number;
  title: string;
  description: string;
  orderIndex: number;
  totalLessons: number;
}

export type LessonType = 'video' | 'typing' | 'prompt';

export interface Lesson {
  id: number;
  stageId: number;
  type: LessonType;
  title: string;
  contentRef: string; // video path, typing content JSON, or prompt text
  orderIndex: number;
}

// ─── Progress & Analytics ───────────────────────
export interface Progress {
  id: number;
  userId: number;
  lessonId: number;
  completed: boolean;
  stars: number;
  accuracy: number;
  wpm: number;
  completedAt: string | null;
}

export interface KeystrokeLog {
  id: number;
  sessionId: string;
  userId: number;
  lessonId: number;
  expectedChar: string;
  pressedChar: string;
  timestamp: number;
  delayMs: number;
}

export interface GameScore {
  id: number;
  userId: number;
  gameType: 'meteor' | 'waterfall' | 'balloon';
  score: number;
  accuracy: number;
  wpm: number;
  playedAt: string;
}

export interface LeaderboardEntry {
  id: number;
  userId: number;
  testId: string;
  score: number;
  rank: number;
  synced: boolean;
}

// ─── Typing Engine ──────────────────────────────
export interface TypingPrompt {
  text: string;
  difficulty: 'letter' | 'word' | 'sentence';
}

export interface TypingState {
  prompt: string;
  currentIndex: number;
  startTime: number | null;
  keystrokes: KeystrokeLog[];
  correctCount: number;
  incorrectCount: number;
}

// ─── Navigation ─────────────────────────────────
export type RootStackParamList = {
  Tabs: undefined;
  ProfileCreate: undefined;
  CampaignDetail: { campaignId: number };
  StageDetail: { stageId: number };
  TypingLesson: { lessonId: number };
  VideoLesson: { lessonId: number };
  PromptLesson: { lessonId: number };
  LessonComplete: { lessonId: number; stars: number; accuracy: number; wpm: number; troubleSpots?: string[] };
  MeteorFall: undefined;
  Waterfall: undefined;
  BalloonPop: undefined;
  TypingTest: undefined;
  Multiplayer: undefined;
};

export type TabParamList = {
  Home: undefined;
  Campaign: undefined;
  Games: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

// ─── Keyboard ───────────────────────────────────
export type Finger = 'leftPinky' | 'leftRing' | 'leftMiddle' | 'leftIndex' | 'rightIndex' | 'rightMiddle' | 'rightRing' | 'rightPinky' | 'thumb';

export interface KeyMapping {
  key: string;
  finger: Finger;
  row: number;
  col: number;
}
