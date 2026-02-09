import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import { colors } from '../theme/colors';
import { useSeller } from '../context/SellerContext';
import { useToast } from '../context/ToastContext';

const { width } = Dimensions.get('window');

const COLOR_PRESETS = [
    '#FF6B6B', '#FF8E72', '#FFA500', '#FFD93D',
    '#6BCB77', '#4D96FF', '#6C5CE7', '#A29BFE',
    '#FF7675', '#FF6B9D', '#74B9FF', '#81ECEC',
    '#000000', '#FFFFFF', '#2D3436', '#636E72',
];

const GRADIENT_PRESETS = [
    { start: '#FF6B6B', end: '#FFA500', name: 'Sunset' },
    { start: '#6BCB77', end: '#4D96FF', name: 'Ocean' },
    { start: '#6C5CE7', end: '#A29BFE', name: 'Purple' },
    { start: '#FF7675', end: '#FF6B9D', name: 'Pink' },
    { start: '#74B9FF', end: '#81ECEC', name: 'Sky' },
    { start: '#FFD93D', end: '#FF8E72', name: 'Warm' },
    { start: '#000000', end: '#434343', name: 'Dark' },
    { start: '#11998e', end: '#38ef7d', name: 'Mint' },
];

const TEXT_COLORS = ['#FFFFFF', '#000000', '#FFD93D', '#FF6B6B', '#4D96FF', '#6BCB77'];

export const StatusCreatorScreen = ({ navigation }) => {
    const { sellerId } = useSeller();
    const toast = useToast();
    const insets = useSafeAreaInsets();

    // Mode: 'image' or 'text'
    const [statusMode, setStatusMode] = useState('image');

    // Image mode states
    const [image, setImage] = useState(null);
    const [imageCaption, setImageCaption] = useState('');

    // Text mode states
    const [statusText, setStatusText] = useState('');
    const [backgroundType, setBackgroundType] = useState('solid');
    const [solidColor, setSolidColor] = useState('#FF6B6B');
    const [gradientStart, setGradientStart] = useState('#FF6B6B');
    const [gradientEnd, setGradientEnd] = useState('#FFA500');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [fontSize, setFontSize] = useState(28);

    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast.error('Camera permission is required');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const canPost = () => {
        if (statusMode === 'image') {
            return !!image;
        }
        return statusText.trim().length > 0;
    };

    const handlePost = async () => {
        if (!canPost()) {
            toast.error(statusMode === 'image' ? 'Select an image first' : 'Enter status text');
            return;
        }

        if (!sellerId) {
            toast.error('Seller profile not loaded');
            return;
        }

        setLoading(true);
        try {
            if (statusMode === 'image') {
                const fileName = `${sellerId}/${Date.now()}.jpg`;
                const formData = new FormData();
                formData.append('file', {
                    uri: Platform.OS === 'ios' ? image.replace('file://', '') : image,
                    name: 'status.jpg',
                    type: 'image/jpeg',
                });

                const { error: uploadError } = await supabase.storage
                    .from('seller-statuses')
                    .upload(fileName, formData);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('seller-statuses')
                    .getPublicUrl(fileName);

                const { error: dbError } = await supabase
                    .from('express_seller_statuses')
                    .insert({
                        seller_id: sellerId,
                        status_type: 'image',
                        media_url: publicUrl,
                        status_text: imageCaption || null,
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    });

                if (dbError) throw dbError;
            } else {
                const { error } = await supabase
                    .from('express_seller_statuses')
                    .insert({
                        seller_id: sellerId,
                        status_type: 'text',
                        status_text: statusText,
                        background_color: backgroundType === 'solid' ? solidColor : null,
                        gradient_start: backgroundType === 'gradient' ? gradientStart : null,
                        gradient_end: backgroundType === 'gradient' ? gradientEnd : null,
                        text_color: textColor,
                        font_size: fontSize,
                        media_url: 'text-status',
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    });

                if (error) throw error;
            }

            toast.success('Status posted successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Error posting status:', error);
            toast.error('Failed to post status');
        } finally {
            setLoading(false);
        }
    };

    const previewColors = backgroundType === 'solid'
        ? [solidColor, solidColor]
        : [gradientStart, gradientEnd];

    const renderImageMode = () => (
        <>
            <View style={styles.previewContainer}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="image-outline" size={64} color={colors.muted} />
                        <Text style={styles.placeholderText}>Select a vertical image</Text>
                    </View>
                )}

                <View style={styles.imageActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                        <Ionicons name="images" size={22} color={colors.primary} />
                        <Text style={styles.actionText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
                        <Ionicons name="camera" size={22} color={colors.primary} />
                        <Text style={styles.actionText}>Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Caption (optional)</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Add a caption..."
                    placeholderTextColor={colors.muted}
                    multiline
                    value={imageCaption}
                    onChangeText={setImageCaption}
                    maxLength={150}
                />
                <Text style={styles.charCount}>{imageCaption.length}/150</Text>
            </View>
        </>
    );

    const renderTextMode = () => (
        <>
            <LinearGradient
                colors={previewColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.textPreview}
            >
                <Text style={[styles.previewText, { color: textColor, fontSize }]}>
                    {statusText || 'Your text here'}
                </Text>
            </LinearGradient>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status Text</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter your status text..."
                    placeholderTextColor={colors.muted}
                    multiline
                    value={statusText}
                    onChangeText={setStatusText}
                    maxLength={200}
                />
                <Text style={styles.charCount}>{statusText.length}/200</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Font Size</Text>
                <View style={styles.sizeControl}>
                    <TouchableOpacity onPress={() => setFontSize(Math.max(16, fontSize - 2))}>
                        <Ionicons name="remove-circle" size={32} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.sizeValue}>{fontSize}px</Text>
                    <TouchableOpacity onPress={() => setFontSize(Math.min(48, fontSize + 2))}>
                        <Ionicons name="add-circle" size={32} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Background</Text>
                <View style={styles.toggleRow}>
                    <Pressable
                        style={[styles.toggleBtn, backgroundType === 'solid' && styles.toggleBtnActive]}
                        onPress={() => setBackgroundType('solid')}
                    >
                        <Text style={[styles.toggleText, backgroundType === 'solid' && styles.toggleTextActive]}>
                            Solid Color
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.toggleBtn, backgroundType === 'gradient' && styles.toggleBtnActive]}
                        onPress={() => setBackgroundType('gradient')}
                    >
                        <Text style={[styles.toggleText, backgroundType === 'gradient' && styles.toggleTextActive]}>
                            Gradient
                        </Text>
                    </Pressable>
                </View>
            </View>

            {backgroundType === 'solid' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Background Color</Text>
                    <View style={styles.colorGrid}>
                        {COLOR_PRESETS.map((color) => (
                            <Pressable
                                key={color}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: color },
                                    solidColor === color && styles.colorOptionActive,
                                ]}
                                onPress={() => setSolidColor(color)}
                            >
                                {solidColor === color && (
                                    <Ionicons name="checkmark" size={18} color={color === '#FFFFFF' ? '#000' : '#fff'} />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}

            {backgroundType === 'gradient' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gradient</Text>
                    <View style={styles.gradientGrid}>
                        {GRADIENT_PRESETS.map((gradient, idx) => {
                            const isActive = gradientStart === gradient.start && gradientEnd === gradient.end;
                            return (
                                <Pressable
                                    key={idx}
                                    style={[styles.gradientOption, isActive && styles.gradientOptionActive]}
                                    onPress={() => {
                                        setGradientStart(gradient.start);
                                        setGradientEnd(gradient.end);
                                    }}
                                >
                                    <LinearGradient
                                        colors={[gradient.start, gradient.end]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.gradientPreview}
                                    />
                                    {isActive && (
                                        <View style={styles.gradientCheckmark}>
                                            <Ionicons name="checkmark" size={18} color="#fff" />
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Text Color</Text>
                <View style={styles.colorGrid}>
                    {TEXT_COLORS.map((color) => (
                        <Pressable
                            key={color}
                            style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                textColor === color && styles.colorOptionActive,
                            ]}
                            onPress={() => setTextColor(color)}
                        >
                            {textColor === color && (
                                <Ionicons name="checkmark" size={18} color={color === '#FFFFFF' ? '#000' : '#fff'} />
                            )}
                        </Pressable>
                    ))}
                </View>
            </View>
        </>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={colors.dark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Status</Text>
                <TouchableOpacity
                    style={[styles.postButton, (!canPost() || loading) && styles.postButtonDisabled]}
                    onPress={handlePost}
                    disabled={!canPost() || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.postButtonText}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.modeToggle}>
                <Pressable
                    style={[styles.modeTab, statusMode === 'image' && styles.modeTabActive]}
                    onPress={() => setStatusMode('image')}
                >
                    <Ionicons
                        name="image"
                        size={20}
                        color={statusMode === 'image' ? colors.primary : colors.muted}
                    />
                    <Text style={[styles.modeTabText, statusMode === 'image' && styles.modeTabTextActive]}>
                        Image
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.modeTab, statusMode === 'text' && styles.modeTabActive]}
                    onPress={() => setStatusMode('text')}
                >
                    <Ionicons
                        name="text"
                        size={20}
                        color={statusMode === 'text' ? colors.primary : colors.muted}
                    />
                    <Text style={[styles.modeTabText, statusMode === 'text' && styles.modeTabTextActive]}>
                        Text
                    </Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {statusMode === 'image' ? renderImageMode() : renderTextMode()}
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.dark,
    },
    postButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 70,
        alignItems: 'center',
    },
    postButtonDisabled: {
        backgroundColor: colors.muted,
        opacity: 0.6,
    },
    postButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    modeToggle: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    modeTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f8f8f8',
    },
    modeTabActive: {
        backgroundColor: `${colors.primary}15`,
    },
    modeTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.muted,
    },
    modeTabTextActive: {
        color: colors.primary,
    },
    content: {
        padding: 16,
    },
    previewContainer: {
        width: '100%',
        aspectRatio: 9 / 16,
        backgroundColor: '#f8f8f8',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 20,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    placeholderText: {
        marginTop: 12,
        textAlign: 'center',
        color: colors.muted,
        fontSize: 14,
        fontWeight: '500',
    },
    imageActions: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.dark,
    },
    textPreview: {
        width: '100%',
        aspectRatio: 9 / 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        padding: 20,
    },
    previewText: {
        fontWeight: '700',
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.dark,
        marginBottom: 10,
    },
    textInput: {
        fontSize: 15,
        color: colors.dark,
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e8e8e8',
    },
    charCount: {
        textAlign: 'right',
        marginTop: 6,
        color: colors.muted,
        fontSize: 12,
    },
    sizeControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    sizeValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.dark,
        minWidth: 60,
        textAlign: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e8e8e8',
        alignItems: 'center',
    },
    toggleBtnActive: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}15`,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.muted,
    },
    toggleTextActive: {
        color: colors.primary,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorOption: {
        width: (width - 32 - 70) / 8,
        aspectRatio: 1,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionActive: {
        borderColor: colors.dark,
    },
    gradientGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    gradientOption: {
        width: '48%',
        aspectRatio: 2,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    gradientOptionActive: {
        borderColor: colors.dark,
    },
    gradientPreview: {
        width: '100%',
        height: '100%',
    },
    gradientCheckmark: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
});
