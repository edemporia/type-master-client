import type { Finger, KeyMapping } from '../types';

// Standard QWERTY finger-to-key mapping for touch typing
const FINGER_MAP: Record<string, Finger> = {
  // Left pinky
  q: 'leftPinky', a: 'leftPinky', z: 'leftPinky', '1': 'leftPinky', '`': 'leftPinky',
  // Left ring
  w: 'leftRing', s: 'leftRing', x: 'leftRing', '2': 'leftRing',
  // Left middle
  e: 'leftMiddle', d: 'leftMiddle', c: 'leftMiddle', '3': 'leftMiddle',
  // Left index (two columns)
  r: 'leftIndex', f: 'leftIndex', v: 'leftIndex', '4': 'leftIndex',
  t: 'leftIndex', g: 'leftIndex', b: 'leftIndex', '5': 'leftIndex',
  // Right index (two columns)
  y: 'rightIndex', h: 'rightIndex', n: 'rightIndex', '6': 'rightIndex',
  u: 'rightIndex', j: 'rightIndex', m: 'rightIndex', '7': 'rightIndex',
  // Right middle
  i: 'rightMiddle', k: 'rightMiddle', ',': 'rightMiddle', '8': 'rightMiddle',
  // Right ring
  o: 'rightRing', l: 'rightRing', '.': 'rightRing', '9': 'rightRing',
  // Right pinky
  p: 'rightPinky', ';': 'rightPinky', '/': 'rightPinky', '0': 'rightPinky',
  '[': 'rightPinky', "'": 'rightPinky', '-': 'rightPinky',
  ']': 'rightPinky', '=': 'rightPinky', '\\': 'rightPinky',
  // Thumb
  ' ': 'thumb',
};

// Keyboard layout rows for rendering
export const KEYBOARD_ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export const SPACE_KEY = ' ';

export function getFingerForKey(key: string): Finger {
  return FINGER_MAP[key.toLowerCase()] || 'rightIndex';
}

// Color coding per finger for the keyboard overlay
export const FINGER_COLORS: Record<Finger, string> = {
  leftPinky: '#FF6B6B',
  leftRing: '#FFA94D',
  leftMiddle: '#FFD43B',
  leftIndex: '#69DB7C',
  rightIndex: '#69DB7C',
  rightMiddle: '#FFD43B',
  rightRing: '#FFA94D',
  rightPinky: '#FF6B6B',
  thumb: '#74C0FC',
};
