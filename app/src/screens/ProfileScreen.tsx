import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { fetchMyMatches } from '../lib/api';
import { Button } from '../components/Button';
import { theme, statusColors } from '../theme';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut, refreshProfile } = useAuthStore();
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchMyMatches();
      setMatchHistory(data);
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); refreshProfile(); load(); };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const wins = matchHistory.filter(m => m.matches?.winner_team === m.team).length;
  const losses = matchHistory.filter(
    m => m.matches?.status === 'completed' && m.matches?.winner_team !== m.team
  ).length;
  const winRate = matchHistory.length > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.creditsBadge}>
              <Text style={styles.creditsText}>💰 {user?.credits?.toLocaleString()} credits</Text>
            </View>
            <View style={styles.repBadge}>
              <Text style={styles.repText}>⭐ {user?.reputation} rep</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{losses}</Text>
            <Text style={styles.statLabel}>Losses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: winRate >= 50 ? theme.colors.success : theme.colors.error }]}>
              {winRate}%
            </Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{matchHistory.length}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>

        {/* Match History */}
        <Text style={styles.sectionTitle}>Match History</Text>

        {matchHistory.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎮</Text>
            <Text style={styles.emptyText}>No matches yet. Start competing!</Text>
          </View>
        ) : (
          matchHistory.map((item, i) => {
            const m = item.matches;
            if (!m) return null;
            const isWin = m.winner_team === item.team;
            const isCompleted = m.status === 'completed';
            const statusColor = statusColors[m.status];

            return (
              <TouchableOpacity
                key={i}
                style={styles.historyCard}
                onPress={() => navigation.navigate('MatchDetail', { matchId: m.id })}
                activeOpacity={0.85}
              >
                <View style={styles.historyLeft}>
                  <Text style={styles.historyGame}>{m.game}</Text>
                  <Text style={styles.historyFormat}>{m.format}</Text>
                </View>
                <View style={styles.historyRight}>
                  <View style={[styles.historyStatus, { backgroundColor: statusColor + '22' }]}>
                    <Text style={[styles.historyStatusText, { color: statusColor }]}>
                      {m.status.toUpperCase()}
                    </Text>
                  </View>
                  {isCompleted && (
                    <Text style={[styles.historyResult, { color: isWin ? theme.colors.success : theme.colors.error }]}>
                      {isWin ? '+' : '-'}{m.entry_cost} cr
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Admin Panel */}
        {user?.is_admin && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Admin</Text>
            <Button
              title="View Disputes"
              onPress={() => Alert.alert('Admin', 'Use the API to manage disputes.\n\nGET /api/disputes (with admin Bearer token)')}
              variant="outline"
            />
          </View>
        )}

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
          style={styles.signoutBtn}
          textStyle={{ color: theme.colors.error }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: theme.spacing.xl },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primaryLight,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: theme.fontWeight.extrabold },
  username: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.extrabold,
    marginBottom: theme.spacing.sm,
  },
  badgeRow: { flexDirection: 'row', gap: theme.spacing.sm },
  creditsBadge: {
    backgroundColor: theme.colors.accent + '22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.accent + '44',
  },
  creditsText: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  repBadge: {
    backgroundColor: theme.colors.surfaceHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  repText: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.extrabold,
  },
  statLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: theme.colors.border },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  empty: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  emptyEmoji: { fontSize: 40, marginBottom: theme.spacing.sm },
  emptyText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyLeft: {},
  historyGame: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  historyFormat: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginTop: 2 },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.sm },
  historyStatusText: { fontSize: 10, fontWeight: theme.fontWeight.bold, letterSpacing: 0.5 },
  historyResult: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },
  adminSection: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  signoutBtn: { marginTop: theme.spacing.xl },
});
