"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AvatarUploadSlot } from "@/components/upload/AvatarUploadSlot";
import { PillButton } from "@/components/form/PillButton";
import { getMe, updateMyProfileImage } from "@/lib/api/members";
import { useToast } from "@/components/toast/ToastProvider";
import { ApiError } from "@/lib/api/client";
import styles from "./page.module.css";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: member, isLoading } = useQuery({ queryKey: ["member", "me"], queryFn: getMe });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => updateMyProfileImage(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member", "me"] }),
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : "이미지 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    },
  });

  if (isLoading || !member) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.identity}>
          <AvatarUploadSlot
            imageUrl={member.profileImageUrl}
            placeholderLetter={member.nickname.charAt(0)}
            onFileSelected={(file) => avatarMutation.mutate(file)}
          />
          <div>
            <div className={styles.nickname}>{member.nickname}</div>
            <div className={styles.username}>@{member.loginId}</div>
          </div>
        </div>
        <Link href="/profile/edit">
          <PillButton variant="outline">프로필 수정</PillButton>
        </Link>
      </div>
      <div className={styles.bio}>{member.bio}</div>
    </div>
  );
}
