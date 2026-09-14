import { Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export type IconSource = 'photos' | 'files';

export interface PickedIconImage {
    uri: string;
    width: number;
    height: number;
}

export class InvalidIconImageError extends Error {
    constructor() {
        super('Selected file is not a readable image');
        this.name = 'InvalidIconImageError';
    }
}

interface PickIconImageOptions {
    /** Let the OS photo picker crop to a square before returning (photos only). */
    allowsEditing?: boolean;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        Image.getSize(
            uri,
            (width, height) => resolve({ width, height }),
            () => reject(new InvalidIconImageError()),
        );
    });
}

/**
 * Opens the photo library or the system file browser and returns the chosen image.
 * Resolves to null when the user cancels; throws InvalidIconImageError when a
 * picked file cannot be decoded as an image.
 */
export async function pickIconImage(
    source: IconSource,
    { allowsEditing = false }: PickIconImageOptions = {},
): Promise<PickedIconImage | null> {
    if (source === 'photos') {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing,
            aspect: allowsEditing ? [1, 1] : undefined,
            quality: allowsEditing ? 0.8 : 1,
        });
        if (result.canceled || !result.assets[0]) return null;
        const asset = result.assets[0];
        return { uri: asset.uri, width: asset.width ?? 1, height: asset.height ?? 1 };
    }

    const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    // Some Android providers ignore the MIME filter, so verify the file decodes.
    const { width, height } = await getImageSize(asset.uri);
    return { uri: asset.uri, width, height };
}
