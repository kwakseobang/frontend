"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { member, logout } = useAuth();
  const isHome = pathname === "/home";
  const isFavorites = pathname.startsWith("/favorites");
  const isProfile = pathname.startsWith("/profile");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        <div className={styles.logoDot} />
        <div className={styles.logoText}>Memento</div>
        <div className={styles.logoSpacer} />
        <ThemeToggle />
      </div>

      <Link href="/home" className={styles.navItem}>
        <span className={[styles.navBar, isHome ? styles.active : ""].join(" ")} />
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isHome ? "var(--color-text-primary)" : "var(--color-text-secondary)"} strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="3" y1="9" x2="21" y2="9" />
        </svg>
        <span className={[styles.navLabel, isHome ? styles.active : ""].join(" ")}>홈</span>
      </Link>

      <Link href="/favorites" className={styles.navItem}>
        <span className={[styles.navBar, isFavorites ? styles.active : ""].join(" ")} />
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isFavorites ? "var(--color-text-primary)" : "var(--color-text-secondary)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        <span className={[styles.navLabel, isFavorites ? styles.active : ""].join(" ")}>즐겨찾기</span>
      </Link>

      <Link href="/profile" className={styles.navItem}>
        <span className={[styles.navBar, isProfile ? styles.active : ""].join(" ")} />
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isProfile ? "var(--color-text-primary)" : "var(--color-text-secondary)"} strokeWidth="1.8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className={[styles.navLabel, isProfile ? styles.active : ""].join(" ")}>마이페이지</span>
      </Link>

      <Link href="/write" className={styles.newButton}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        새 기록
      </Link>

      <div className={styles.spacer} />

      <div className={styles.divider} />
      <Link href="/profile" className={styles.profileRow}>
        <div className={styles.avatar}>
          {member?.profileImageUrl ? (
            <Image src={member.profileImageUrl} alt="" className={styles.avatarImage} width={30} height={30} />
          ) : (
            member?.nickname.charAt(0)
          )}
        </div>
        <div className={styles.nickname}>{member?.nickname}</div>
      </Link>
      <button className={styles.logout} onClick={handleLogout}>
        로그아웃
      </button>
    </aside>
  );
}
