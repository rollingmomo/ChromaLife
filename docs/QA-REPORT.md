# ChromaLife QA 보고서

QA 테스터 관점에서 발견한 버그, 엣지 케이스, 플로우 이슈, 개선 제안을 정리했습니다.  
각 항목은 **재현 단계**, **기대 동작**, **실제 동작** 형식으로 기록했습니다.

---

## 1. 버그

### 1.1 커스텀 감정과 기본 감정 이름 중복 시 키/색상 오류

- **재현 단계**
  1. 앱 실행 후 "Add your own"으로 커스텀 감정 추가
  2. 이름을 기본 감정과 동일하게 입력 (예: `Joyful`)
  3. 저장 후 그리드 화면으로 이동
  4. 하단 범례와 MoodSelector 확인

- **기대 동작**
  - React key 중복 없음, 범례에서 해당 날짜의 실제 색상(커스텀 색)이 반영됨

- **실제 동작**
  - `allEmotions`에 `Joyful`이 두 번 들어가 `key={e.name}` 때문에 React duplicate key 경고 발생
  - `allEmotions.find(e => e.name === emotion)`이 첫 번째(기본)만 반환해, 커스텀 색으로 저장한 날도 범례에는 기본 Joyful 색으로 표시됨
  - MoodSelector에 "Joyful" 버튼이 두 개 보일 수 있고, 선택 상태/색상이 혼동됨

- **관련 코드**
  - `App.tsx`: `allEmotions` 구성, 범례의 `key={e.name}`, `allEmotions.find(e => e.name === emotion)`

---

### 1.2 저장 실패 시 사용자 피드백 없음

- **재현 단계**
  1. 서버 중지 또는 네트워크 차단
  2. 픽커에서 감정 선택 후 저장

- **기대 동작**
  - 저장 실패 시 토스트/알림 등으로 "저장에 실패했습니다" 안내

- **실제 동작**
  - `response.ok`가 false여도 아무 UI 피드백 없음. 사용자는 저장된 것으로 오해할 수 있음

- **관련 코드**
  - `App.tsx`: `saveEntry` 내부, `if (response.ok)` 분기만 있고 실패 시 처리 없음

---

### 1.3 초기 로드 실패 시 빈 화면만 표시

- **재현 단계**
  1. 서버 미실행 또는 `/api/journal`, `/api/emotions` 500 등으로 실패
  2. 앱 새로고침

- **기대 동작**
  - 로딩 실패 시 "데이터를 불러오지 못했습니다" 같은 메시지와 재시도 옵션

- **실제 동작**
  - `fetchEntries` / `fetchCustomEmotions`에서 `catch`로 `console.error`만 하고, `setLoading(false)` 후 빈/부분 데이터로 화면 진입. 사용자는 오류인지 알기 어려움

- **관련 코드**
  - `App.tsx`: `useEffect` 내 `Promise.all([fetchEntries(), fetchCustomEmotions()]).finally(() => setLoading(false))` 및 각 fetch의 catch

---

### 1.4 "오늘" 날짜의 시간대 의존성

- **재현 단계**
  1. 브라우저/OS 시간대를 UTC가 아닌 값으로 설정 (예: KST)
  2. 자정 전후에 `new Date().toISOString().split('T')[0]` 사용하는 모든 로직 확인

- **기대 동작**
  - 사용자 로컬 날짜 기준으로 "오늘"이 결정됨

- **실제 동작**
  - `toISOString()`은 UTC이므로, 한국 시간 2025-03-05 01:00은 UTC 2025-03-04 16:00 → "오늘"이 2025-03-04로 나올 수 있음. 로컬 "오늘"과 불일치 가능

- **관련 코드**
  - `App.tsx`: `selectedDate` 초기값, `today`, "오늘 이미 로그됐으면 grid로" 분기, "Add today" 클릭 시 사용하는 `new Date().toISOString().split('T')[0]`

---

## 2. 엣지 케이스

### 2.1 Journal API – color/emotion 검증 없음

- **재현 단계**
  1. `POST /api/journal`에 `color: "not-a-color"`, `emotion: ""` 또는 매우 긴 문자열로 요청

- **기대 동작**
  - hex color 형식 검증, emotion 길이/필수값 검증 후 400 등 명확한 에러

- **실제 동작**
  - `date`만 형식 검사하고, color/emotion은 그대로 DB에 저장됨. 잘못된 색/빈 감정명으로 인한 UI 깨짐 가능

- **관련 코드**
  - `server/routes/journal.ts`: POST body 검증

---

### 2.2 Emotions API – icon 검증 없음

- **재현 단계**
  1. `POST /api/emotions`에 `icon: "NonExistentIcon"` 등 프론트 ICON_MAP에 없는 값 전송

- **기대 동작**
  - 허용된 icon 목록 검증 후 400 또는 409

- **실제 동작**
  - DB에는 저장되고, 프론트는 `ICON_MAP[ce.icon] || Star`로 폴백. 동작은 하되, 의도와 다른 아이콘이 표시됨

- **관련 코드**
  - `server/routes/emotions.ts`: POST body 검증  
  - `App.tsx`: `ICON_MAP[ce.icon] || Star`

---

### 2.3 연도 네비게이션 상한/하한 없음

- **재현 단계**
  1. 헤더에서 ChevronLeft/ChevronRight로 연도를 수백 년 전/후로 변경

- **기대 동작**
  - 합리적 범위(예: 1970~2030) 제한 또는 경고

- **실제 동작**
  - 제한 없이 연도만 바뀌고, 해당 연도 전체 일수로 그리드 생성. 극단적 연도에서도 동작은 하나, UX/성능 관점에서 제한이 있으면 좋음

- **관련 코드**
  - `App.tsx`: `setCurrentYear(prev => prev - 1)` / `prev + 1`, `daysOfYear` useMemo

---

### 2.4 커스텀 감정 추가 폼 – description 미입력

- **재현 단계**
  1. "Add your own emotion" 진입 후 폼 확인

- **기대 동작**
  - API에 description 필드가 있으므로, 선택 입력이라도 description 필드가 폼에 있음

- **실제 동작**
  - name, color, icon만 있고 description 입력란 없음. 항상 `description: ''`로 저장됨. 기획상 선택 사항이면 괜찮으나, 의도된 필드라면 폼에 추가하는 것이 좋음

- **관련 코드**
  - `App.tsx`: `newEmotion` state 및 "Add your own" 폼

---

## 3. 플로우 / UX 이슈

### 3.1 픽커에서 날짜 변경 불가

- **재현 단계**
  1. 그리드에서 특정 날짜 클릭 → 픽커 진입
  2. 픽커 화면에서 다른 날짜로 바꾸고 싶음

- **기대 동작**
  - 픽커 내에서 날짜 선택기(캘린더/날짜 입력)로 선택 날짜 변경 가능

- **실제 동작**
  - 픽커에는 "How are you feeling today?"와 선택된 날짜 표시만 있고, 날짜를 바꾸는 컨트롤이 없음. 날짜 변경을 하려면 그리드로 돌아가서 다른 날을 눌러야 함

---

### 3.2 일지 삭제 불가

- **재현 단계**
  1. 어떤 날짜에 감정 저장
  2. 해당 날짜 기록을 삭제하고 싶음

- **기대 동작**
  - Day Insight 패널 또는 그리드에서 "삭제" 등으로 해당 날짜 기록 제거 가능

- **실제 동작**
  - `DELETE /api/journal/:date` API는 있으나 프론트에 삭제 버튼/플로우가 없어 사용자가 기록을 지울 수 없음

---

### 3.3 커스텀 감정 삭제 불가

- **재현 단계**
  1. 커스텀 감정 추가
  2. 잘못 추가했거나 더 이상 쓰지 않아 삭제하고 싶음

- **기대 동작**
  - 설정/감정 목록에서 커스텀 감정 삭제 가능

- **실제 동작**
  - `DELETE /api/emotions/:id` API는 있으나 UI에 삭제 기능 없음

---

## 4. 개선 제안

| 구분 | 제안 |
|------|------|
| **에러 처리** | `saveEntry` 실패 시 `alert()` 또는 토스트로 메시지 표시; 초기 fetch 실패 시 에러 메시지 + "다시 시도" 버튼 |
| **날짜** | "오늘" 계산을 로컬 날짜 기준으로 통일 (예: `toLocaleDateString`로 YYYY-MM-DD 생성 또는 로컬 연/월/일로 조합) |
| **중복 키/데이터** | 커스텀 감정 이름이 기본 감정과 같을 경우: (1) 추가 시 "이미 같은 이름이 있습니다" 막기, 또는 (2) 표시용 고유 키 사용 (예: custom emotion은 `id`, 기본은 `name`) + 범례/선택 시 emotion 식별을 id/이름 조합으로 처리 |
| **API 검증** | Journal: `color` hex 패턴, `emotion` trim/길이 검증; Emotions: `icon` 허용 목록 검증 |
| **연도** | 연도 네비게이션에 min/max (예: 1970~2030) 적용 |
| **삭제 플로우** | Day Insight에 "이 날 기록 삭제" 버튼 추가; 커스텀 감정 목록(또는 설정)에 삭제 액션 추가 |
| **픽커 날짜** | 픽커 상단에 작은 날짜 선택기 또는 "다른 날짜 선택" 링크로 `selectedDate` 변경 가능하게 하기 |
| **접근성** | 로딩 스피너에 `aria-busy`/`aria-live`, 버튼에 명확한 `aria-label` 추가로 스크린 리더 지원 개선 |

---

## 5. 요약

- **반드시 수정 권장**: 1.1(중복 이름), 1.2(저장 실패 피드백), 1.4(오늘 날짜 시간대)
- **수정 권장**: 1.3(로드 실패 안내), 2.1(API 검증), 3.2(일지 삭제), 3.3(커스텀 감정 삭제)
- **선택 개선**: 2.2(icon 검증), 2.3(연도 제한), 2.4(description 필드), 3.1(픽커 날짜 변경), 접근성

이 문서는 코드 리뷰와 실제 실행을 바탕으로 작성되었으며, 필요 시 재현 단계로 각 항목을 다시 확인할 수 있습니다.
