export type IconSourceOption = 'photos' | 'files' | 'library';

export interface IconSourceSheetProps {
    visible: boolean;
    isDark: boolean;
    onClose: () => void;
    onSelect: (option: IconSourceOption) => void;
}
