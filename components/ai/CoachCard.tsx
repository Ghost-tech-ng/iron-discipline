import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { generateDailyCoaching, askCoach, type CoachingData } from '../../services/aiService';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing } from '../../constants/theme';

interface QA { question: string; answer: string }

interface Props {
  data: CoachingData;
}

export function CoachCard({ data }: Props) {
  const Colors = useColors();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [qa, setQa] = useState<QA[]>([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
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

  async function handleAsk() {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setQuestion('');
    try {
      const answer = await askCoach(q, data);
      setQa((prev) => [...prev, { question: q, answer }]);
    } catch {
      setQa((prev) => [...prev, { question: q, answer: 'Could not reach AI. Check your connection.' }]);
    } finally {
      setAsking(false);
    }
  }

  const styles = React.useMemo(() => StyleSheet.create({
    card: { gap: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5, flex: 1 },
    refreshBtn: { padding: 4 },
    refreshText: { fontSize: 16, color: Colors.muted },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    loadingText: { ...Typography.small, color: Colors.muted },
    errorText: { ...Typography.small, color: Colors.accentRed },
    message: { ...Typography.small, color: Colors.secondary, lineHeight: 20 },
    askBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.border,
      marginTop: 2,
    },
    askBtnText: { ...Typography.caption, color: Colors.accent, fontWeight: '600', flex: 1 },
    // Modal styles
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: Colors.base,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      maxHeight: '85%',
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    sheetTitle: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5, flex: 1 },
    closeBtn: { padding: 4 },
    chatScroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, flexGrow: 0 },
    feedbackBlock: { marginBottom: Spacing.sm },
    feedbackLabel: { ...Typography.caption, color: Colors.muted, marginBottom: 4 },
    feedbackText: { ...Typography.small, color: Colors.secondary, lineHeight: 20 },
    qaBlock: { marginBottom: Spacing.sm },
    qText: {
      ...Typography.small,
      color: Colors.accent,
      fontWeight: '600',
      lineHeight: 18,
      marginBottom: 4,
    },
    aText: { ...Typography.small, color: Colors.secondary, lineHeight: 20 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      ...Typography.small,
      color: Colors.primary,
      maxHeight: 90,
    },
    sendBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 12,
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: Colors.surface2 },
  }), [Colors]);

  if (!message && !loading && !error) {
    return (
      <Pressable onPress={load}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="hardware-chip-outline" size={16} color={Colors.accent} />
            <Text style={styles.title}>AI COACH</Text>
            <Text style={[styles.askBtnText, { flex: 0 }]}>Tap for today's feedback</Text>
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <>
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
          <Text style={styles.errorText}>Could not reach AI. Check your API key or connection.</Text>
        )}

        {message && !loading && (
          <Text style={styles.message}>{message}</Text>
        )}

        <TouchableOpacity style={styles.askBtn} onPress={() => setChatOpen(true)}>
          <Ionicons name="chatbubble-outline" size={13} color={Colors.accent} />
          <Text style={styles.askBtnText}>Ask the coach a question</Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.muted} />
        </TouchableOpacity>
      </Card>

      <Modal visible={chatOpen} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setChatOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Ionicons name="hardware-chip-outline" size={14} color={Colors.accent} />
              <Text style={[styles.sheetTitle, { marginLeft: 6 }]}>ASK THE COACH</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setChatOpen(false)}>
                <Ionicons name="close" size={20} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.chatScroll}
              contentContainerStyle={{ paddingBottom: Spacing.sm }}
              keyboardShouldPersistTaps="handled"
            >
              {message && (
                <View style={styles.feedbackBlock}>
                  <Text style={styles.feedbackLabel}>TODAY'S FEEDBACK</Text>
                  <Text style={styles.feedbackText}>{message}</Text>
                </View>
              )}
              {qa.map((item, i) => (
                <View key={i} style={styles.qaBlock}>
                  <Text style={styles.qText}>You: {item.question}</Text>
                  <Text style={styles.aText}>{item.answer}</Text>
                </View>
              ))}
              {asking && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={question}
                onChangeText={setQuestion}
                placeholder="Ask anything about your training or diet…"
                placeholderTextColor={Colors.muted}
                multiline
                returnKeyType="send"
                onSubmitEditing={handleAsk}
                editable={!asking}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!question.trim() || asking) && styles.sendBtnDisabled]}
                onPress={handleAsk}
                disabled={!question.trim() || asking}
              >
                <Ionicons name="send" size={16} color={question.trim() && !asking ? '#000' : Colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
