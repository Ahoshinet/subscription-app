import type { TextStyle } from 'react-native';

/** Keeps single-line input text optically centered across iOS and Android. */
export const singleLineTextInputStyle: TextStyle = {
    includeFontPadding: false,
    paddingVertical: 0,
    textAlignVertical: 'center',
};
