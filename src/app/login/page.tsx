"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UnderlineInput } from "@/components/form/UnderlineInput";
import { PillButton } from "@/components/form/PillButton";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { useAuth } from "@/lib/auth/AuthContext";
import { toErrorMessage } from "@/lib/errors";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(loginId, password);
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
          <div className={styles.header}>
            <h1 className={styles.logo}>Memento</h1>
            <div className={styles.tagline}>다시, 그 순간으로</div>
          </div>

          {/* autoComplete/autoCapitalize are what let iOS and password managers offer to
              fill and save this login — without them the PWA silently loses that. */}
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
              type="password"
              placeholder="비밀번호"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <PillButton className={styles.submit} disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </PillButton>

          <div className={styles.footer}>
            계정이 없으신가요?{" "}
            <Link href="/signup" className={styles.footerLink}>
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </GuestOnly>
  );
}
