# Memento

`memento`(Spring Boot 백엔드)의 클라이언트 모노레포.

| 워크스페이스 | 내용 |
| --- | --- |
| `apps/web` | Next.js(App Router) 웹 클라이언트, PWA로 설치 가능 |
| `apps/mobile` | Expo(React Native) 앱 (SDK 57) |
| `packages/core` | 두 클라이언트가 공유하는 API 클라이언트·타입·세션·순수 유틸 |

## 시작하기

백엔드(`../memento`)를 `./gradlew bootRun`으로 함께 띄워야 데이터가 보인다.

```bash
pnpm install

# 웹 — http://localhost:3000
cp apps/web/.env.local.example apps/web/.env.local
pnpm dev

# 모바일 — Expo Go 또는 시뮬레이터
cp apps/mobile/.env.local.example apps/mobile/.env.local   # 기기에서 닿는 주소로 수정
pnpm mobile
```

모바일의 `EXPO_PUBLIC_API_BASE_URL`은 `localhost`로 두면 안 된다 — 기기에서 그건 폰 자신을 가리킨다.

## 명령어

| 명령 | 하는 일 |
| --- | --- |
| `pnpm dev` | 웹 개발 서버 |
| `pnpm build` | 웹 프로덕션 빌드 (타입체크 + lint 포함) |
| `pnpm lint` | 전체 워크스페이스 lint |
| `pnpm test` | 전체 워크스페이스 테스트 |
| `pnpm typecheck` | 전체 워크스페이스 타입체크 |
| `pnpm mobile` | Expo 개발 서버 (`apps/mobile/.env.local` 필요) |
| `pnpm -F @memento/core test` | 공유 레이어 테스트만 |

패키지 매니저는 **pnpm** 고정.

## 문서

- `CLAUDE.md` — 아키텍처 규칙, 코드 컨벤션, 백엔드 연동 규약
- `docs/mobile-rn-plan.md` — React Native 앱 구현 계획 (Phase 0~5)
- `design_handoff_memento_web/` — 디자인 핸드오프 (화면 스펙, 토큰, 목업)
