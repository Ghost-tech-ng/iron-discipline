import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { useSyncStore } from '../../store/syncStore';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface Props {
  onSyncPress: () => void;
}

export function SyncCard({ onSyncPress }: Props) {
  const { isSyncing, lastSynced, error } = useSyncStore();

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
      ' · ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-upload-outline" size={18} color={Colors.accent} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>CLOUD BACKUP</Text>
          {isSyncing ? (
            <Text style={styles.sub}>Uploading data...</Text>
          ) : error ? (
            <Text style={[styles.sub, { color: Colors.accentRed }]} numberOfLines={2}>{error}</Text>
          ) : lastSynced ? (
            <Text style={styles.sub}>Last synced {formatTime(lastSynced)}</Text>
          ) : (
            <Text style={styles.sub}>Not yet synced to cloud</Text>
          )}
        </View>
        <Pressable
          style={[styles.btn, isSyncing && styles.btnDisabled]}
          onPress={onSyncPress}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.base} />
          ) : (
            <Text style={styles.btnText}>Upload</Text>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  title: { ...Typography.label, color: Colors.muted, letterSpacing: 1.2 },
  sub: { ...Typography.caption, color: Colors.secondary },
  btn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 68,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...Typography.caption, color: Colors.base, fontWeight: '700' },
});
