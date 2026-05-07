import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { uploadProof, submitResult } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SubmitResult'>;

export function SubmitResultScreen({ route, navigation }: Props) {
  const { matchId, matchGame } = route.params;
  const { user } = useAuthStore();
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [proofMime, setProofMime] = useState<string>('image/jpeg');
  const [claimedResult, setClaimedResult] = useState<'win' | 'loss' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const shortId = matchId.slice(0, 8).toUpperCase();

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow access to your media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProofUri(asset.uri);
      setProofMime(asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'));
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProofUri(asset.uri);
      setProofMime(asset.mimeType ?? 'image/jpeg');
    }
  };

  const handleSubmit = async () => {
    if (!proofUri) {
      Alert.alert('Missing proof', 'Please upload a screenshot or video showing the match ID');
      return;
    }
    if (!claimedResult) {
      Alert.alert('Missing result', 'Please select whether you won or lost');
      return;
    }

    Alert.alert(
      'Confirm Submission',
      `You are claiming: ${claimedResult.toUpperCase()}\n\nMake sure your proof shows the match ID: ${shortId}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setUploading(true);
              await uploadProof(matchId, proofUri, proofMime);
              setUploading(false);

              setSubmitting(true);
              await submitResult(matchId, claimedResult);
              setSubmitting(false);

              Alert.alert(
                'Submitted!',
                'Your result has been submitted. Waiting for the other team.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (err: any) {
              setUploading(false);
              setSubmitting(false);
              Alert.alert('Error', err.response?.data?.error || err.message || 'Submission failed');
            }
          },
        },
      ]
    );
  };

  const isVideo = proofMime.startsWith('video/');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Submit Result</Text>
        <Text style={styles.subtitle}>{matchGame}</Text>

        {/* Match ID reminder */}
        <View style={styles.idReminder}>
          <Text style={styles.idReminderIcon}>⚠️</Text>
          <View style={styles.idReminderText}>
            <Text style={styles.idReminderTitle}>Anti-cheat requirement</Text>
            <Text style={styles.idReminderBody}>
              Your screenshot must show the match ID:{' '}
              <Text style={styles.idHighlight}>{shortId}</Text>
            </Text>
          </View>
        </View>

        {/* Proof Upload */}
        <Text style={styles.sectionLabel}>PROOF (REQUIRED)</Text>

        {proofUri ? (
          <View style={styles.proofPreview}>
            {isVideo ? (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoIcon}>🎬</Text>
                <Text style={styles.videoText}>Video selected</Text>
              </View>
            ) : (
              <Image source={{ uri: proofUri }} style={styles.previewImage} resizeMode="cover" />
            )}
            <TouchableOpacity style={styles.changeProof} onPress={pickMedia}>
              <Text style={styles.changeProofText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadLabel}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickMedia}>
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadLabel}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Result Selection */}
        <Text style={styles.sectionLabel}>YOUR RESULT</Text>
        <View style={styles.resultRow}>
          <TouchableOpacity
            style={[
              styles.resultCard,
              claimedResult === 'win' && styles.winCard,
            ]}
            onPress={() => setClaimedResult('win')}
          >
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={[styles.resultLabel, claimedResult === 'win' && { color: theme.colors.success }]}>
              I WON
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resultCard,
              claimedResult === 'loss' && styles.lossCard,
            ]}
            onPress={() => setClaimedResult('loss')}
          >
            <Text style={styles.resultEmoji}>💀</Text>
            <Text style={[styles.resultLabel, claimedResult === 'loss' && { color: theme.colors.error }]}>
              I LOST
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <Button
          title={
            uploading ? 'Uploading proof...' : submitting ? 'Submitting result...' : 'Submit Result'
          }
          onPress={handleSubmit}
          size="lg"
          loading={uploading || submitting}
          disabled={!proofUri || !claimedResult}
          style={styles.submitBtn}
        />

        <Text style={styles.disclaimer}>
          Submitting a false result may result in credit loss and account suspension.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, marginBottom: theme.spacing.lg },
  idReminder: {
    flexDirection: 'row',
    backgroundColor: theme.colors.warning + '11',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning + '44',
    padding: theme.spacing.md,
    gap: 10,
    marginBottom: theme.spacing.xl,
    alignItems: 'flex-start',
  },
  idReminderIcon: { fontSize: 20 },
  idReminderText: { flex: 1 },
  idReminderTitle: {
    color: theme.colors.warning,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  idReminderBody: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  idHighlight: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  uploadIcon: { fontSize: 32 },
  uploadLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
  proofPreview: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
  },
  videoPlaceholder: {
    height: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  videoIcon: { fontSize: 48 },
  videoText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  changeProof: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  changeProofText: { color: '#fff', fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
  resultRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
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
  winCard: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '11',
  },
  lossCard: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '11',
  },
  resultEmoji: { fontSize: 36 },
  resultLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: 1,
  },
  submitBtn: { marginBottom: theme.spacing.md },
  disclaimer: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
