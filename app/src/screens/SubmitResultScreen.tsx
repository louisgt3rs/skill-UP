import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { uploadProof, submitResult } from '../lib/api';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SubmitResult'>;

export function SubmitResultScreen({ route, navigation }: Props) {
  const { matchId, matchGame } = route.params;
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [claimedResult, setClaimedResult] = useState<'win' | 'loss' | null>(null);
  const [uploading, setUploading] = useState(false);
  const shortId = matchId.slice(0, 8).toUpperCase();

  const handleFileChange = (e: any) => {
    const file = e.target?.files?.[0];
    if (file) setProofFile(file);
  };

  const handleSubmit = async () => {
    if (!proofFile) {
      Alert.alert('Missing proof', 'Please select a file');
      return;
    }
    if (!claimedResult) {
      Alert.alert('Missing result', 'Please select win or loss');
      return;
    }
    try {
      setUploading(true);
      const uri = URL.createObjectURL(proofFile);
      await uploadProof(matchId, uri, proofFile.type || 'image/jpeg');
      await submitResult(matchId, claimedResult);
      Alert.alert('Submitted!', 'Your result has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Submission failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Submit Result</Text>
        <Text style={styles.subtitle}>{matchGame}</Text>

        <View style={styles.idReminder}>
          <Text style={styles.idReminderTitle}>⚠️ Match ID : {shortId}</Text>
          <Text style={styles.idReminderBody}>Ton screenshot doit montrer cet ID</Text>
        </View>

        <Text style={styles.sectionLabel}>PROOF (REQUIRED)</Text>
        {/* @ts-ignore */}
        <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ color: '#fff', marginBottom: 24 }} />
        {proofFile && <Text style={{ color: theme.colors.success, marginBottom: 16 }}>✓ {proofFile.name}</Text>}

        <Text style={styles.sectionLabel}>YOUR RESULT</Text>
        <View style={styles.resultRow}>
          <TouchableOpacity
            style={[styles.resultCard, claimedResult === 'win' && styles.winCard]}
            onPress={() => setClaimedResult('win')}
          >
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={[styles.resultLabel, claimedResult === 'win' && { color: theme.colors.success }]}>I WON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resultCard, claimedResult === 'loss' && styles.lossCard]}
            onPress={() => setClaimedResult('loss')}
          >
            <Text style={styles.resultEmoji}>💀</Text>
            <Text style={[styles.resultLabel, claimedResult === 'loss' && { color: theme.colors.error }]}>I LOST</Text>
          </TouchableOpacity>
        </View>

        <Button
          title={uploading ? 'Uploading...' : 'Submit Result'}
          onPress={handleSubmit}
          size="lg"
          loading={uploading}
          disabled={!proofFile || !claimedResult}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg },
  title: { color: theme.colors.text, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.extrabold },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, marginBottom: theme.spacing.lg },
  idReminder: {
    backgroundColor: theme.colors.warning + '11',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning + '44',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  idReminderTitle: { color: theme.colors.warning, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },
  idReminderBody: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  resultRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  resultCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: 10,
  },
  winCard: { borderColor: theme.colors.success, backgroundColor: theme.colors.success + '11' },
  lossCard: { borderColor: theme.colors.error, backgroundColor: theme.colors.error + '11' },
  resultEmoji: { fontSize: 36 },
  resultLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.extrabold },
  submitBtn: { marginBottom: theme.spacing.md },
});
