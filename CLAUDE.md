# Memento

`memento`(Spring Boot 백엔드)의 클라이언트 모노레포. 디자인 컨셉은 "암실(Darkroom)" — 어두운 배경 위에 인화지(사진/카드)만 빛나는 다크모드 저널링 앱.

- `apps/web` — React + Next.js(App Router) + TypeScript, PWA로 설치 가능
- `apps/mobile` — Expo(React Native) 앱 *(Phase 1부터 생성)*
- `packages/core` — 두 클라이언트가 공유하는 API 클라이언트·타입·세션·순수 유틸

@apps/web/AGENTS.md

## 문서

- `design_handoff_memento_web/README.md` — 화면별 스펙, 디자인 토큰(색상/타이포/spacing/애니메이션), 인터랙션, 상태 구조 (1차 소스)
- `design_handoff_memento_web/ROADMAP.md` — Phase 0~5 구현 순서, 이미 결정된 open questions
- `design_handoff_memento_web/Memento Web.dc.html` — 디자인 레퍼런스 목업. **그대로 붙여넣지 않는다** — 참고해서 컴포넌트로 재구성
- `design_handoff_memento_web/screenshots/` — 화면별 캡처 (픽셀 대조용)
- `../memento/docs/api.md` — 연동 대상 백엔드 API 명세 (엔드포인트, 인증, 페이지네이션 포맷)
- `../memento/docs/architecture.md` — Member/Memory/Media 필드, JWT 흐름, soft delete
- `../memento/docs/requirements.md` — Memory 작성 규칙(글/사진/글+사진, 최소 하나 필수), 공개범위 규칙

## 명령어

루트에서 실행한다 (내부적으로 `pnpm -F`로 워크스페이스를 지정).

- 웹 개발 서버: `pnpm dev`
- 웹 빌드(타입체크+lint 포함): `pnpm build`
- 전체 lint: `pnpm lint` / 전체 테스트: `pnpm test`
- 개별 워크스페이스: `pnpm -F @memento/web <script>`, `pnpm -F @memento/core test`
- 패키지 매니저는 **pnpm** 고정. 워크스페이스는 `apps/*`, `packages/*`.

## 백엔드 연동

- 로컬에서 `../memento`를 `./gradlew bootRun`으로 함께 띄워야 한다 (로컬 MySQL 필요).
- API base URL은 `NEXT_PUBLIC_API_BASE_URL` 환경변수로 설정 (`.env.local`).
- 인증은 `Authorization: Bearer {accessToken}`. 백엔드가 쿠키가 아니라 JSON body로 토큰을 내려주므로 클라이언트가 직접 저장하고 401 시 `/api/auth/reissue`로 재발급한다. 세션은 `packages/core`가 **메모리에 들고** 플랫폼 저장소(웹 localStorage / RN SecureStore)에 미러링한다 — SecureStore가 비동기라서 저장소를 매번 읽는 구조로는 공유가 안 되기 때문.
- 로그인 식별자는 **`loginId`** (이메일 아님 — 백엔드에 email 필드 없음). UI 라벨은 "아이디"를 쓴다.
- 공개 프로필/조회 URI는 `nickname` 기준 (`memberId` 노출 금지).

## 디자인 원칙

- `Memento Web.dc.html`은 레퍼런스일 뿐, 그대로 복사하지 않는다. 색상/타이포/spacing 값은 정확히 재현하되 구조는 재사용 가능한 컴포넌트로 분해한다 (`README.md`가 "카드는 3곳 이상에서 재사용된다"처럼 컴포넌트화 신호를 명시함).
- 사진 그라디언트 placeholder와 `image-slot` 드래그앤드롭은 실제 파일 업로드 로직으로 대체한다 (디자인 그대로 두지 않는다).
- 데스크톱 전용으로 디자인되었지만, 이 구현에서는 반응형으로 재구성한다 (사이드바 → 모바일 하단 네비 등). PWA는 모바일에도 설치되기 때문.
- 이미지 첨부는 기록당 최대 5장.
- 마이페이지에 `GET /api/memories/statistics`(총 기록 수 `totalCount`, 함께한 날 `daysTogether`) 통계를 표시한다. "공개 프로필 링크"는 이번 스코프에서 의도적으로 제외한다.
- 공개 프로필 화면(`/u/[nickname]`, `/u/[nickname]/[id]`, README 9번 항목)은 이번 스코프에서 제외한다 — 구현하지 않는다.

## 코드 컨벤션

- 컴포넌트는 화면(`app/**/page.tsx`)과 재사용 UI(`components/**`)를 분리한다. 3곳 이상 반복되는 패턴만 공용 컴포넌트로 추출한다 (예: `MemoryCard`, `UnderlineInput`, `PillButton`).
- 디자인 토큰은 `apps/web/src/styles/tokens.css`(CSS 커스텀 프로퍼티) 하나에만 정의한다. 컴포넌트에 하드코딩된 hex 값을 새로 만들지 않는다.
- API 호출은 `@memento/core`를 거친다 — 컴포넌트에서 직접 `fetch`를 호출하지 않는다.
- 서버 상태(타임라인/상세/프로필 등)는 React Query로 관리한다. 폼 로컬 상태(draft)만 `useState`.

## packages/core (공유 레이어)

- **플랫폼 API를 쓰지 않는다.** `window`, `document`, `localStorage`, `process.env`, Next/Expo 모듈 금지. 어기면 웹에서는 통과하고 RN에서만 깨진다.
- 플랫폼이 필요한 4가지(base URL, 토큰 저장소, 401 처리, multipart 조립)는 `configureCore()`로 주입받는다 — `packages/core/src/config.ts` 참고.
- 테스트는 `environment: "node"`로 돈다. DOM이 필요한 테스트는 core에 두지 않는다.

### 웹에서 core를 쓰는 법

`@memento/core`를 **직접 import하지 않는다.** 항상 `@/lib/core` 배럴을 거친다 — 이 배럴이 `configureCore()` 실행을 보장한다. 직접 import하면 컴파일은 되고 서버 컴포넌트(`app/entry/[id]/page.tsx`의 `generateMetadata`)에서만 런타임에 터진다: RSC 패스는 클라이언트 모듈 본문을 평가하지 않으므로 설정이 붙지 않는다.

## 모바일

- 구현 계획은 `docs/mobile-rn-plan.md` (Phase 0~5). Phase 0(모노레포 재편) 완료.
- Expo SDK 57 + expo-router. `apps/mobile`은 Phase 1에서 생성한다.
- **`POST /api/memories`의 multipart JSON 파트가 Phase 1 최우선 검증 항목이다** — RN의 `FormData`는 `Blob` 파트의 Content-Type을 유실시키는데 Spring `@RequestPart`가 그걸 요구한다.
