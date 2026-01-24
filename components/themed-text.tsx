import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'bigTitle' | 'small' | 'smallMedium' | 'medium' | 'large' | 'xlarge' | 'huge' | 'hugeTitle';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'bigTitle' ? styles.bigTitle : undefined,
        type === 'small' ? styles.small : undefined,
        type === 'smallMedium' ? styles.smallMedium : undefined,
        type === 'medium' ? styles.medium : undefined,
        type === 'large' ? styles.large : undefined,
        type === 'xlarge' ? styles.xlarge : undefined,
        type === 'huge' ? styles.huge : undefined,
        type === 'hugeTitle' ? styles.hugeTitle : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Base sizes
  default: {
    fontSize: 16,
    lineHeight: 20, // 16 * 1.25
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 20, // 16 * 1.25
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 24, // 20 * 1.2
    fontWeight: 'bold',
  },
  link: {
    fontSize: 16,
    lineHeight: 20, // 16 * 1.25
    color: '#0a7ea4',
  },
  // Small sizes
  small: {
    fontSize: 12,
    lineHeight: 15, // 12 * 1.25
  },
  smallMedium: {
    fontSize: 14,
    lineHeight: 18, // 14 * 1.29
  },
  // Medium sizes
  medium: {
    fontSize: 18,
    lineHeight: 23, // 18 * 1.28
  },
  // Large sizes
  large: {
    fontSize: 24,
    lineHeight: 30, // 24 * 1.25
  },
  xlarge: {
    fontSize: 28,
    lineHeight: 35, // 28 * 1.25
  },
  // Title sizes
  title: {
    fontSize: 32,
    lineHeight: 40, // 32 * 1.25
    fontWeight: 'bold',
  },
  huge: {
    fontSize: 36,
    lineHeight: 45, // 36 * 1.25
  },
  bigTitle: {
    fontSize: 48,
    lineHeight: 60, // 48 * 1.25
    fontWeight: 'bold',
  },
  hugeTitle: {
    fontSize: 64,
    lineHeight: 80, // 64 * 1.25
    fontWeight: 'bold',
  },
});
