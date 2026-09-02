import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, fonts, radius } from "@/theme/tokens";

interface PillButtonProps {
  children: string;
  onPress: () => void;
  variant?: "solid" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function PillButton({
  children,
  onPress,
  variant = "solid",
  disabled,
  loading,
  style,
}: PillButtonProps) {
  const isOutline = variant === "outline";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.solid,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.textSecondary : colors.onBrand} />
      ) : (
        <Text style={[styles.label, isOutline && styles.outlineLabel]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    // 44 is the minimum comfortable touch target on both platforms.
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    borderRadius: radius.pill,
  },
  solid: { backgroundColor: colors.brand },
  outline: { borderWidth: 1, borderColor: colors.border2 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  label: { color: colors.onBrand, fontFamily: fonts.sansBold, fontSize: 14 },
  outlineLabel: { color: colors.textSecondary },
});
