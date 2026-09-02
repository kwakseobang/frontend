import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ApiError, memoriesApi, todayIso, validateImage, type FileRef } from "@/lib/core";
import { PillButton } from "@/components/PillButton";
import { colors, fonts } from "@/theme/tokens";

/**
 * Phase 1 risk spike — the one thing in this port that cannot be settled by reading code.
 *
 * The backend takes POST /api/memories as multipart with a `request` part that must carry
 * Content-Type: application/json (Spring's @RequestPart). On the web that is a typed Blob;
 * React Native's FormData drops the content type on Blob parts, so the adapter in
 * src/lib/core/configure.ts writes the JSON to a real file and appends it as a file part.
 *
 * This screen exercises that path against the real backend. If it fails, the fallback is
 * to have the backend also accept `request` as a plain string form field — and knowing
 * that before Phase 3 is the whole point, because the write screen is built on top of it.
 *
 * Delete this route once Phase 3 ships the real write screen.
 */
export default function MultipartSpikeScreen() {
  const [asset, setAsset] = useState<FileRef | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const append = (line: string) => setLog((prev) => [...prev, line]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      append("✗ 사진 접근 권한이 거부되었습니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled) return;

    const picked = result.assets[0];
    // Android often reports no fileSize; validateImage passes on an unknown size and
    // leaves the cap to the backend.
    const rejection = validateImage({ type: picked.mimeType ?? "", size: picked.fileSize });
    if (rejection) {
      append(`✗ ${rejection} (mimeType=${picked.mimeType ?? "없음"})`);
      return;
    }
    setAsset({
      uri: picked.uri,
      name: picked.fileName ?? "photo.jpg",
      type: picked.mimeType ?? "image/jpeg",
    });
    setPreview(picked.uri);
    append(`✓ 사진 선택됨 — ${picked.fileName ?? "photo.jpg"} (${picked.mimeType ?? "타입 불명"})`);
  };

  const run = async (withImage: boolean) => {
    setRunning(true);
    append(withImage ? "→ 글+사진으로 POST /api/memories" : "→ 글만으로 POST /api/memories");
    try {
      const id = await memoriesApi.createMemory({
        content: `멀티파트 검증 ${new Date().toLocaleTimeString("ko-KR")}`,
        memoryAt: `${todayIso()}T${new Date().toTimeString().slice(0, 5)}`,
        visibility: "PRIVATE",
        images: withImage && asset ? [asset] : undefined,
      });
      append(`✓ 성공 — 생성된 id=${id}`);
      append("  → JSON 파트가 파일로 전송돼도 @RequestPart가 받아들인다는 뜻.");
    } catch (err) {
      if (err instanceof ApiError) {
        append(`✗ 실패 — HTTP ${err.status} ${err.code ?? ""}`);
        append(`  ${err.message}`);
        if (err.status === 400 || err.status === 415) {
          append("  → 1안 실패. 백엔드가 request를 문자열 폼 필드로도 받게 하는 2안으로 간다.");
        }
      } else {
        append(`✗ 실패 — ${String(err)}`);
        append("  → 네트워크 계층. EXPO_PUBLIC_API_BASE_URL이 기기에서 닿는 주소인지 확인.");
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>멀티파트 업로드 검증</Text>
        <Text style={styles.body}>
          RN의 FormData는 Blob 파트의 Content-Type을 유실시키는데 Spring @RequestPart는 그걸
          요구한다. 어댑터는 JSON을 파일로 써서 파일 파트로 보낸다 — 실제로 통하는지 확인한다.
        </Text>

        {preview ? <Image source={{ uri: preview }} style={styles.preview} contentFit="cover" /> : null}

        <PillButton variant="outline" onPress={pickImage} disabled={running}>
          사진 선택
        </PillButton>
        <PillButton onPress={() => run(false)} loading={running}>
          1. 글만 전송
        </PillButton>
        <PillButton onPress={() => run(true)} loading={running} disabled={!asset}>
          2. 글+사진 전송
        </PillButton>

        <View style={styles.logBox}>
          {log.length === 0 ? (
            <Text style={styles.logMuted}>아직 실행 기록이 없습니다.</Text>
          ) : (
            log.map((line, i) => (
              <Text key={i} style={styles.logLine}>
                {line}
              </Text>
            ))
          )}
        </View>

        <PillButton variant="outline" onPress={() => router.back()}>
          뒤로
        </PillButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 12 },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary },
  body: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  preview: { width: "100%", height: 180, borderRadius: 4, marginVertical: 4 },
  logBox: {
    backgroundColor: colors.panel1,
    borderWidth: 1,
    borderColor: colors.border1,
    borderRadius: 8,
    padding: 14,
    gap: 5,
    marginVertical: 6,
  },
  logMuted: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted },
  logLine: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.textPrimary },
});
