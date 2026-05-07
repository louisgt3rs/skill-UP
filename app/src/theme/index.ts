export const theme = {
  colors: {
    background: '#0A0A0F',
    surface: '#12121A',
    surfaceHigh: '#1E1E2E',
    primary: '#7C3AED',
    primaryDark: '#5B21B6',
    primaryLight: '#A78BFA',
    secondary: '#3B82F6',
    accent: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#4B5563',
    border: '#1F2937',
    borderLight: '#374151',
    pending: '#F59E0B',
    active: '#10B981',
    completed: '#3B82F6',
    disputed: '#EF4444',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export type Theme = typeof theme;

export const statusColors: Record<string, string> = {
  pending: theme.colors.pending,
  active: theme.colors.active,
  completed: theme.colors.completed,
  disputed: theme.colors.disputed,
};
