# Handoff: Memento Web (다크모드 "암실" 리디자인)

## Overview
Memento의 웹 버전 — 개인 순간을 텍스트+사진으로 기록하고, 선택적으로 공개하는 저널링 앱. 이 핸드오프는 데스크톱 웹 경험 전체(랜딩 → 로그인/가입 → 홈 타임라인 → 상세 → 작성 → 마이페이지 → 공개 프로필)를 다룬다.

## About the Design Files
이 폴더의 HTML 파일은 **디자인 레퍼런스**다. 그대로 프로덕션에 붙여넣을 코드가 아니라, 의도한 룩앤필과 인터랙션을 보여주는 목업이다. 실제 작업은 이 HTML을 참고해서 **타깃 코드베이스의 기존 스택(React/Vue/기타, 상태관리, 라우팅, 컴포넌트 패턴)으로 다시 구현**하는 것이다. 스택이 아직 없다면 이 프로젝트에 가장 적합한 프레임워크를 새로 선택해 구현한다.

## Fidelity
**High-fidelity.** 색상 hex 값, 타이포그래피, spacing, 호버/포커스 상태까지 목업에 그대로 확정되어 있다. 픽셀 단위로 재현하는 것을 목표로 한다.

## Design concept — "암실 (Darkroom)"
어두운 방 안에서 인화지(사진)만 빛나는 은유. 본문 텍스트는 세리프(Gowun Batang)로 — 사용자가 쓴 글이 가장 아름다운 요소가 되도록. UI 라벨/버튼은 산세리프(Noto Sans KR). 카드는 인화지처럼 살짝 회전되어 쌓여 있고, 호버 시 기울기가 펴지며 떠오른다. 작성 화면 자체도 인화지 위에 쓰는 형태.

## Screens / Views

### 1. 랜딩 (Landing)
- **목적**: 첫 진입, 제품 정체성 전달, 가입/로그인 유도.
- **레이아웃**: 전체화면, `background:#0a0908` + 중앙 상단에 라디얼 비네트(`radial-gradient(ellipse 55% 45% at 50% 34%, rgba(150,112,79,.20), transparent 72%)`). 상단바(로고+로그인), 중앙에 부유하는 인화지 목업 + 헤드라인 + CTA.
- **컴포넌트**:
  - 로고: 8-9px 원(`#96704f`) + "Memento" (Gowun Batang 400 21px, `#f4efe6`)
  - 로그인 링크: Noto Sans KR 600 13px `#a69d8c`, hover → `#f4efe6` + `rgba(244,239,230,.06)` 배경, 8px 14px 패딩, radius 999px
  - 인화지 목업: 264×264px 그라디언트 이미지(`linear-gradient(150deg,#e8c79a,#c08b62 48%,#7d5a41)`) + 15px 크림 프레임(`#f4efe4`) + 하단 60px 캡션 영역(날짜, Gowun Batang 14px `#8b7355`). `box-shadow:0 34px 64px rgba(0,0,0,.62)`. `drift` 애니메이션: 9초 주기 -1.5deg 고정 회전 + Y축 0→-10px 왕복.
  - 헤드라인: Gowun Batang 400 50px/1.34, `#f4efe6`, letter-spacing -.01em — "당신의 순간을 기록하세요"
  - 서브텍스트: Noto Sans KR 15px/1.7 `#8f8778` — "시간이 지나면, 추억이 됩니다"
  - CTA 버튼: `#96704f` 배경, 흰 텍스트, 15px 38px 패딩, radius 999px, 700 14px, `box-shadow:0 10px 26px rgba(150,112,79,.28)`, hover → `#a87f5a`, active → `scale(.98)` — "기록 시작하기"

### 2. 로그인 / 회원가입
- **레이아웃**: 중앙 정렬, max-width 340-360px, fadeUp 진입 애니메이션(.4s).
- **입력 필드**: 박스가 아니라 **밑줄형**. `background:transparent; border:none; border-bottom:1px solid #2e2a24`, focus → `border-bottom-color:#96704f`. 패딩 10px 2px. 텍스트 15px `#f4efe6`.
- **제출 버튼**: 랜딩 CTA와 동일 스타일, full width.
- **하단 링크**: Noto Sans KR 13px `#6d6558`, 강조 링크 `#b08862`.
- 회원가입 전용: 비밀번호 아래 헬프텍스트 11px `#5c5549` — "8자 이상, 특수문자 포함".

### 3. 앱 셸 (사이드바 + 콘텐츠)
- **사이드바**: 폭 226px, `background:#0e0c0b`, 우측 보더 `1px solid #1c1916`, 패딩 26px 14px.
  - 로고 (8px 도트 + Gowun Batang 20px)
  - 네비 아이템(홈/마이페이지): 좌측 **2px×16px 세로 바**가 활성 표시(배경칩 대신) — 활성 시 `#96704f`, 비활성 시 투명. 아이콘 stroke `#f4efe6`(활성)/`#8f8778`(비활성). hover는 `rgba(244,239,230,.05)` 배경.
  - "새 기록" 버튼: `#96704f` 배경, + 아이콘, radius 9px, hover `#a87f5a`.
  - 하단: 구분선(`1px #1c1916`) → 아바타(원형, 이미지 슬롯) + 닉네임 → 로그아웃(`#5c5549`, 붉은색 아님, hover `#a69d8c`).
- **콘텐츠 영역**: max-width 1160px, 패딩 52px 60px 96px.

### 4. 홈 타임라인
- **헤더**: "기록" (Gowun Batang 400 34px) + "ROLL NO. 00X" 모노스페이스 캡션. 우측에 달력/목록 세그먼트 토글(pill, `#141210` 배경 트랙).
- **빈 상태**: 점선 테두리 인화지 실루엣(-2deg 회전) + "아직 기록이 없습니다" + CTA.
- **달력 뷰**: 좌측 296px 패널(`#100e0d`, border `#1c1916`, radius 14px) — 월 라벨, 요일 헤더, 7열 그리드 셀(선택 시 `#96704f` 채움, 오늘은 아웃라인, 기록 있는 날은 dot). 우측에 선택된 날짜의 카드 그리드(2열).
- **목록 뷰**: 날짜별로 그룹핑, 각 그룹 헤더 옆에 가로선. 카드 3열 그리드.
- **기록 카드("인화지")**: `background:#f4efe4`, 패딩 13px 13px 17px, radius 3px, `box-shadow:0 18px 34px rgba(0,0,0,.46)`, `transform:rotate(±1deg)`. 이미지(aspect-ratio 1) → 본문 텍스트(Gowun Batang 15px/1.72 `#332b22`, 3줄 클램프) → 시간(모노스페이스 10.5px `#9a8256`) + 공개 배지. **hover**: `rotate(0) translateY(-8px)` + 그림자 확대(.3s cubic-bezier(.2,.7,.3,1)) — "집어드는" 제스처.

### 5. 기록 상세 / 공개 상세
- 상단: 뒤로가기 + (본인 기록만) 수정/삭제 아이콘 버튼.
- 이미지: **가로 스크롤 필름스트립** — 440×440px 정사각형, gap 16px, `scroll-snap-type:x mandatory`, 커스텀 스크롤바(`#332d25` thumb).
- 본문: max-width 660px, Gowun Batang 20px/1.9 `#ece5d8`.
- 하단: 시간(모노스페이스) + 공개/비공개 배지, 상단 보더로 구분.

### 6. 작성 화면 (신규/수정)
- 상단: 뒤로 / 타이틀(Gowun Batang 19px) / 저장 버튼.
- **본문 입력 = 인화지**: `background:#f4efe4` 프레임 안에 textarea(투명 배경, Gowun Batang 17px/1.9 `#2f281f`), 하단 52px에 날짜 스탬프(모노스페이스 `#a8946d`).
- 이미지 첨부: 92×92px 썸네일 + 삭제(✕) 버튼, "+" 추가 슬롯(점선 테두리, hover 시 `#96704f`).
- 하단: 기록 시간(datetime input, 밑줄형) / 공개 범위(칩 토글 2개 — 선택 시 `rgba(150,112,79,.18)` 배경 + `#96704f` 보더).

### 7. 마이페이지 (프로필)
- 아바타(78px 원형, **이미지 슬롯** — 드래그앤드롭으로 사진 변경) + 닉네임(Gowun Batang 28px) + `@username`(모노스페이스) + "프로필 수정" 버튼(아웃라인, hover `#96704f`).
- 자기소개: Gowun Batang 16px/1.9 `#c4bcae`.
- *(전체 기록/공개 기록 통계, 공개 프로필 링크는 이번 스코프에서 제외 — 추후 추가 예정으로 보류됨)*

### 8. 프로필 수정
- 동일 아바타 이미지 슬롯 + "클릭하거나 이미지를 끌어다 놓아 변경하세요" 안내.
- 닉네임/자기소개 입력 — 밑줄형 필드, 자기소개는 세리프.

### 9. 공개 프로필 & 공개 기록 리스트
- 마이페이지와 유사하되 방문자 시점. "PUBLIC · N" 모노스페이스 카운트.

### 10. 삭제 확인 모달
- 중앙 모달, `#16130f` 배경, radius 16px. "취소"(아웃라인) / "삭제"(`#9c5f52`, hover `#af6d5e`).

## Interactions & Behavior
- 화면 전환: `screen` state 머신 (landing/login/signup/timeline/detail/write/profile/edit-profile/public-profile/public-detail). 뒤로가기는 화면별 고정 맵으로 복귀.
- 카드/버튼 대부분에 hover 트랜지션(.18~.3s ease 또는 cubic-bezier(.2,.7,.3,1)).
- 화면 진입 시 `fadeUp` 애니메이션(opacity 0→1, translateY 10px→0, .34~.5s).
- 작성 화면: 텍스트 또는 이미지 중 최소 하나 필요 — 없으면 에러 메시지 표시(`#c07f6e`).
- 프로필 사진: 같은 슬롯 id를 마이페이지/프로필 수정 화면이 공유 — 한쪽에서 바꾸면 양쪽에 반영.
- 그리드 밀도(여유/기본/조밀)와 인화지 기울기 on/off, 새 기록 기본 공개 범위는 프로토타입에서 프롭으로 노출되어 있음(실제 구현에서는 사용자 설정 또는 상수로 대체 가능).

## State Management
- `memories`: 배열 { id, time(ISO), text, images(배열, 실제로는 URL), visibility(PUBLIC/PRIVATE) }
- `selectedId`, `editingId`, `screen`, `writeReturnTo`
- `draftText`, `draftImages`, `draftTime`, `draftVisibility`, `saveError`
- `homeMode`(calendar/list), `selectedDate`
- `myNickname`, `myUsername`, `myBio`, 아바타 이미지

## Design Tokens

**색상**
- 배경(최암): `#0a0908` / 사이드바: `#0e0c0b` / 패널: `#100e0d`, `#141210`, `#16130f`
- 보더: `#1c1916`, `#2e2a24`, `#332d25`
- 텍스트 3단계: `#f4efe6`(주요) / `#8f8778`(보조) / `#5c5549`(비활성)
- 인화지: `#f4efe4` (약간 톤 다운 `#f4efe4`/`#e8e0d2`)
- 인화지 위 본문: `#332b22`
- 브랜드 액센트: `#96704f` (hover `#a87f5a`)
- 공개 배지: 텍스트 `#7d6144`, 배경 `rgba(150,112,79,.16)`
- 삭제/위험: `#9c5f52` (hover `#af6d5e`)
- 모노스페이스 시간 라벨: `#9a8256` / `#6d6558`

**타이포그래피**
- Display/본문: `Gowun Batang` (400, 700) — 로고, 헤드라인, 카드/상세/작성 본문, 자기소개
- UI: `Noto Sans KR` (400/500/600/700) — 버튼, 라벨, 네비, 입력 힌트
- 시간/카운트: `ui-monospace, monospace`

**Spacing / Radius**
- 카드 radius: 3px (인화지) / 6-14px (컨테이너, 버튼은 999px pill)
- 사이드바 폭: 226px / 콘텐츠 max-width: 1160px
- 카드 그리드 gap: 24px

**애니메이션**
- `fadeUp`: opacity 0→1, translateY 10px→0
- `drift`: 랜딩 인화지 부유, 9s ease-in-out infinite
- 트랜지션: hover .18-.3s ease / cubic-bezier(.2,.7,.3,1)

## Assets
- 사진: 현재 프로토타입은 그라디언트 placeholder(`linear-gradient(...)`) 사용 — 실제 구현 시 사용자 업로드 이미지로 교체.
- 아바타: `image-slot` 컴포넌트로 드래그앤드롭 업로드 — 실제 구현에서는 표준 파일 업로드 + 크롭 UI로 대체.
- 폰트: Google Fonts — Gowun Batang, Noto Sans KR (CDN 로드, 별도 라이선스 확인 불필요).

## Target stack
**React + Next.js + TypeScript**, ships as a **PWA**. 단계별 구현 순서는 `ROADMAP.md` 참고 — 프로젝트 세팅부터 정적 화면, 상태/네비게이션, 실 데이터 연동, PWA 매니페스트/서비스워커, 마무리 QA까지 5단계로 정리되어 있음.

## Screenshots
`screenshots/` 폴더에 화면별 캡처 8장 (실제 렌더 상태 그대로):
- `01-landing.jpg` / `02-login.jpg` / `03-signup.jpg`
- `04-timeline-list.jpg` (달력 뷰는 README 레이아웃 설명 참고)
- `05-detail.jpg` / `06-write.jpg` / `07-profile.jpg` / `08-edit-profile.jpg`

## Files
- `Memento Web.dc.html` — 전체 웹 앱 (모든 화면 포함, 위 구조대로 하나의 상태 머신)
- `ROADMAP.md` — Next.js 구현 단계별 로드맵
- `screenshots/` — 화면별 캡처 8장
- 참고용으로 함께 제공된 `Memento Detail Layout Options.dc.html`은 상세 화면 레이아웃을 고르기 위한 초기 3안 비교본(참고만, 최종은 1b 채택됨).
