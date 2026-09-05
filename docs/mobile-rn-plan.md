# Memento 모바일(React Native) 구현 계획

**결정 사항**: pnpm 모노레포 재편 · Expo(SDK 57) + expo-router · 1차에 전 화면 포팅
**작성 기준**: 2026-09-02, 현재 `dev` 브랜치(2f9cb67)

---

## 0. 현황 요약 — 무엇이 공유 가능한가

현재 `src/` 4,158줄 중 **플랫폼에 전혀 의존하지 않는 코드가 약 400줄** 있다. 이건 그대로 재사용한다.

| 파일 | 재사용성 | 비고 |
|---|---|---|
| `types/api.ts`, `types/memory.ts` | 100% | 무수정 |
| `lib/date.ts` (107줄) | 100% | `buildCalendarCells`까지 순수함수 — 달력 로직 통째로 재사용 |
| `lib/memoryView.ts`, `lib/errors.ts`, `lib/constants.ts` | 100% | 무수정 |
| `lib/validatePassword.ts` | 100% | 무수정 |
| `lib/api/{auth,memories,members,favorites}.ts` | ~90% | `File` 타입, FormData 조립부만 추상화 |
| `lib/api/client.ts` | ~80% | `process.env`, `window.location`, 동기 `localStorage` 3곳 |
| `lib/validateImageFile.ts` | ~80% | `File` → `{type, size}` 구조 인자로 |
| `lib/auth/tokenStorage.ts` | ~40% | localStorage(동기) vs SecureStore(비동기) — 재설계 필요 |
| `styles/tokens.css` (244줄) | 값만 | CSS 커스텀 프로퍼티 → JS 객체 |
| `components/**`, `app/**` | 0% | DOM 기반. 전부 재작성 (단 **로직/상태 흐름은 1:1 이식**) |

React Query 훅 구성(쿼리 키, `useInfiniteQuery` 페이지네이션, invalidate 패턴)은 코드는 다시 쓰지만 **설계를 그대로 베낀다**. 이게 포팅 속도의 핵심.

---

## 1. 목표 구조

```
memento-front/
├─ pnpm-workspace.yaml          # packages: ["apps/*", "packages/*"]
├─ CLAUDE.md                    # 경로/명령어 갱신
├─ apps/
│  ├─ web/                      # 현재 루트 내용 전부 이동 (src, public, next.config.ts, vitest, eslint)
│  └─ mobile/                   # Expo SDK 57 + expo-router
└─ packages/core/
   └─ src/
      ├─ api/{client,auth,memories,members,favorites}.ts
      ├─ types/{api,memory}.ts
      ├─ {date,memoryView,validateImage,validatePassword,errors,constants}.ts
      ├─ tokens.ts              # 디자인 토큰 정본 (dark/light) — Phase 2
      ├─ memoryImages.ts        # resolveImagesForSave (WriteScreen에서 승격)
      └─ config.ts              # 어댑터 인터페이스 + configureCore()
```

명령어: `pnpm dev`(웹) / `pnpm -F @memento/core test` / `pnpm -F @memento/mobile start`

---

## 2. `packages/core` — 플랫폼을 뽑아내야 하는 5개 지점

여기가 계획의 알맹이다. 순서대로 처리한다.

### 2.1 API 설정 주입

`client.ts:7`의 `process.env.NEXT_PUBLIC_API_BASE_URL`은 Next 전용이다. 초기화 함수로 바꾼다.

```ts
// packages/core/src/config.ts
export interface CoreConfig {
  baseUrl: string;
  tokens: TokenPersistence;
  onSessionExpired: () => void;      // 웹: location.href="/login" / 모바일: router.replace("/(auth)/login")
  makeJsonPart: (name: string, value: unknown) => Promise<FormDataPart>;
  fetchRemoteAsUpload: (url: string) => Promise<UploadFile>;
}
export function configureCore(config: CoreConfig): void;
```

웹은 root layout에서, 모바일은 `app/_layout.tsx`에서 최초 1회 호출. 미설정 상태로 `request()`가 불리면 즉시 throw (조용한 localhost fallback 금지 — 현재 코드의 의도 유지).

### 2.2 토큰 저장 — 동기 API 유지 + 비동기 영속화

`client.ts`는 `getTokens()`를 **동기로** 부른다(`client.ts:124`). SecureStore는 전부 async라 그대로는 안 맞는다. 메모리 캐시를 정본으로 둔다.

```ts
export interface TokenPersistence {
  load(): Promise<AuthTokens | null>;   // 부팅 시 1회
  save(t: AuthTokens): Promise<void>;
  clear(): Promise<void>;
}
```

- core가 메모리에 캐시 → `getTokens()`는 계속 동기.
- 쓰기는 `save()` fire-and-forget, 실패해도 세션은 살아있음(다음 콜드스타트에 로그아웃될 뿐).
- `subscribeToTokens`는 `window` 이벤트 대신 **core 내부 이미터**로 통일. 웹 어댑터가 `storage` 이벤트를 이미터로 브릿지해서 크로스탭 로그아웃 동작을 보존한다.
- **부팅 게이팅이 달라진다**: 웹의 `isHydrated`는 사실상 "클라이언트에서 첫 렌더됨"이었지만(`AuthContext.tsx:35`), 모바일에선 `load()` 완료 기준의 진짜 비동기 게이트가 된다. `SplashScreen.preventAutoHideAsync()`로 이 구간을 가리고, 완료 후 hide.

### 2.3 401 리다이렉트

`client.ts:135`의 `window.location.href`를 `config.onSessionExpired()` 호출로 교체. reissue 중복 호출 방지 로직(`client.ts:75`)은 **그대로 둔다** — 백엔드가 refresh 토큰을 일회용으로 회전시키므로 모바일에서도 동일하게 필요하다.

### 2.4 멀티파트 — ⚠️ 최대 리스크, Phase 1에서 먼저 검증

현재:
```ts
form.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
```

RN의 `FormData`는 `Blob`을 제대로 인코딩하지 못해 파트의 `Content-Type`이 유실되는데, Spring의 `@RequestPart`는 JSON 파트에 `application/json`을 요구한다. 그냥 옮기면 **400으로 깨진다.**

해결 순서:
1. **1안(우선)**: `expo-file-system`으로 캐시에 `request.json`을 쓰고 `{ uri, name: "request", type: "application/json" }`으로 append. RN FormData는 파일 파트엔 Content-Type을 붙여준다.
2. **2안**: 백엔드가 `request`를 `@RequestParam String`으로도 받게 확장 (백엔드 변경이라 최후수단).

→ **Phase 1에서 실기기로 `POST /api/memories` 성공을 먼저 확인**하고 결과에 따라 Phase 3 설계를 확정한다. 나중에 발견하면 작성 화면 전체를 다시 짜야 한다.

### 2.5 파일 표현 — `File` → `UploadFile`

```ts
export type UploadFile = File | { uri: string; name: string; type: string };
```

- `MemoryWriteInput.images: UploadFile[]`로 일반화, FormData append만 어댑터가 분기.
- `validateImageFile(file: File)` → `validateImage({ type, size })`. RN ImagePicker는 Android에서 `fileSize`가 없을 수 있으니 **없으면 통과시키고 서버 검증에 맡긴다**(원래 주석대로 보안 경계가 아니라 UX용).
- `WriteScreen.tsx:22`의 `urlToFile`(수정 시 기존 이미지 재전송) → `config.fetchRemoteAsUpload(url)`. 웹은 fetch→Blob→File, RN은 `FileSystem.downloadAsync` → uri. **PATCH의 "files를 보내면 전체 교체" 세만틱은 양쪽 동일**하므로 `resolveImagesForSave`의 비교 로직은 core로 올려 공유한다.

---

## 3. 디자인 토큰

`tokens.css` 244줄을 `packages/core/src/tokens.ts`로 옮기고 **이쪽을 정본으로** 삼는다.

```ts
export const darkTokens = { colorBg: "#0a0908", colorPrint: "#f4efe4", ... } as const;
export const lightTokens: typeof darkTokens = { ... };
```

- 웹의 `tokens.css`는 `pnpm -F core gen:css` 스크립트로 생성(두 벌 수기 관리 금지). CLAUDE.md의 "토큰은 tokens.css 하나에만 정의한다" 규칙을 **"tokens.ts 하나"** 로 갱신해야 한다.
- **그림자는 값이 다르다.** CSS `box-shadow` 문자열은 RN에서 못 쓴다. 토큰을 `{ web: "0 18px 34px rgba(...)", native: { ios: {shadowColor, shadowOffset, shadowOpacity, shadowRadius}, android: { elevation: 6 } } }` 형태로 정의. 폴라로이드 카드의 입체감이 이 앱 정체성이라 대충 넘기면 티가 난다.
- 스타일링 방식: **`StyleSheet.create` + `useTheme()` 색 주입**. NativeWind는 도입하지 않는다(앱 규모 대비 의존성/버전 리스크가 큼).
- 폰트: `@expo-google-fonts/gowun-batang@0.4.1`, `@expo-google-fonts/noto-sans-kr@0.4.3` (둘 다 존재 확인함). `useFonts` 로딩이 끝날 때까지 스플래시 유지.

---

## 4. 라우팅 매핑

```
apps/mobile/app/
├─ _layout.tsx           ThemeProvider > QueryProvider > AuthProvider > ToastProvider
│                        + configureCore() + 폰트/스플래시 제어
├─ (auth)/_layout.tsx    비로그인 전용 가드 (현 GuestOnly.tsx 대응)
│  ├─ login.tsx          ← /login
│  └─ signup.tsx         ← /signup
├─ (app)/_layout.tsx     인증 가드(현 (app)/layout.tsx) + Tabs
│  ├─ home.tsx           ← /home
│  ├─ favorites.tsx      ← /favorites
│  ├─ profile/index.tsx  ← /profile
│  ├─ profile/edit.tsx   ← /profile/edit
│  └─ drafts.tsx         ← /drafts   (탭엔 없고 프로필에서 push)
├─ entry/[id].tsx        ← /entry/[id]   (탭 밖, push)
└─ write.tsx             ← /write?edit=  (presentation: "modal", useLocalSearchParams)
```

- **랜딩(`/`)은 제외**. 부팅 시 토큰 있으면 `(app)/home`, 없으면 `(auth)/login`.
- **네비게이션**: 웹은 사이드바 + 하단 탭 + 전역 FAB. 모바일은 **3탭(홈/즐겨찾기/마이) + 탭바 가운데 큰 `+` 버튼**으로 통합한다. 별도 FAB이 탭바와 겹치는 문제가 사라진다.
- 사이드바의 테마 토글·로그아웃은 마이페이지로 이동.

---

## 5. 화면별 포팅 노트

| 화면 | 주요 변경 |
|---|---|
| **MemoryCard** | `rotate(-1.1deg)` 그대로 동작. `next/image` → `expo-image`(`contentFit="cover"`, 캐싱/blurhash 내장). 그림자 토큰 적용 |
| **MemoryGrid** | CSS grid → `FlatList numColumns={2}`. "더 보기" 버튼 → **`onEndReached` 자동 로딩**(모바일 관행). 웹은 현행 유지 |
| **CalendarPanel** | `buildCalendarCells` 그대로 재사용. 7열은 `flexWrap` + `width:'14.28%'`. 월 이동에 좌우 스와이프 추가 검토 |
| **MemoryForm** | `textarea`→`TextInput multiline` + `KeyboardAvoidingView` · `datetime-local`→`@react-native-community/datetimepicker`(날짜/시간 2단계, **값은 동일한 `YYYY-MM-DDTHH:mm` 문자열 유지** → `isValidDateTime`/`formatStamp` 그대로) · file input→`expo-image-picker`(`allowsMultipleSelection`, `selectionLimit: 남은 슬롯`) · **`URL.createObjectURL` 누수 관리 코드 전부 삭제**(RN은 uri라 revoke 불필요) |
| **MemoryDetail** | 필름스트립 → `ScrollView horizontal pagingEnabled` · 3점 메뉴(바깥클릭/ESC) → **바텀시트 ActionSheet**로 교체(RN엔 ESC가 없음) · `navigator.clipboard`→`expo-clipboard`, `window.location.origin`→`EXPO_PUBLIC_SITE_URL` |
| **DeleteConfirmModal** | RN `Modal`로 재구현. `Alert.alert`는 톤이 안 맞아서 쓰지 않음 |
| **ToastProvider** | 상태 로직 그대로, 렌더만 `Animated` + SafeArea 하단 |
| **AvatarUploadSlot** | image-picker `allowsEditing: true, aspect: [1,1]` |
| **로그인/회원가입** | `UnderlineInput` → `TextInput` + borderBottom. `autoCapitalize="none"`, `textContentType`, 비번 보기 토글 추가 |
| **마이페이지** | 통계/임시저장 행 그대로. 로그아웃 + 테마 토글 여기로 |

권한 문자열: `app.json`에 iOS `NSPhotoLibraryUsageDescription`(한국어), Android SDK 33+ `READ_MEDIA_IMAGES`.

---

## 6. React Query 모바일 설정 (빠뜨리기 쉬움)

RN에선 기본값이 동작하지 않는다. `_layout.tsx`에서:

- `onlineManager` + `@react-native-community/netinfo` — 이거 없으면 오프라인 감지 자체가 없음
- `focusManager` + `AppState` — 안 하면 `refetchOnWindowFocus`가 아예 안 돔
- 백그라운드 복귀 시 stale 재조회

오프라인 캐시(AsyncStorage persister)는 Phase 5 선택 항목.

---

## 7. 환경/빌드

- `EXPO_PUBLIC_API_BASE_URL`. **실기기에서 `localhost:8080`은 안 된다** — 맥 LAN IP(`http://192.168.x.x:8080`), Android 에뮬레이터는 `10.0.2.2`. `app.config.ts`에서 dev/prod 분기.
- **평문 HTTP 차단 우회**: iOS ATS 예외 / Android `cleartextTrafficPermitted` — **개발 빌드에만** 허용.
- 모노레포 Metro 설정 필수: `metro.config.js`의 `watchFolders` + `nodeModulesPaths`. 이거 없으면 `@memento/core` resolve가 실패한다.
- 초기엔 Expo Go로 충분(secure-store·image-picker·datetimepicker 모두 지원). 커스텀 네이티브가 필요해지면 dev client로 전환.
- EAS: `eas.json`에 development/preview/production 프로필. 아이콘/스플래시는 기존 `public/icon-512.png` 재사용.

---

## 8. 테스트

- **packages/core**: vitest 그대로 이관. `date.test`·`memoryView.test`·`validatePassword.test`·`errors.test`는 **무수정 이동**. `tokenStorage.test`는 어댑터 테스트로 재작성.
- **apps/web**: 기존 컴포넌트 테스트 3개(MemoryCard/MemoryForm/MemoryDetail/DeleteConfirm) 그대로 잔류.
- **apps/mobile**: `jest-expo` + `@testing-library/react-native`. 같은 케이스를 RN판으로 재작성.

---

## 9. 단계별 실행

### Phase 0 — 모노레포 재편 ✅ 완료
1. `git mv`로 `apps/web/` 이동(히스토리 보존), workspace 설정.
2. `packages/core` 생성 + lib/types 이동, `apps/web`은 `@/lib/core` 배럴을 통해 import.
3. §2.1~2.3 리팩터 + 웹 어댑터(`apps/web/src/lib/core/configure.ts`) 작성.
- **결과**: 빌드 ✓ / lint ✓ / 테스트 91개(core 55 + web 36) ✓.
- 계획에 없던 발견: `app/entry/[id]/page.tsx`의 `generateMetadata`가 **서버 컴포넌트**에서 core를 쓴다.
  RSC 패스는 클라이언트 모듈 본문을 평가하지 않으므로 프로바이더에 설정을 걸어두는 방식으로는 커버가 안 되고,
  `getCoreConfig()`가 throw → 기존 catch에 먹혀 **공유 링크 OG 프리뷰가 조용히 죽는다**.
  → `@/lib/core` 배럴이 `configureCore()`를 강제하도록 바꾸고, 스텁 백엔드로 실제 OG 태그 출력까지 확인했다.

### Phase 1 — Expo 부트스트랩 + 리스크 스파이크 ⏳ 코드 완료 / 실기기 검증 대기
- ✅ `apps/mobile` 생성(SDK 57, expo-router) + Metro 모노레포 설정.
- ✅ RN 어댑터: SecureStore 세션, 멀티파트 조립, 401 → `router.replace("/login")`.
- ✅ 로그인/회원가입/홈(프로필·통계) 화면, 스플래시 게이팅, React Query의 RN 설정(NetInfo·AppState).
- ✅ iOS·Android 번들 생성 성공, 타입체크 ✓, 테스트 12개 ✓.
- ⏳ **§2.4 멀티파트 스파이크는 실기기에서만 확정된다.** `app/multipart-spike.tsx`가 그 하네스다.
- 버전 정정: SDK 57이 묶는 RN은 **0.86.3**(npm latest인 0.87.1이 아님 — 0.87은 `rn-get-polyfills`를
  없애서 Metro가 번들에 실패한다). React도 **19.2.3**으로 웹과 함께 맞췄다.

### Phase 2 — 디자인 시스템 + 인증 (1~2일)
tokens.ts, ThemeProvider, 폰트, 공용 프리미티브(PillButton/UnderlineInput/VisibilityChip/EmptyState/Toast/Modal/ActionSheet), 로그인·회원가입·가드·스플래시.

### Phase 3 — 핵심 루프 (2~3일)
홈(달력+목록), 상세, 작성/수정(이미지 피커·날짜 피커·임시저장).

### Phase 4 — 나머지 화면 (1~2일)
즐겨찾기, 임시저장 목록, 마이페이지/수정, 테마 토글, 로그아웃.

### Phase 5 — 마감 (1~2일)
빈/에러/로딩 상태, 키보드 처리, SafeArea, 접근성(라벨·터치타깃 44pt), 딥링크(`memento://entry/3` + 유니버설 링크), 아이콘/스플래시, jest, EAS preview 빌드 → 실기기 QA.

**합계 약 7~11 작업일.**

---

## 10. 문서 업데이트 (Phase 0에 포함)

- `CLAUDE.md`: 경로(`src/` → `apps/web/src/`), 토큰 정본(`tokens.ts`), pnpm 필터 명령, 모바일 섹션 신설.
- `AGENTS.md`: `next dev`가 재생성하므로 `apps/web/`으로 함께 이동.

---

## 11. 열어둔 결정

1. **웹 PWA 유지 여부** — 유지 권장(설치형 웹 + 네이티브 병행). 대신 두 클라이언트 QA 비용이 계속 든다.
2. **무한스크롤 UX** — 모바일만 `onEndReached` 자동 로딩으로 바꿀 것 권장. 웹은 "더 보기" 유지.
3. **푸시 알림 / 오프라인 쓰기** — 이번 스코프 밖. 공개 프로필 화면도 기존 스코프대로 제외.
