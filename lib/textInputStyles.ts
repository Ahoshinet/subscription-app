import { Platform, type TextStyle } from 'react-native';

/** Keeps single-line input text optically centered across iOS and Android. */
export const singleLineTextInputStyle: TextStyle = {
    includeFontPadding: false,
    paddingTop: 0,
    // Keep the existing iOS alignment for the screens that use this shared
    // style. Individual layouts can opt out when their row already centers it.
    paddingBottom: Platform.OS === 'ios' ? 4 : 0,
    textAlignVertical: 'center',
};
