import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { adviseOnFood, type AdvisorResult } from '../services/aiService';
import { useNutritionStore } from '../store/nutritionStore';
import { useUserStore } from '../store/userStore';
import { useColors } from '../hooks/useColors';
import { useActivePlanTargets } from '../hooks/useActivePlanTargets';
import { Card } from '../components/ui/Card';
import { Spacing, Typography } from '../constants/theme';

const QUICK_QUESTIONS = [
  'Should I eat this?',
  'Is this good for my goal?',
  'Which one is better for me?',
  'Can I eat this today?',
  'Is this high enough in protein?',
];

interface CapturedImage {
  uri: string;
  base64: string;
}

export default function AdvisorScreen() {
  const Colors = useColors();
  const { getTotals } = useNutritionStore();
  const { profile } = useUserStore();
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdvisorResult | null>(null);

  const planTargets = useActivePlanTargets();
  const { calories, protein, carbs, fat } = getTotals();

  async function pickImage() {
    if (images.length >= 2) {
      Alert.alert('Maximum 2 images', 'Remove one image before adding another.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (lib.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera or photo library access to use this feature.');
        return;
      }
    }

    Alert.alert('Add Image', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            base64: true,
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setImages((prev) => [...prev, { uri: asset.uri, base64: asset.base64! }]);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            base64: true,
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setImages((prev) => [...prev, { uri: asset.uri, base64: asset.base64! }]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }

  async function handleAsk() {
    if (images.length === 0) {
      Alert.alert('Add an image first', 'Take a photo of the food or product you want to check.');
      return;
    }
    if (!question.trim()) {
      Alert.alert('Ask a question', 'Type or select a question above.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await adviseOnFood(
        images.map((img) => ({ base64: img.base64, mimeType: 'image/jpeg' })),
        {
          goals: {
            calories: planTargets.calories,
            protein: planTargets.protein,
            carbs: planTargets.carbs,
            fat: planTargets.fat,
          },
          todayConsumed: { calories, protein, carbs, fat },
          question: question.trim(),
        }
      );
      setResult(res);
    } catch (e) {
      Alert.alert('Error', 'Could not get advice. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  function verdictColor(v: AdvisorResult['verdict']) {
    switch (v) {
      case 'eat': return Colors.accentGreen;
      case 'avoid': return Colors.accentRed;
      case 'moderate': return Colors.accentAmber;
      default: return Colors.accent;
    }
  }

  function verdictIcon(v: AdvisorResult['verdict']): string {
    switch (v) {
      case 'eat': return 'checkmark-circle';
      case 'avoid': return 'close-circle';
      case 'moderate': return 'warning';
      default: return 'swap-horizontal';
    }
  }

  function verdictLabel(v: AdvisorResult['verdict']) {
    switch (v) {
      case 'eat': return 'EAT IT';
      case 'avoid': return 'AVOID';
      case 'moderate': return 'IN MODERATION';
      default: return 'COMPARISON';
    }
  }

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.base },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      gap: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: {
      ...Typography.h3,
      color: Colors.primary,
      fontWeight: '700',
      flex: 1,
    },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.md, paddingBottom: 40, gap: Spacing.md },
    contextRow: {
      flexDirection: 'row',
      gap: 8,
    },
    contextChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: Colors.surface2,
    },
    contextText: {
      ...Typography.caption,
      color: Colors.secondary,
    },
    sectionLabel: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    imageRow: {
      flexDirection: 'row',
      gap: 10,
    },
    imagePlaceholder: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: Colors.surface2,
    },
    imagePlaceholderText: {
      ...Typography.caption,
      color: Colors.muted,
      textAlign: 'center',
    },
    imageThumb: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    imageImg: {
      width: '100%',
      height: '100%',
    },
    imageRemove: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 12,
      padding: 2,
    },
    imageLabel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    imageLabelText: {
      ...Typography.caption,
      color: '#fff',
      fontWeight: '700',
    },
    quickRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    quickChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    quickChipActive: {
      backgroundColor: Colors.accent + '20',
      borderColor: Colors.accent,
    },
    quickChipText: {
      ...Typography.caption,
      color: Colors.secondary,
    },
    quickChipTextActive: {
      color: Colors.accent,
      fontWeight: '600',
    },
    input: {
      backgroundColor: Colors.surface2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 14,
      paddingVertical: 11,
      ...Typography.body,
      color: Colors.primary,
      marginTop: 8,
    },
    askBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    askBtnDisabled: {
      backgroundColor: Colors.surface2,
    },
    askBtnText: {
      ...Typography.body,
      color: '#fff',
      fontWeight: '700',
    },
    resultCard: { gap: 12 },
    verdictRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    verdictLabel: {
      ...Typography.label,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    headline: {
      ...Typography.h4,
      color: Colors.primary,
      fontWeight: '700',
      lineHeight: 22,
    },
    reasoning: {
      ...Typography.small,
      color: Colors.secondary,
      lineHeight: 20,
    },
    recBox: {
      borderRadius: 10,
      padding: 12,
      gap: 4,
    },
    recLabel: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.2,
    },
    recText: {
      ...Typography.small,
      color: Colors.primary,
      fontWeight: '600',
      lineHeight: 18,
    },
    winnerBox: {
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
    },
    winnerLabel: {
      ...Typography.label,
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    winnerText: {
      ...Typography.small,
      color: Colors.primary,
      lineHeight: 18,
    },
    macroNote: {
      ...Typography.caption,
      color: Colors.muted,
      fontStyle: 'italic',
      lineHeight: 17,
    },
    resetBtn: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    resetText: {
      ...Typography.small,
      color: Colors.muted,
    },
  }), [Colors]);

  const canAsk = images.length > 0 && question.trim().length > 0 && !loading;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Food Advisor</Text>
        <Ionicons name="sparkles" size={18} color={Colors.accent} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Today's context */}
        <View style={styles.contextRow}>
          <View style={styles.contextChip}>
            <Text style={styles.contextText}>{calories} / {planTargets.calories} kcal today</Text>
          </View>
          <View style={styles.contextChip}>
            <Text style={styles.contextText}>{protein}g / {planTargets.protein}g protein</Text>
          </View>
        </View>

        {/* Images */}
        <View>
          <Text style={styles.sectionLabel}>SNAP THE FOOD OR PRODUCT</Text>
          <View style={styles.imageRow}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imageThumb}>
                <Image source={{ uri: img.uri }} style={styles.imageImg} resizeMode="cover" />
                <View style={styles.imageLabel}>
                  <Text style={styles.imageLabelText}>
                    {images.length > 1 ? (idx === 0 ? 'Option A' : 'Option B') : 'Item'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.imageRemove} onPress={() => removeImage(idx)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 2 && (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                <Ionicons name="camera" size={26} color={Colors.muted} />
                <Text style={styles.imagePlaceholderText}>
                  {images.length === 0 ? 'Tap to add photo' : 'Add 2nd item\n(optional)'}
                </Text>
              </TouchableOpacity>
            )}
            {images.length === 0 && (
              <View style={[styles.imagePlaceholder, { borderStyle: 'solid', opacity: 0.4 }]}>
                <Ionicons name="image-outline" size={26} color={Colors.muted} />
                <Text style={styles.imagePlaceholderText}>2nd item{'\n'}(optional)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick questions */}
        <View>
          <Text style={styles.sectionLabel}>QUICK QUESTIONS</Text>
          <View style={styles.quickRow}>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.quickChip, question === q && styles.quickChipActive]}
                onPress={() => setQuestion(q)}
              >
                <Text style={[styles.quickChipText, question === q && styles.quickChipTextActive]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Or type your own question..."
            placeholderTextColor={Colors.muted}
            value={question}
            onChangeText={setQuestion}
            multiline
          />
        </View>

        {/* Ask button */}
        <TouchableOpacity
          style={[styles.askBtn, !canAsk && styles.askBtnDisabled]}
          onPress={handleAsk}
          disabled={!canAsk}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={canAsk ? '#fff' : Colors.muted} />
              <Text style={[styles.askBtnText, !canAsk && { color: Colors.muted }]}>Ask AI Advisor</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <Card style={styles.resultCard}>
            <View style={styles.verdictRow}>
              <Ionicons
                name={verdictIcon(result.verdict) as any}
                size={24}
                color={verdictColor(result.verdict)}
              />
              <Text style={[styles.verdictLabel, { color: verdictColor(result.verdict) }]}>
                {verdictLabel(result.verdict)}
              </Text>
            </View>

            <Text style={styles.headline}>{result.headline}</Text>
            <Text style={styles.reasoning}>{result.reasoning}</Text>

            {result.winner && (
              <View style={[styles.winnerBox, { borderColor: Colors.accentGreen + '50', backgroundColor: Colors.accentGreen + '08' }]}>
                <Text style={[styles.winnerLabel, { color: Colors.accentGreen }]}>WINNER</Text>
                <Text style={styles.winnerText}>{result.winner}</Text>
              </View>
            )}

            <View style={[styles.recBox, { backgroundColor: verdictColor(result.verdict) + '12' }]}>
              <Text style={styles.recLabel}>RECOMMENDATION</Text>
              <Text style={styles.recText}>{result.recommendation}</Text>
            </View>

            {result.macroNote && (
              <Text style={styles.macroNote}>{result.macroNote}</Text>
            )}

            <TouchableOpacity style={styles.resetBtn} onPress={() => { setResult(null); setImages([]); setQuestion(''); }}>
              <Text style={styles.resetText}>Start new question</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
