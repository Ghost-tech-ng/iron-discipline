import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { generateDailyCoaching, type CoachingData } from '../../services/aiService';
import { useColors } from '../../hooks/useColors';
import { Typography } from '../../constants/theme';

interface Props {
  data: CoachingData;
}

const CACHE_KEY_PREFIX = 'coach_cache_';

export function CoachCard({ data }: Props) {
  const Colors = useColors();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `${CACHE_KEY_PREFIX}${today}`;

  useEffect(() => {
    // Only auto-load once data has meaningful values (score > 0 or something logged)
    if (data.score > 0 || data.protein > 0 || data.calories > 0) {
      load();
    }
  }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const msg = await generateDailyCoaching(data);
      setMessage(msg);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const styles = React.useMemo(() => StyleSheet.create({
    card: { gap: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5, flex: 1 },
    prompt: { ...Typography.small, color: Colors.accent, fontWeight: '600' },
    refreshBtn: { padding: 4 },
    refreshText: { fontSize: 16, color: Colors.muted },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    loadingText: { ...Typography.small, color: Colors.muted },
    errorText: { ...Typography.small, color: Colors.accentRed },
    message: {
      ...Typography.small,
      color: Colors.secondary,
      lineHeight: 20,
    },
  }), [Colors]);

  if (!message && !loading && !error) {
    return (
      <Pressable onPress={load}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="hardware-chip-outline" size={16} color={Colors.accent} />
            <Text style={styles.title}>AI COACH</Text>
            <Text style={styles.prompt}>Tap for today's feedback</Text>
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="hardware-chip-outline" size={16} color={Colors.accent} />
        <Text style={styles.title}>AI COACH</Text>
        {!loading && (
          <Pressable onPress={load} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>↻</Text>
          </Pressable>
        )}
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.accent} />
          <Text style={styles.loadingText}>Analysing your day...</Text>
        </View>
      )}

      {error && !loading && (
        <Text style={styles.errorText}>
          Could not reach AI. Check your API key or connection.
        </Text>
      )}

      {message && !loading && (
        <Text style={styles.message}>{message}</Text>
      )}
    </Card>
  );
}
