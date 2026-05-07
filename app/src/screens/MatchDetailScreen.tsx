import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchMatch, joinMatch, reportMatch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { theme, statusColors } from '../theme';
import { Match, MatchParticipant, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetail'>;

export function MatchDetailScreen({ route, navigation }: Props) {
  const { matchId } = route.params;
  const { user, refreshProfile } = useAuthStore();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchMatch(matchId);
      setMatch(data);
    } catch {
      Alert.alert('Error', 'Failed to load match');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!match) return null;

  const myParticipation = match.match_participants?.find(p => p.user_id === user?.id);
  const isParticipant = !!myParticipation;
  const canJoin = match.status === 'pending' && !isParticipant;
  const team1 = match.match_participants?.filter(p => p.team === 1) ?? [];
  const team2 = match.match_participants?.filter(p => p.team === 2) ?? [];
  const canSubmitResult = isParticipant && match.status === 'active' && !myParticipation?.result_submitted;
  const shortId = match.id.slice(0, 8).toUpperCase();

  const handleJoin = (team: 1 | 2) => {
    Alert.alert(
      `Join Team ${team}`,
      match.entry_cost > 0
        ? `This will lock ${match.entry_cost} credits. Proceed?`
        : 'Join this free match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setJoining(true);
            try {
              await joinMatch(matchId, team);
              await refreshProfile();
              await load();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to join match');
            } finally {
              setJoining(false);
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert('Report Match', 'Are you sure you want to flag this match as disputed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportMatch(matchId);
            await load();
            Alert.alert('Reported', 'This match has been flagged for admin review.');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to report');
          }
        },
      },
    ]);
  };

  const statusColor = statusColors[match.status];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.colors.primary} />
        }
      >
        {/* Match ID Banner */}
        <View style={styles.idBanner}>
          <Text style={styles.idLabel}>MATCH ID (include in your screenshot)</Text>
          <Text style={styles.idValue}>{shortId}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.gameBadge}>
            <Text style={styles.gameText}>{match.game}</Text>
            <Text style={styles.formatText}>{match.format}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{match.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{match.entry_cost === 0 ? 'Free' : `${match.entry_cost}`}</Text>
            <Text style={styles.statLabel}>Entry</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.colors.accent }]}>
              {match.entry_cost === 0 ? '—' : `${match.entry_cost * match.max_players}`}
            </Text>
            <Text style={styles.statLabel}>Prize Pool</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{match.match_participants?.length ?? 0}/{match.max_players}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
        </View>

        {/* Rules */}
        {match.rules && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rules</Text>
            <Text style={styles.rulesText}>{match.rules}</Text>
          </View>
        )}

        {/* Teams */}
        <View style={styles.teamsContainer}>
          <TeamColumn
            label="Team 1"
            participants={team1}
            winnersTeam={match.winner_team}
            team={1}
            myUserId={user?.id}
          />
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <TeamColumn
            label="Team 2"
            participants={team2}
            winnersTeam={match.winner_team}
            team={2}
            myUserId={user?.id}
          />
        </View>

        {/* Actions */}
        {canJoin && (
          <View style={styles.actions}>
            <Text style={styles.joinTitle}>Choose your team</Text>
            <View style={styles.joinRow}>
              <Button
                title="Join Team 1"
                onPress={() => handleJoin(1)}
                loading={joining}
                style={styles.joinBtn}
                disabled={team1.length >= parseInt(match.format)}
              />
              <Button
                title="Join Team 2"
                onPress={() => handleJoin(2)}
                loading={joining}
                variant="secondary"
                style={styles.joinBtn}
                disabled={team2.length >= parseInt(match.format)}
              />
            </View>
          </View>
        )}

        {canSubmitResult && (
          <Button
            title="Submit Result"
            onPress={() => navigation.navigate('SubmitResult', { matchId, matchGame: match.game })}
            size="lg"
            style={styles.actionBtn}
          />
        )}

        {myParticipation?.result_submitted && match.status === 'active' && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              ✅ Result submitted — waiting for other players...
            </Text>
          </View>
        )}

        {match.status === 'completed' && (
          <View style={[styles.resultBox, { borderColor: theme.colors.success }]}>
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={styles.resultTitle}>Match Complete</Text>
            <Text style={styles.resultSubtitle}>
              Team {match.winner_team} wins!
              {match.winner_team === myParticipation?.team && ' — Congrats!'}
            </Text>
          </View>
        )}

        {match.status === 'disputed' && (
          <View style={[styles.resultBox, { borderColor: theme.colors.error }]}>
            <Text style={styles.resultEmoji}>⚠️</Text>
            <Text style={styles.resultTitle}>Match Disputed</Text>
            <Text style={styles.resultSubtitle}>An admin is reviewing this match</Text>
          </View>
        )}

        {isParticipant && ['active', 'disputed'].includes(match.status) && (
          <Button
            title="Report Dispute"
            onPress={handleReport}
            variant="danger"
            size="sm"
            style={styles.reportBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TeamColumn({
  label,
  participants,
  winnersTeam,
  team,
  myUserId,
}: {
  label: string;
  participants: MatchParticipant[];
  winnersTeam: 1 | 2 | null | undefined;
  team: 1 | 2;
  myUserId?: string;
}) {
  const isWinner = winnersTeam === team;

  return (
    <View style={teamStyles.col}>
      <Text style={[teamStyles.teamLabel, isWinner && { color: theme.colors.accent }]}>
        {label} {isWinner ? '🏆' : ''}
      </Text>
      {participants.length === 0 ? (
        <View style={teamStyles.emptySlot}>
          <Text style={teamStyles.emptyText}>Open slot</Text>
        </View>
      ) : (
        participants.map(p => (
          <View key={p.user_id} style={teamStyles.player}>
            <View style={teamStyles.avatar}>
              <Text style={teamStyles.avatarText}>
                {p.users?.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={teamStyles.playerInfo}>
              <Text style={teamStyles.playerName}>
                {p.users?.username ?? 'Player'}
                {p.user_id === myUserId ? ' (you)' : ''}
              </Text>
              {p.result_submitted && (
                <Text style={[
                  teamStyles.result,
                  { color: p.claimed_result === 'win' ? theme.colors.success : theme.colors.error }
                ]}>
                  {p.claimed_result === 'win' ? '✓ Win' : '✗ Loss'}
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const teamStyles = StyleSheet.create({
  col: {
    flex: 1,
    gap: 8,
  },
  teamLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySlot: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  emptyText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: theme.borderRadius.md,
    padding: 8,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: theme.fontWeight.bold, fontSize: 14 },
  playerInfo: { flex: 1 },
  playerName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  result: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg },
  idBanner: {
    backgroundColor: theme.colors.primary + '22',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  idLabel: {
    color: theme.colors.primaryLight,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  idValue: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  gameBadge: {},
  gameText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.extrabold,
  },
  formatText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: theme.fontWeight.bold, letterSpacing: 0.5 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.extrabold,
  },
  statLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: theme.colors.border },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  rulesText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  vsContainer: {
    paddingTop: 36,
    alignItems: 'center',
    width: 36,
  },
  vsText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.extrabold,
  },
  actions: { marginBottom: theme.spacing.lg },
  joinTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  joinRow: { flexDirection: 'row', gap: theme.spacing.md },
  joinBtn: { flex: 1 },
  actionBtn: { marginBottom: theme.spacing.md },
  waitingBox: {
    backgroundColor: theme.colors.success + '11',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.success + '44',
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  waitingText: { color: theme.colors.success, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
  resultBox: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  resultEmoji: { fontSize: 48, marginBottom: theme.spacing.sm },
  resultTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.extrabold,
  },
  resultSubtitle: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, marginTop: 6 },
  reportBtn: { marginTop: theme.spacing.sm },
});
