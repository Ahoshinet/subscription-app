type CropCallback = (uri: string) => void;
let _handler: CropCallback | null = null;

export function setCropHandler(handler: CropCallback) {
    _handler = handler;
}

export function resolveCrop(uri: string) {
    _handler?.(uri);
    _handler = null;
}
