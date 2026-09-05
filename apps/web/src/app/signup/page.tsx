"use client";

import { PASSWORD_RULE_HINT, toErrorMessage, validatePassword } from "@/lib/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UnderlineInput } from "@/components/form/UnderlineInput";
import { PillButton } from "@/components/form/PillButton";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { useAuth } from "@/lib/auth/AuthContext";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { useToast } from "@/components/toast/ToastProvider";

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
    // The form already tells the user the rule; checking it here means they find out
    // before a round trip instead of via a backend validation error.
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
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
      setError(toErrorMessage(err, "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GuestOnly>
      <div className={styles.page}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <Link href="/" className={styles.backButton} aria-label="뒤로">
            <BackChevronIcon size={20} />
          </Link>
          <h1 className={styles.title}>기록을 시작해보세요</h1>
          <div className={styles.subtitle}>당신의 순간들을 위한 공간이에요</div>

          <div className={styles.fields}>
            <UnderlineInput
              type="text"
              placeholder="아이디"
              name="loginId"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
            <UnderlineInput
              type="text"
              placeholder="닉네임"
              name="nickname"
              autoComplete="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <div>
              <UnderlineInput
                type="password"
                placeholder="비밀번호"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className={styles.passwordHint}>{PASSWORD_RULE_HINT}</div>
            </div>
            <UnderlineInput
              type="password"
              placeholder="비밀번호 확인"
              name="passwordConfirm"
              autoComplete="new-password"
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
