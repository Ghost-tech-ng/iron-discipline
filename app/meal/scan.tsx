import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { lookupBarcode } from '../../services/barcodeService';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing } from '../../constants/theme';

export default function ScanScreen() {
  const Colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.base },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    closeText: { ...Typography.body, color: Colors.muted, fontSize: 18 },
    title: { ...Typography.h4, color: Colors.primary, fontWeight: '700' },
    camera: { flex: 1 },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    },
    scanFrame: {
      width: 260,
      height: 160,
      borderWidth: 2,
      borderColor: Colors.accent,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    statusBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    statusText: { ...Typography.small, color: Colors.primary },
    hint: {
      ...Typography.small,
      color: Colors.primary,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    permissionBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: 12,
    },
    permTitle: { ...Typography.h3, color: Colors.primary, fontWeight: '700', textAlign: 'center' },
    permSub: { ...Typography.body, color: Colors.secondary, textAlign: 'center', lineHeight: 22 },
    permBtn: {
      backgroundColor: Colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
    },
    permBtnText: { ...Typography.body, color: Colors.base, fontWeight: '700' },
    cancelText: { ...Typography.small, color: Colors.muted },
  }), [Colors]);

  if (!permission) return <View style={styles.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionBox}>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permSub}>
            Allow camera access to scan barcodes on packaged foods.
          </Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleBarcode({ data }: { data: string }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    const food = await lookupBarcode(data);
    setLoading(false);

    if (!food) {
      Alert.alert(
        'Not Found',
        'This product was not found in the Open Food Facts database.',
        [
          { text: 'Scan Again', onPress: () => setScanned(false) },
          { text: 'Cancel', onPress: () => router.back() },
        ]
      );
      return;
    }

    // Pass the result back to the log screen via router params
    router.replace({
      pathname: '/meal/log',
      params: {
        scannedId: food.id,
        scannedName: food.name,
        scannedCalories: food.calories,
        scannedProtein: food.protein,
        scannedCarbs: food.carbs,
        scannedFat: food.fat,
        scannedServing: food.servingSize,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Scan Barcode</Text>
        <View style={{ width: 40 }} />
      </View>

      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          {loading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.statusText}>Looking up product...</Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              {scanned ? 'Processing...' : 'Point camera at barcode'}
            </Text>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
}
