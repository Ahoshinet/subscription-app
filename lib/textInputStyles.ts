import { Platform, type TextStyle } from 'react-native';

/** Keeps single-line input text optically centered across iOS and Android. */
export const singleLineTextInputStyle: TextStyle = {
    includeFontPadding: false,
    paddingTop: 0,
    // UIKit centers the line box slightly below the optical center. Insetting
    // only the bottom moves the text up without moving the input itself.
    paddingBottom: Platform.OS === 'ios' ? 4 : 0,
    textAlignVertical: 'center',
};
