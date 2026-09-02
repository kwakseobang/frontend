import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { toErrorMessage } from "@/lib/core";
import { useAuth } from "@/lib/auth/AuthContext";
import { UnderlineInput } from "@/components/UnderlineInput";
import { PillButton } from "@/components/PillButton";
import { colors, fonts } from "@/theme/tokens";

export default function LoginScreen() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login(loginId.trim(), password);
      router.replace("/home");
    } catch (err) {
      setError(toErrorMessage(err, "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      // Only iOS pushes content out from under the keyboard by itself; Android's
      // windowSoftInputMode already resizes the window, and doubling up over-scrolls.
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Memento</Text>
          <Text style={styles.tagline}>다시, 그 순간으로</Text>
        </View>

        <View style={styles.fields}>
          {/* textContentType/autoComplete are what let iOS and Android password managers
              offer to fill and save this login. */}
          <UnderlineInput
            placeholder="아이디"
            value={loginId}
            onChangeText={setLoginId}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="username"
            returnKeyType="next"
          />
          <UnderlineInput
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PillButton onPress={handleSubmit} loading={submitting} style={styles.submit}>
          로그인
        </PillButton>

        <Text style={styles.footer}>
          계정이 없으신가요?{" "}
          <Text style={styles.footerLink} onPress={() => router.push("/signup")}>
            회원가입
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 },
  header: { alignItems: "center", marginBottom: 44 },
  logo: { fontFamily: fonts.serif, fontSize: 34, color: colors.textPrimary, letterSpacing: 1 },
  tagline: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 10 },
  fields: { gap: 18 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.errorText, marginTop: 18 },
  submit: { marginTop: 32 },
  footer: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 28,
  },
  footerLink: { color: colors.brand },
});
