import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { PASSWORD_RULE_HINT, toErrorMessage, validatePassword } from "@/lib/core";
import { useAuth } from "@/lib/auth/AuthContext";
import { UnderlineInput } from "@/components/UnderlineInput";
import { PillButton } from "@/components/PillButton";
import { colors, fonts } from "@/theme/tokens";

export default function SignupScreen() {
  const { signup } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Client-side pre-check only — the backend is the authority and will reject anything
    // this misses; it just saves a round trip to say so.
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await signup(loginId.trim(), password, nickname.trim());
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Memento</Text>
          <Text style={styles.tagline}>당신의 순간을 기록하세요</Text>
        </View>

        <View style={styles.fields}>
          <UnderlineInput
            placeholder="아이디"
            value={loginId}
            onChangeText={setLoginId}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="username"
          />
          <UnderlineInput
            placeholder="닉네임"
            value={nickname}
            onChangeText={setNickname}
            autoCorrect={false}
            textContentType="nickname"
          />
          <View>
            <UnderlineInput
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            <Text style={styles.hint}>{PASSWORD_RULE_HINT}</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PillButton onPress={handleSubmit} loading={submitting} style={styles.submit}>
          회원가입
        </PillButton>

        <Text style={styles.footer}>
          이미 계정이 있으신가요?{" "}
          <Text style={styles.footerLink} onPress={() => router.back()}>
            로그인
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
  hint: { fontFamily: fonts.sans, fontSize: 11, color: colors.textMuted, marginTop: 8 },
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
