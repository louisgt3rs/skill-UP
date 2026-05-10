export const XP_WIN = 150;
export const XP_LOSS = 30;

export function getLevelInfo(xp: number): {
  level: number;
  currentXp: number;
  neededXp: number;
  progress: number;
  title: string;
} {
  let level = 1;
  let remaining = xp;
  let needed = 150;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = 150 + (level - 1) * 50;
  }
  return {
    level,
    currentXp: remaining,
    neededXp: needed,
    progress: Math.round((remaining / needed) * 100),
    title: getLevelTitle(level),
  };
}

function getLevelTitle(level: number): string {
  if (level < 3)  return 'Recrue';
  if (level < 5)  return 'Challenger';
  if (level < 8)  return 'Confirmé';
  if (level < 12) return 'Expert';
  if (level < 18) return 'Élite';
  if (level < 25) return 'Maître';
  return 'Légende';
}

export function getLevelColor(level: number): string {
  if (level < 3)  return '#6B7280';
  if (level < 5)  return '#3B82F6';
  if (level < 8)  return '#8B5CF6';
  if (level < 12) return '#F59E0B';
  if (level < 18) return '#EF4444';
  if (level < 25) return '#10B981';
  return '#FBBF24';
}
