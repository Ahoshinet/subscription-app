import { Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
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

/** Formats the icon upload endpoint accepts (see docs/api.md, POST /upload/icon). */
export const SUPPORTED_ICON_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/** Longest edge of a square icon produced by the file-pick crop, matching image-crop.tsx. */
const ICON_OUTPUT_SIZE = 512;

interface PickIconImageOptions {
    /**
     * Return a square, upload-ready icon. Photos go through the OS crop UI;
     * the file browser has no crop UI, so a file pick is centre-cropped and
     * re-encoded as PNG/JPEG instead (which also normalises formats the
     * server rejects, such as BMP or TIFF, when the OS can decode them).
     */
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

// JPEG has no alpha channel, so a transparent PNG/WebP icon would get
// flattened onto a white background. Only use JPEG when the source is known
// to be opaque; anything else (png, webp, gif, bmp, unknown) stays PNG.
export function isOpaqueSource(uri: string): boolean {
    const extension = (uri.split('?')[0].split('.').pop() ?? '').toLowerCase();
    return ['jpg', 'jpeg', 'heic', 'heif'].includes(extension);
}

async function cropToSquareIcon(uri: string, width: number, height: number): Promise<PickedIconImage> {
    const side = Math.min(width, height);
    let context = ImageManipulator.manipulate(uri);
    if (width !== height) {
        context = context.crop({
            originX: Math.floor((width - side) / 2),
            originY: Math.floor((height - side) / 2),
            width: side,
            height: side,
        });
    }
    if (side > ICON_OUTPUT_SIZE) {
        context = context.resize({ width: ICON_OUTPUT_SIZE, height: ICON_OUTPUT_SIZE });
    }

    const rendered = await context.renderAsync();
    try {
        const result = await rendered.saveAsync(
            isOpaqueSource(uri)
                ? { compress: 0.9, format: SaveFormat.JPEG }
                : { format: SaveFormat.PNG },
        );
        return { uri: result.uri, width: result.width, height: result.height };
    } finally {
        rendered.release();
    }
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
        type: SUPPORTED_ICON_MIME_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    // Some Android providers ignore the MIME filter, so verify the file decodes.
    const { width, height } = await getImageSize(asset.uri);
    if (allowsEditing) return cropToSquareIcon(asset.uri, width, height);
    return { uri: asset.uri, width, height };
}
