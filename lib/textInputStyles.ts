import type { TextStyle } from 'react-native';

/** Keeps single-line input text optically centered across iOS and Android. */
export const singleLineTextInputStyle: TextStyle = {
    includeFontPadding: false,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'center',
};
