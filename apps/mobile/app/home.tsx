import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { memoriesApi, toErrorMessage } from "@/lib/core";
import { useAuth } from "@/lib/auth/AuthContext";
import { PillButton } from "@/components/PillButton";
import { colors, fonts } from "@/theme/tokens";

/**
 * Phase 1 placeholder. Its job is to prove the plumbing end to end — a session read back
 * out of SecureStore, an authenticated GET, and a token reissue on 401 — not to be the
 * real home screen. Phase 3 replaces it with the calendar/list port.
 */
export default function HomeScreen() {
  const { member, logout } = useAuth();
  const statistics = useQuery({
    queryKey: ["memories", "statistics"],
    queryFn: memoriesApi.getMyStatistics,
  });

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>기록</Text>
        <Text style={styles.subtitle}>
          {member ? `${member.nickname} (@${member.loginId})` : "프로필 불러오는 중..."}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>연동 확인</Text>
          {statistics.isLoading ? (
            <ActivityIndicator color={colors.brand} />
          ) : statistics.isError ? (
            <Text style={styles.error}>
              {toErrorMessage(statistics.error, "통계를 불러오지 못했습니다.")}
            </Text>
          ) : (
            <Text style={styles.stat}>
              총 {statistics.data?.totalCount ?? 0}개 · 함께한 날 {statistics.data?.daysTogether ?? 0}일
            </Text>
          )}
        </View>

        <PillButton variant="outline" onPress={() => router.push("/multipart-spike")}>
          멀티파트 업로드 검증
        </PillButton>
        <PillButton variant="outline" onPress={handleLogout} style={styles.logout}>
          로그아웃
        </PillButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 28, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  card: {
    backgroundColor: colors.panel1,
    borderWidth: 1,
    borderColor: colors.border1,
    borderRadius: 10,
    padding: 18,
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.textSecondary },
  stat: { fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.errorText },
  logout: { marginTop: 4 },
});
