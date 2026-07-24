import React from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { resolveCrop } from '@/lib/imageCropStore';

const { width: SCREEN_W } = Dimensions.get('window');
const CROP_SIZE = SCREEN_W - 48;
const CORNER = 22;
const BORDER = 3;

export default function ImageCropScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { uri, width: wStr, height: hStr } = useLocalSearchParams<{
        uri: string;
        width: string;
        height: string;
    }>();

    const imageW = Math.max(1, Number(wStr));
    const imageH = Math.max(1, Number(hStr));
    const baseScale = Math.max(CROP_SIZE / imageW, CROP_SIZE / imageH);
    const displayW = imageW * baseScale;
    const displayH = imageH * baseScale;

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const clamp = (v: number, lo: number, hi: number) => {
        'worklet';
        return Math.min(hi, Math.max(lo, v));
    };

    const maxT = (s: number) => {
        'worklet';
        return {
            x: Math.max(0, (displayW * s - CROP_SIZE) / 2),
            y: Math.max(0, (displayH * s - CROP_SIZE) / 2),
        };
    };

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            const s = clamp(savedScale.value * e.scale, 1, 5);
            scale.value = s;
            const { x: mx, y: my } = maxT(s);
            translateX.value = clamp(translateX.value, -mx, mx);
            translateY.value = clamp(translateY.value, -my, my);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            const { x: mx, y: my } = maxT(scale.value);
            translateX.value = clamp(savedTranslateX.value + e.translationX, -mx, mx);
            translateY.value = clamp(savedTranslateY.value + e.translationY, -my, my);
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const composed = Gesture.Simultaneous(pinch, pan);

    const imageStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    const handleUse = async () => {
        const s = scale.value;
        const tx = translateX.value;
        const ty = translateY.value;
        const totalScale = baseScale * s;

        const originX = Math.max(0, imageW / 2 - (CROP_SIZE / 2 + tx) / totalScale);
        const originY = Math.max(0, imageH / 2 - (CROP_SIZE / 2 + ty) / totalScale);
        const cropW = Math.min(imageW - originX, CROP_SIZE / totalScale);
        const cropH = Math.min(imageH - originY, CROP_SIZE / totalScale);

        const result = await manipulateAsync(
            uri,
            [
                { crop: { originX: Math.round(originX), originY: Math.round(originY), width: Math.round(cropW), height: Math.round(cropH) } },
                { resize: { width: 512, height: 512 } },
            ],
            { compress: 0.9, format: SaveFormat.JPEG }
        );

        resolveCrop(result.uri);
        router.back();
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.headerBtn}>
                    <Text style={styles.cancel}>{t('image_crop.cancel')}</Text>
                </Pressable>
                <Text style={styles.title}>{t('image_crop.title')}</Text>
                <Pressable onPress={handleUse} style={styles.headerBtn}>
                    <Text style={styles.use}>{t('image_crop.use')}</Text>
                </Pressable>
            </View>

            <View style={styles.center}>
                <GestureDetector gesture={composed}>
                    <View style={[styles.cropBox, { width: CROP_SIZE, height: CROP_SIZE }]}>
                        <Animated.Image
                            source={{ uri }}
                            style={[
                                {
                                    width: displayW,
                                    height: displayH,
                                    position: 'absolute',
                                    left: (CROP_SIZE - displayW) / 2,
                                    top: (CROP_SIZE - displayH) / 2,
                                },
                                imageStyle,
                            ]}
                        />
                        {/* Rule-of-thirds grid */}
                        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                            <View style={[styles.gridV, { left: CROP_SIZE / 3 }]} />
                            <View style={[styles.gridV, { left: (CROP_SIZE * 2) / 3 }]} />
                            <View style={[styles.gridH, { top: CROP_SIZE / 3 }]} />
                            <View style={[styles.gridH, { top: (CROP_SIZE * 2) / 3 }]} />
                        </View>
                        {/* Corner markers */}
                        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                            <View style={[styles.cH, { top: 0, left: 0 }]} />
                            <View style={[styles.cV, { top: 0, left: 0 }]} />
                            <View style={[styles.cH, { top: 0, right: 0 }]} />
                            <View style={[styles.cV, { top: 0, right: 0 }]} />
                            <View style={[styles.cH, { bottom: 0, left: 0 }]} />
                            <View style={[styles.cV, { bottom: 0, left: 0 }]} />
                            <View style={[styles.cH, { bottom: 0, right: 0 }]} />
                            <View style={[styles.cV, { bottom: 0, right: 0 }]} />
                        </View>
                    </View>
                </GestureDetector>
            </View>

            <Text style={styles.hint}>{t('image_crop.hint')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    headerBtn: { minWidth: 90 },
    title: { color: '#fff', fontSize: 16, fontWeight: '600' },
    cancel: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
    use: { color: '#3B82F6', fontSize: 16, fontWeight: '700', textAlign: 'right' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cropBox: { overflow: 'hidden', borderRadius: 8 },
    gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
    gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
    cH: { position: 'absolute', width: CORNER, height: BORDER, backgroundColor: '#fff' },
    cV: { position: 'absolute', width: BORDER, height: CORNER, backgroundColor: '#fff' },
    hint: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', paddingVertical: 24 },
});
