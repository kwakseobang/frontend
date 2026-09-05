import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts } from "@/theme/tokens";

/** RN counterpart of apps/web UnderlineInput — a bare field on a single hairline rule. */
export function UnderlineInput(props: TextInputProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        {...props}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border2,
  },
  input: {
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingVertical: 12,
    // Android draws its own underline and inner padding on TextInput; both fight the
    // hairline above and make the field sit visibly lower than on iOS.
    paddingHorizontal: 0,
  },
});
