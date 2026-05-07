import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createMatch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GAMES = [
  'Fortnite',
  'Brawl Stars',
  'Call of Duty',
  'Rocket League',
  'Valorant',
  'FIFA',
  'League of Legends',
  'Other',
];

const FORMATS = ['1v1', '2v2', '3v3'] as const;
const ENTRY_OPTIONS = [0, 50, 100, 250, 500, 1000];

export function CreateMatchScreen() {
  const navigation = useNavigation<Nav>();
  const { user, refreshProfile } = useAuthStore();

  const [game, setGame] = useState('');
  const [format, setFormat] = useState<'1v1' | '2v2' | '3v3'>('1v1');
  const [rules, setRules] = useState('');
  const [entryCost, setEntryCost] = useState(0);
  const [loading, setLoading] = useState(false);

  const prizePool = entryCost * parseInt(format.split('v')[0]) * 2;

  const handleCreate = async () => {
    if (!game) {
      Alert.alert('Error', 'Please select a game');
      return;
    }
    if (entryCost > 0 && (user?.credits ?? 0) < entryCost) {
      Alert.alert('Insufficient Credits', `You need ${entryCost} credits to create this match.`);
      return;
    }

    setLoading(true);
    try {
      const match = await createMatch({ game, format, rules: rules.trim() || undefined, entry_cost: entryCost });
      await refreshProfile();
      Alert.alert('Match Created!', `Share your match ID:\n${match.id.slice(0, 8).toUpperCase()}`, [
        {
          text: 'View Match',
          onPress: () => navigation.navigate('MatchDetail', { matchId: match.id }),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create Match</Text>
          <Text style={styles.subtitle}>Set up your competitive match</Text>

          {/* Game Selector */}
          <Text style={styles.label}>SELECT GAME</Text>
          <View style={styles.grid}>
            {GAMES.map(g => (
              <TouchableOpacity
                key={g}
                onPress={() => setGame(g)}
                style={[styles.gameChip, game === g && styles.gameChipActive]}
              >
                <Text style={[styles.gameChipText, game === g && styles.gameChipTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Format Selector */}
          <Text style={styles.label}>FORMAT</Text>
          <View style={styles.row}>
            {FORMATS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFormat(f)}
                style={[styles.formatChip, format === f && styles.formatChipActive]}
              >
                <Text style={[styles.formatText, format === f && styles.formatTextActive]}>{f}</Text>
                <Text style={[styles.formatSub, format === f && { color: '#fff' }]}>
                  {parseInt(f) * 2} players
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Entry Cost */}
          <Text style={styles.label}>ENTRY COST</Text>
          <View style={styles.row}>
            {ENTRY_OPTIONS.map(cost => (
              <TouchableOpacity
                key={cost}
                onPress={() => setEntryCost(cost)}
                style={[styles.costChip, entryCost === cost && styles.costChipActive]}
              >
                <Text style={[styles.costText, entryCost === cost && styles.costTextActive]}>
                  {cost === 0 ? 'Free' : `${cost}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {entryCost > 0 && (
            <View style={styles.prizeBox}>
              <Text style={styles.prizeLabel}>Total Prize Pool</Text>
              <Text style={styles.prizeValue}>{prizePool} credits</Text>
            </View>
          )}

          {/* Rules */}
          <Input
            label="Match Rules (optional)"
            value={rules}
            onChangeText={setRules}
            placeholder="e.g. No lag switching, standard rules apply..."
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          {/* Balance info */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Your balance</Text>
            <Text style={styles.balanceValue}>💰 {user?.credits?.toLocaleString() ?? 0} credits</Text>
          </View>

          <Button
            title="Create Match"
            onPress={handleCreate}
            loading={loading}
            size="lg"
            disabled={!game}
            style={styles.createBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  container: { padding: theme.spacing.lg },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    marginTop: 4,
    marginBottom: theme.spacing.xl,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  gameChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  gameChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '22',
  },
  gameChipText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  gameChipTextActive: { color: theme.colors.primaryLight, fontWeight: theme.fontWeight.semibold },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  formatChip: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  formatChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  formatText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.extrabold,
  },
  formatTextActive: { color: '#fff' },
  formatSub: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, marginTop: 2 },
  costChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  costChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent + '22',
  },
  costText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  costTextActive: { color: theme.colors.accent, fontWeight: theme.fontWeight.bold },
  prizeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.accent + '11',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent + '44',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  prizeLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  prizeValue: { color: theme.colors.accent, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  balanceLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  balanceValue: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  createBtn: { marginTop: theme.spacing.sm },
});
