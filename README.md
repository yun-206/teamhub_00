# Team KW 팀 허브 (시연용 데모)

K-pop Live Tracker 같은 업무 툴과 팀 협업 기능을 한곳에 모은 **통합 사이트로 발전할 수 있다**는 걸 보여주는 프로토타입이에요.
미리 넣어 둔 가상 사람·일정·공지는 없어요. Supabase(무료 DB)에 연결하면 다른 기기끼리도 실시간으로 공유돼요. 시연하면서 직접 입장하고, 팀원을 초대하고, 회의를 잡는 대로 화면이 채워져요.
K-pop Live Tracker는 별도 저장소(`yun-206/kpop-checker`)의 사이트를 그대로 두고, 허브에서는 링크로만 연결해요.

## 주소
- 허브: `/` (입장 전이면 자동으로 입장 화면으로 이동)
- 입장 화면: `/join.html` · 초대 링크: `/join.html?invite=1`
- 회의 일정: `/meeting.html`
- 공지사항: `/notices.html` · 쪽지: `/messages.html`

## 입장·팀원
1. 링크로 처음 들어오면 **비밀번호** → **이름·직급** 입력 → 허브로 (소속팀은 전부 Team KW)
2. 같은 이름으로 다시 들어오면 새로 만들지 않고 그 팀원으로 이어서 들어가요
   - 한 번 입장한 기기는 다음부터 바로 허브로 들어가요. 그 기기에서 초대 링크를 다시 눌러도 **'○○ 님으로 계속하기'**가 먼저 떠요(아래 작은 '다른 사람으로 입장하기'는 시연용 새 창 입장에 사용)
3. 팀원 상태: 온라인 / 회의 중 / 자리 비움 / 오프라인
   - 프로필 메뉴에서 직접 바꾸기(온라인·회의 중·자리 비움)
   - 지금 진행 중인 회의의 참석자면 자동으로 '회의 중'
   - 창을 닫으면 몇 초 뒤 '오프라인'
4. 프로필 메뉴: 팀원 초대하기 · 테마 · 이 창에서 나가기 · **데모 전체 초기화**(팀원·회의·활동 전부 삭제 → 시연 리허설 후 처음 상태로)

## 공지 · 알림 · 쪽지
- **공지사항**: 허브 공지 카드나 공지사항 화면의 '공지 쓰기' → 분류(공지·자료·일정)·제목·내용 → 올리기. 팀원 화면의 공지 카드·공지사항 화면에 바로 뜨고, 쓴 사람만 삭제할 수 있어요.
- **알림(상단 종)**: 다른 팀원이 올린 공지 / 나한테 온 쪽지 / 나를 넣어 잡은 회의가 실시간으로 쌓여요. 새 알림이 오면 토스트가 뜨고 종이 흔들리며 빨간 숫자가 붙어요. 항목을 누르면 해당 화면으로 이동, '모두 읽음'으로 정리.
- **쪽지**: 팀원 카드의 말풍선 버튼이나 사이드바 '쪽지' → 상대를 골라 대화. Enter 보내기(Shift+Enter 줄바꿈), 상대가 보면 '읽음'으로 바뀌어요. 안 읽은 쪽지 수가 사이드바·팀원 카드에 표시돼요. 모바일은 목록 ↔ 대화창 전환.

### 저장 방식 — 두 가지 모드 (자동 선택)
| | **Supabase 모드** | 로컬 모드 |
|---|---|---|
| 켜지는 조건 | `data/team.js`의 `supabase.url`·`key`를 채움 | 비워 둠 |
| 저장 위치 | Supabase(PostgreSQL) | 이 브라우저 localStorage |
| 공유 범위 | **다른 기기·브라우저끼리 실시간** | 같은 브라우저의 탭·창끼리만 |
| 접속 상태 | Realtime **Presence** (창 닫으면 서버가 감지) | 8초 신호 |
| 입장 비밀번호 | DB 안(`app_settings`)에서만 비교 — 브라우저에 안 보임 | `team.js`의 `password` (코드에 보임) |
| 사이드바 표시 | 🟢 실시간 DB 연결 · Supabase | 시연용 데모 · 이 브라우저에만 저장돼요 |

Supabase 설정이 있는데 연결에 실패하면(인터넷·프로젝트 일시정지) 로컬로 몰래 바꾸지 않고 "서버에 연결하지 못했어요" 화면을 보여줘요 — 데이터가 두 군데로 갈라지지 않게.

**시연 방법 (Supabase 모드)**: 노트북에서 입장 → '팀원 초대하기' 링크를 휴대폰으로 보내 입장 → 노트북 팀원 목록에 바로 '온라인' → 회의를 잡으면 휴대폰 '다가오는 일정'에 바로 → 휴대폰에서 '자리 비움' 고르면 노트북에 반영 → 휴대폰 창 닫으면 몇 초 뒤 '오프라인'.

## Supabase 연결하기
1. supabase.com → New project (Region: Northeast Asia (Seoul))
2. SQL Editor → `supabase/setup.sql` 통째로 붙여넣고 Run (여러 번 실행해도 안전 — **새 버전이 나오면 다시 한 번 Run**하면 새 표만 추가돼요)
   - 만드는 것: `members`·`meetings`·`activity`·`notices`·`messages` 표, `app_settings`(비밀번호), `join_team`·`check_password`·`reset_demo` 함수, RLS 규칙, Realtime 등록
   - 입장 비밀번호는 처음 실행 때 `'teamkw'`로 들어가고, 다시 실행해도 안 바뀌어요. 바꾸려면 SQL Editor에서 `update public.app_settings set value = '새비밀번호' where key = 'password';`
3. Project Settings → API Keys → **Project URL**과 **Publishable key**(또는 anon public)를 `data/team.js`의 `supabase`에 넣기
   - Publishable/anon 키는 웹페이지에 공개되는 용도라 저장소에 올라가도 괜찮아요(RLS로 보호). **secret·service_role 키는 절대 넣지 말 것**
4. 무료 프로젝트는 일주일쯤 안 쓰면 일시정지돼요 → 발표 전날 대시보드에서 Restore/접속 확인

### 보안 규칙 요약 (RLS)
- `members`: 브라우저는 읽기만. 추가는 비밀번호를 확인하는 `join_team` 함수로만
- `meetings`: 읽기·추가·삭제 (만든 사람 필수, 시간·글자 수 검사)
- `activity`: 읽기·추가
- `notices`: 읽기·추가·삭제 (분류·글자 수 검사)
- `messages`: 읽기·추가, 수정은 **읽음 시각(`read_at`)만** 가능 · 나 자신에게 보내기 불가
- `app_settings`: 브라우저에서 읽기 불가
- ⚠️ 로그인(Supabase Auth) 없이 공개 키로 쓰는 데모라 "내 쪽지는 나만 읽기"를 DB가 강제하진 못해요(화면에서만 내 쪽지를 걸러 보여줌). 실제 서비스로 가면 Auth를 붙여 RLS를 `auth.uid()` 기준으로 바꾸는 게 다음 단계예요.
- 전체 초기화(`reset_demo`)도 비밀번호가 맞아야 실행

## 파일
| 파일 | 역할 |
|---|---|
| `index.html` + `js/home.js` | 허브 메인 (인사·요약, 다가오는 일정, 대표 툴, 업무 툴, 공지, 최근 활동, 팀원) |
| `join.html` + `js/join.js` | 입장 화면 (비밀번호 → 이름·직급) |
| `meeting.html` + `js/meeting.js` | 주간 캘린더, 새 회의, 회의 상세·삭제 |
| `notices.html` + `js/notices.js` | 공지사항 목록·분류 필터·삭제 (쓰기 모달은 hub-core 공용) |
| `messages.html` + `js/messages.js` | 쪽지: 대화 상대 목록 + 대화창, 읽음 표시 |
| `js/hub-core.js` | 공통: 상단바·사이드바, **알림 패널**, 테마, 아이콘, **데이터 층(로컬/Supabase 백엔드)**, 접속 상태, 초대·공지 쓰기 모달, 토스트 |
| `data/tools.js` | **업무 툴 목록** — 객체 한 줄 추가하면 카드·사이드바 메뉴가 생김 |
| `data/team.js` | **팀 설정** — 팀 이름, Supabase 주소·키, 로컬 비밀번호, 직급 목록, 바로가기 |
| `supabase/setup.sql` | Supabase 표·보안 규칙·함수 만들기 (SQL Editor에서 실행) |
| `css/hub.css` | 스타일 (K-pop Live Tracker와 같은 토큰) |

## 바꾸기 쉬운 값 (`data/team.js`)
- `supabase.url` / `supabase.key`: 채우면 Supabase 모드
- `password`: 로컬 모드 입장 비밀번호 (기본 `teamkw`). 페이지 코드에 그대로 보이니 실제 비밀번호는 쓰지 마세요
- `roles`: 입장할 때 고르는 직급
- `links`: 사이드바 바로가기

## 툴 추가 예시 (`data/tools.js`)
```js
{ id: 'new-tool', name: '새 툴 이름', desc: '한 줄 설명', href: 'https://new-tool.vercel.app/', icon: 'doc', status: '운영 중', tags: ['태그'] },
```
- `status`: `운영 중` / `데모` / `준비 중`(눌리지 않는 카드) · `featured: true`면 메인에 큰 카드

## 배포 (Vercel)
- 이 저장소를 Vercel에 연결(빌드 설정 없음, 정적 사이트). 주소: https://teamhub00.vercel.app/
