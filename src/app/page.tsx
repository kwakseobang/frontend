import Link from "next/link";
import { PillButton } from "@/components/form/PillButton";
import { GuestOnly } from "@/components/auth/GuestOnly";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <GuestOnly>
      <div className={styles.page}>
        <div className={styles.vignette} />
        <div className={styles.topbar}>
          <div className={styles.logo}>
            <div className={styles.logoDot} />
            <div className={styles.logoText}>Memento</div>
          </div>
          <Link href="/login" className={styles.loginLink}>
            로그인
          </Link>
        </div>

        <div className={styles.hero}>
          <div className={styles.printMock}>
            <div className={styles.printImage} />
            <div className={styles.printCaption}>2026. 08. 18</div>
          </div>
          <div className={styles.headline}>당신의 순간을 기록하세요</div>
          <div className={styles.subtext}>시간이 지나면, 추억이 됩니다</div>
          <Link href="/signup">
            <PillButton variant="large">기록 시작하기</PillButton>
          </Link>
        </div>
      </div>
    </GuestOnly>
  );
}
