# Memento Web

`memento`(Spring Boot 백엔드)의 웹 클라이언트. React + Next.js(App Router) + TypeScript, PWA로 설치 가능. 디자인 컨셉은 "암실(Darkroom)" — 어두운 배경 위에 인화지(사진/카드)만 빛나는 다크모드 저널링 앱.

@AGENTS.md

## 문서

- `design_handoff_memento_web/README.md` — 화면별 스펙, 디자인 토큰(색상/타이포/spacing/애니메이션), 인터랙션, 상태 구조 (1차 소스)
- `design_handoff_memento_web/ROADMAP.md` — Phase 0~5 구현 순서, 이미 결정된 open questions
- `design_handoff_memento_web/Memento Web.dc.html` — 디자인 레퍼런스 목업. **그대로 붙여넣지 않는다** — 참고해서 컴포넌트로 재구성
- `design_handoff_memento_web/screenshots/` — 화면별 캡처 (픽셀 대조용)
- `../memento/docs/api.md` — 연동 대상 백엔드 API 명세 (엔드포인트, 인증, 페이지네이션 포맷)
- `../memento/docs/architecture.md` — Member/Memory/Media 필드, JWT 흐름, soft delete
- `../memento/docs/requirements.md` — Memory 작성 규칙(글/사진/글+사진, 최소 하나 필수), 공개범위 규칙

## 명령어

- 개발 서버: `pnpm dev`
- 빌드(타입체크+lint 포함): `pnpm build`
- lint: `pnpm lint`
- 패키지 매니저는 **pnpm** 고정.

## 백엔드 연동

- 로컬에서 `../memento`를 `./gradlew bootRun`으로 함께 띄워야 한다 (로컬 MySQL 필요).
- API base URL은 `NEXT_PUBLIC_API_BASE_URL` 환경변수로 설정 (`.env.local`).
- 인증은 `Authorization: Bearer {accessToken}`. 백엔드가 쿠키가 아니라 JSON body로 토큰을 내려주므로 클라이언트가 직접 저장(localStorage)하고 401 시 `/api/auth/reissue`로 재발급한다.
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
- 디자인 토큰은 `styles/tokens.css`(CSS 커스텀 프로퍼티) 하나에만 정의한다. 컴포넌트에 하드코딩된 hex 값을 새로 만들지 않는다.
- API 호출은 `lib/api/*`를 거친다 — 컴포넌트에서 직접 `fetch`를 호출하지 않는다.
- 서버 상태(타임라인/상세/프로필 등)는 React Query로 관리한다. 폼 로컬 상태(draft)만 `useState`.
