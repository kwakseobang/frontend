"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AvatarUploadSlot } from "@/components/upload/AvatarUploadSlot";
import { UnderlineInput } from "@/components/form/UnderlineInput";
import { PillButton } from "@/components/form/PillButton";
import { getMe, updateMe, updateMyProfileImage } from "@/lib/api/members";
import { useToast } from "@/components/toast/ToastProvider";
import { ApiError } from "@/lib/api/client";
import type { Member } from "@/types/api";
import styles from "./page.module.css";

function EditProfileForm({ member }: { member: Member }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [nickname, setNickname] = useState(member.nickname);
  const [bio, setBio] = useState(member.bio ?? "");

  const handleError = (err: unknown, fallback: string) => {
    showToast(err instanceof ApiError ? err.message : fallback);
  };

  const avatarMutation = useMutation({
    mutationFn: (file: File) => updateMyProfileImage(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member", "me"] }),
    onError: (err) => handleError(err, "이미지 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."),
  });

  const saveMutation = useMutation({
    mutationFn: () => updateMe({ nickname, bio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member", "me"] });
      router.push("/profile");
    },
    onError: (err) => handleError(err, "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."),
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <button className={styles.backButton} onClick={() => router.back()} aria-label="뒤로">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-quaternary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.title}>프로필 수정</div>
        <PillButton variant="compact" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "저장 중..." : "저장"}
        </PillButton>
      </div>

      <div className={styles.avatarRow}>
        <AvatarUploadSlot
          imageUrl={member.profileImageUrl}
          placeholderLetter={nickname.charAt(0) || "사진 변경"}
          onFileSelected={(file) => avatarMutation.mutate(file)}
        />
        <div className={styles.avatarHint}>클릭하거나 이미지를 끌어다 놓아 변경하세요</div>
      </div>

      <div className={styles.label}>닉네임</div>
      <UnderlineInput type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      <div className={styles.usernameHint}>@{member.loginId}</div>

      <div className={[styles.label, styles.bioLabel].join(" ")}>자기소개</div>
      <UnderlineInput
        as="textarea"
        serif
        placeholder="나를 짧게 소개해보세요"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        style={{ minHeight: 96 }}
      />
    </div>
  );
}

export default function EditProfilePage() {
  const { data: member } = useQuery({ queryKey: ["member", "me"], queryFn: getMe });

  if (!member) return null;
  return <EditProfileForm key={member.id} member={member} />;
}
