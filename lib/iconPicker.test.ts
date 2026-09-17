import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Image } from 'react-native';

import { InvalidIconImageError, SUPPORTED_ICON_MIME_TYPES, pickIconImage } from './iconPicker';

const mockGetDocumentAsync = jest.fn<(options: unknown) => Promise<unknown>>();
const mockLaunchImageLibraryAsync = jest.fn<(options: unknown) => Promise<unknown>>();
const mockCrop = jest.fn();
const mockResize = jest.fn();
const mockRenderAsync = jest.fn<() => Promise<unknown>>();
const mockSaveAsync = jest.fn<(options: unknown) => Promise<unknown>>();
const mockRelease = jest.fn();
const mockManipulate = jest.fn();

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: (options: unknown) => mockGetDocumentAsync(options),
}));

jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: (options: unknown) => mockLaunchImageLibraryAsync(options),
}));

jest.mock('expo-image-manipulator', () => ({
    ImageManipulator: { manipulate: (uri: string) => mockManipulate(uri) },
    SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

function mockImageSize(width: number, height: number) {
    jest.spyOn(Image, 'getSize').mockImplementation((_uri, onSuccess) => {
        onSuccess(width, height);
    });
}

describe('pickIconImage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const context = {
            crop: mockCrop,
            resize: mockResize,
            renderAsync: mockRenderAsync,
        };
        mockCrop.mockReturnValue(context);
        mockResize.mockReturnValue(context);
        mockManipulate.mockReturnValue(context);
        mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync, release: mockRelease });
        mockSaveAsync.mockResolvedValue({ uri: 'file:///cache/out.png', width: 512, height: 512 });
    });

    test('only offers formats the upload endpoint accepts in the file browser', async () => {
        mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

        await expect(pickIconImage('files')).resolves.toBeNull();
        expect(mockGetDocumentAsync).toHaveBeenCalledWith(expect.objectContaining({
            type: SUPPORTED_ICON_MIME_TYPES,
        }));
        expect(SUPPORTED_ICON_MIME_TYPES).toEqual(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
    });

    test('centre-crops a file pick to a square and re-encodes it when editing is requested', async () => {
        mockGetDocumentAsync.mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///cache/wide.bmp' }],
        });
        mockImageSize(1600, 900);

        await expect(pickIconImage('files', { allowsEditing: true })).resolves.toEqual({
            uri: 'file:///cache/out.png',
            width: 512,
            height: 512,
        });
        expect(mockManipulate).toHaveBeenCalledWith('file:///cache/wide.bmp');
        expect(mockCrop).toHaveBeenCalledWith({ originX: 350, originY: 0, width: 900, height: 900 });
        expect(mockResize).toHaveBeenCalledWith({ width: 512, height: 512 });
        expect(mockSaveAsync).toHaveBeenCalledWith({ format: 'png' });
        expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    test('keeps an opaque JPEG source as JPEG and skips redundant transforms', async () => {
        mockGetDocumentAsync.mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///cache/photo.jpg' }],
        });
        mockImageSize(400, 400);

        await pickIconImage('files', { allowsEditing: true });
        expect(mockCrop).not.toHaveBeenCalled();
        expect(mockResize).not.toHaveBeenCalled();
        expect(mockSaveAsync).toHaveBeenCalledWith({ compress: 0.9, format: 'jpeg' });
    });

    test('returns the raw file when the caller crops it itself', async () => {
        mockGetDocumentAsync.mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///cache/raw.png' }],
        });
        mockImageSize(300, 200);

        await expect(pickIconImage('files')).resolves.toEqual({
            uri: 'file:///cache/raw.png',
            width: 300,
            height: 200,
        });
        expect(mockManipulate).not.toHaveBeenCalled();
    });

    test('rejects a file the platform cannot decode', async () => {
        mockGetDocumentAsync.mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///cache/scan.tiff' }],
        });
        jest.spyOn(Image, 'getSize').mockImplementation((_uri, _onSuccess, onFailure) => {
            onFailure?.(new Error('decode failed'));
        });

        await expect(pickIconImage('files', { allowsEditing: true })).rejects.toBeInstanceOf(InvalidIconImageError);
        expect(mockManipulate).not.toHaveBeenCalled();
    });

    test('lets the OS photo picker crop to a square when editing is requested', async () => {
        mockLaunchImageLibraryAsync.mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///cache/photo.jpg', width: 800, height: 800 }],
        });

        await expect(pickIconImage('photos', { allowsEditing: true })).resolves.toEqual({
            uri: 'file:///cache/photo.jpg',
            width: 800,
            height: 800,
        });
        expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({
            allowsEditing: true,
            aspect: [1, 1],
        }));
    });
});
