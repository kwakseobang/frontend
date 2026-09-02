"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AvatarUploadSlot } from "@/components/upload/AvatarUploadSlot";
import { PillButton } from "@/components/form/PillButton";
import { getMe, updateMyProfileImage } from "@/lib/api/members";
import { getDrafts, getMyStatistics } from "@/lib/api/memories";
import { useToast } from "@/components/toast/ToastProvider";
import { toErrorMessage } from "@/lib/errors";
import styles from "./page.module.css";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: member, isLoading } = useQuery({ queryKey: ["member", "me"], queryFn: getMe });
  const { data: statistics } = useQuery({ queryKey: ["memories", "statistics"], queryFn: getMyStatistics });
  const { data: drafts } = useQuery({ queryKey: ["memories", "drafts"], queryFn: getDrafts });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => updateMyProfileImage(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member", "me"] }),
    onError: (err) => {
      showToast(toErrorMessage(err, "이미지 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
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
            <h1 className={styles.nickname}>{member.nickname}</h1>
            <div className={styles.username}>@{member.loginId}</div>
          </div>
        </div>
        <Link href="/profile/edit">
          <PillButton variant="outline">프로필 수정</PillButton>
        </Link>
      </div>
      <div className={styles.bio}>{member.bio}</div>

      {statistics && (
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{statistics.totalCount}개</span>
            <span className={styles.statLabel}>총 기록</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{statistics.daysTogether}일째</span>
            <span className={styles.statLabel}>함께한 날</span>
          </div>
        </div>
      )}

      <Link href="/drafts" className={styles.draftRow}>
        <div className={styles.draftIcon}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-quaternary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4Z" />
          </svg>
        </div>
        <div className={styles.draftText}>
          <div className={styles.draftLabel}>임시저장</div>
          <div className={styles.draftCaption}>
            {drafts ? `${drafts.length}개의 쓰다 만 기록` : "쓰다 만 기록을 이어서 완성해보세요"}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  );
}
