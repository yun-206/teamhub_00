# 팀 허브 (시연용 데모)

K-pop Live Tracker 같은 업무 툴과 팀 협업 기능을 한곳에 모은 **통합 사이트로 발전할 수 있다**는 걸 보여주는 프로토타입이에요.
실제 로그인·DB·외부 API는 없고, 화면의 사람·일정·공지는 전부 가상 데이터예요.
K-pop Live Tracker는 별도 저장소(`yun-206/kpop-checker`)의 사이트를 그대로 두고, 허브에서는 링크로만 연결해요.

## 주소
- 허브: 사이트 첫 화면 `/` (로컬에서는 `index.html`을 열어도 됨)
- 회의 일정 데모: `/meeting.html`
- 허브의 대표 카드·툴 카드·사이드바에서 K-pop Live Tracker로 이동(새 탭). 주소는 `data/tools.js` 맨 위 `KPOP_LIVE_TRACKER_URL` 한 줄

## 파일
| 파일 | 역할 |
|---|---|
| `index.html` + `js/home.js` | 허브 메인 (벤토 카드: 인사·요약, 다가오는 일정, 대표 툴, 업무 툴, 공지, 최근 활동, 팀원) |
| `meeting.html` + `js/meeting.js` | 주간 캘린더, 새 회의 모달, 회의 상세·삭제 |
| `js/hub-core.js` | 공통: 상단바·사이드바, 테마, 아이콘, 회의 저장소, 토스트 |
| `data/tools.js` | **업무 툴 목록** — 객체 한 줄 추가하면 카드·사이드바 메뉴가 생김 |
| `data/mock.js` | 가상 데이터 (팀원, 기본 회의, 공지, 활동, 바로가기) |
| `css/hub.css` | 스타일 (K-pop Live Tracker와 같은 토큰: 다크 기본·라이트, #01539F, Poppins + Pretendard) |

## 툴 추가 예시 (`data/tools.js`)
```js
{ id: 'new-tool', name: '새 툴 이름', desc: '한 줄 설명', href: 'https://new-tool.vercel.app/', icon: 'doc', status: '운영 중', tags: ['태그'] },
```
- `status`: `운영 중` / `데모` / `준비 중`(눌리지 않는 카드)
- `icon`: chart · calendar · doc · venue · news · check · folder · link
- `featured: true`인 툴은 메인에 큰 카드로 표시

## 동작 메모
- 회의 저장: 브라우저 localStorage `teamhub-meetings`(막히면 페이지 메모리). 기본 회의는 매번 '이번 주' 기준으로 계산돼서 언제 시연해도 일정이 차 있음.
- 직접 만든 회의는 상세에서 삭제, 또는 프로필 메뉴 → '데모 일정 초기화'로 한 번에 지움.
- 테마 저장 키는 K-pop Live Tracker와 같은 `tourdata-theme`. 사이트(도메인)가 달라서 허브와 툴의 다크/라이트 설정은 각자 따로 기억돼요.
- 검색창은 UI만: 업무 툴 카드를 이름·설명·태그로 걸러줌. `/` 키로 검색창 포커스.
- 모바일(960px 이하) 사이드바는 왼쪽에서 열리는 메뉴, 760px 이하 캘린더는 요일별 목록.

## 배포 (Vercel)
- 이 저장소를 Vercel에 새 프로젝트로 연결(빌드 설정 없음, 정적 사이트). 기존 kpop-checker 프로젝트는 건드리지 않아요.
