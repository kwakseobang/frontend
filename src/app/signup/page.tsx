"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UnderlineInput } from "@/components/form/UnderlineInput";
import { PillButton } from "@/components/form/PillButton";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/toast/ToastProvider";
import { ApiError } from "@/lib/api/client";
import styles from "./page.module.css";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { showToast } = useToast();
  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await signup(loginId, password, nickname);
      showToast("가입이 완료되었습니다");
      router.push("/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GuestOnly>
      <div className={styles.page}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <Link href="/" className={styles.backButton} aria-label="뒤로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-quaternary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className={styles.title}>기록을 시작해보세요</div>
          <div className={styles.subtitle}>당신의 순간들을 위한 공간이에요</div>

          <div className={styles.fields}>
            <UnderlineInput
              type="text"
              placeholder="아이디"
              name="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
            <UnderlineInput
              type="text"
              placeholder="닉네임"
              name="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <div>
              <UnderlineInput
                type="password"
                placeholder="비밀번호"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div style={{ font: "11px var(--font-sans)", color: "var(--color-text-muted)", marginTop: 9 }}>
                8자 이상, 특수문자 포함
              </div>
            </div>
            <UnderlineInput
              type="password"
              placeholder="비밀번호 확인"
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <PillButton className={styles.submit} disabled={submitting}>
            {submitting ? "가입 중..." : "가입하기"}
          </PillButton>

          <div className={styles.footer}>
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className={styles.footerLink}>
              로그인
            </Link>
          </div>
        </form>
      </div>
    </GuestOnly>
  );
}
