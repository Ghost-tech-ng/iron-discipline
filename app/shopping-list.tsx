import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useShoppingListStore } from '../store/shoppingListStore';
import { useColors } from '../hooks/useColors';
import { Card } from '../components/ui/Card';
import { Spacing, Typography } from '../constants/theme';

export default function ShoppingListScreen() {
  const Colors = useColors();
  const { sections, toggleItem, resetWeek, totalCount, checkedCount } = useShoppingListStore();

  const total = totalCount();
  const checked = checkedCount();
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  function handleReset() {
    Alert.alert('Reset for new week?', 'This unchecks every item so you can restock.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetWeek },
    ]);
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
    headerTitle: { ...Typography.h3, color: Colors.primary, fontWeight: '700', flex: 1 },
    resetBtn: { padding: 4 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.md, paddingBottom: 40, gap: Spacing.md },
    progressCard: { gap: 10 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabel: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5 },
    progressPct: { ...Typography.h3, fontWeight: '700' },
    progressTrack: { height: 6, backgroundColor: Colors.surface2, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressSub: { ...Typography.caption, color: Colors.muted },
    sectionTitle: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5, marginBottom: 4 },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: Spacing.md,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxDone: { backgroundColor: Colors.accentGreen, borderColor: Colors.accentGreen },
    itemInfo: { flex: 1, gap: 2 },
    itemLabel: { ...Typography.small, color: Colors.primary, fontWeight: '600', lineHeight: 19 },
    itemLabelDone: { color: Colors.secondary, textDecorationLine: 'line-through' },
    itemNote: { ...Typography.caption, color: Colors.muted, lineHeight: 16 },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 48 },
    sectionCard: { padding: 0, overflow: 'hidden' },
    sectionHeaderRow: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: 6,
    },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Shopping List</Text>
        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color={Colors.muted} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>THIS WEEK</Text>
            <Text style={[styles.progressPct, { color: pct === 100 ? Colors.accentGreen : Colors.accent }]}>
              {checked}/{total}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct === 100 ? Colors.accentGreen : Colors.accent }]} />
          </View>
          <Text style={styles.progressSub}>
            {pct === 100 ? 'Fully stocked. Protein floor is covered.' : 'Tick items off as you buy them at the supermarket.'}
          </Text>
        </Card>

        {sections.map((section) => (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <Card style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <Pressable
                    style={styles.itemRow}
                    onPress={() => {
                      toggleItem(section.id, item.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[styles.checkbox, item.checked && styles.checkboxDone]}>
                      {item.checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemLabel, item.checked && styles.itemLabelDone]}>{item.label}</Text>
                      <Text style={styles.itemNote}>{item.note}</Text>
                    </View>
                  </Pressable>
                  {idx < section.items.length - 1 && <View style={styles.sep} />}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
