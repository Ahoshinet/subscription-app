import { Button, Host, Image } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  frame,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { Platform, StyleSheet, View } from 'react-native';

type AddSubscriptionButtonProps = {
  label: string;
  onPress: () => void;
};

export default function AddSubscriptionButton({
  label,
  onPress,
}: AddSubscriptionButtonProps) {
  const majorVersion = Number.parseInt(String(Platform.Version), 10);
  const nativeButtonStyle = majorVersion >= 26 ? 'glassProminent' : 'borderedProminent';

  return (
    <View style={styles.container}>
      <Host style={styles.host}>
        <Button
          onPress={onPress}
          modifiers={[
            buttonStyle(nativeButtonStyle),
            buttonBorderShape('circle'),
            controlSize('extraLarge'),
            tint('#3B82F6'),
            frame({ width: 60, height: 60 }),
            accessibilityLabel(label),
          ]}
        >
          <Image systemName="plus" size={25} color="#FFFFFF" />
        </Button>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    width: 64,
    height: 64,
    zIndex: 100,
  },
  host: {
    flex: 1,
  },
});
