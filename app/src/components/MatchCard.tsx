import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme, statusColors } from '../theme';
import { Match } from '../types';

const GAME_EMOJIS: Record<string, string> = {
  Fortnite: '🎯',
  'Brawl Stars': '⚡',
  'Call of Duty': '🎖️',
  'Rocket League': '🚀',
  FIFA: '⚽',
  Valorant: '🔫',
  'League of Legends': '🧙',
  Other: '🎮',
};

interface MatchCardProps {
  match: Match;
  onPress: () => void;
  currentUserId?: string;
}

export function MatchCard({ match, onPress, currentUserId }: MatchCardProps) {
  const participantCount = match.match_participants?.length ?? 0;
  const isParticipant = match.match_participants?.some(p => p.user_id === currentUserId);
  const emoji = GAME_EMOJIS[match.game] ?? '🎮';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.gameRow}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View>
            <Text style={styles.game}>{match.game}</Text>
            <Text style={styles.format}>{match.format} • {participantCount}/{match.max_players} players</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[match.status] + '22' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColors[match.status] }]} />
          <Text style={[styles.statusText, { color: statusColors[match.status] }]}>
            {match.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Entry</Text>
          <Text style={styles.footerValue}>
            {match.entry_cost === 0 ? 'Free' : `${match.entry_cost} credits`}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Prize</Text>
          <Text style={[styles.footerValue, { color: theme.colors.accent }]}>
            {match.entry_cost === 0 ? 'None' : `${match.entry_cost * match.max_players} credits`}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Host</Text>
          <Text style={styles.footerValue}>{match.creator?.username ?? '—'}</Text>
        </View>
        {isParticipant && (
          <View style={styles.youBadge}>
            <Text style={styles.youText}>YOU IN</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 28,
  },
  game: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  format: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footerValue: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  youBadge: {
    backgroundColor: theme.colors.primary + '33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  youText: {
    color: theme.colors.primaryLight,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
  },
});
