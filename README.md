# WebRTC 화상회의 애플리케이션

Vue.js와 WebRTC를 이용한 n:m 화상회의 애플리케이션입니다.

## 기능

- 사용자 인증 (로그인)
- 화상회의 룸 생성 및 참가
- 실시간 화상/음성 통화
- 여러 명의 참가자와 동시 통화 (n:m)
- 오디오/비디오 On/Off
- 텍스트 채팅

## 기술 스택

- **프론트엔드**: Vue 3, TypeScript, Pinia, Vue Router
- **백엔드**: Node.js, Express, Socket.IO
- **미디어 통신**: WebRTC

## 설치 및 실행

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행 (클라이언트)

```bash
npm run dev
```

### 시그널링 서버 실행

```bash
npm run dev:server
```

### 클라이언트와 서버 함께 실행

```bash
npm run dev:all
```

## 시나리오 예시

1. Alice, Bob, Aiden이 서로 통화하고자 합니다.
2. Alice는 시그널링 서버에게 'roomA'에 들어가고 싶다고 요청합니다.
3. 시그널링 서버는 room 정보(room에 누가 있는지, 몇 명이 있는지 등)와 성공 여부를 Alice에게 응답합니다.
4. Alice는 'roomA'에 접속합니다. 현재는 혼자 있는 방입니다.
5. Bob이 'roomA'에 들어가기 위해 시그널링 서버에 요청합니다.
6. Bob도 'roomA'의 정보와 성공 여부를 응답받습니다.
7. Bob은 'roomA'에 있는 모든 이들(Alice)과 WebRTC 연결을 위한 offer/answer 교환을 합니다.
8. Aiden도 동일한 과정으로 'roomA'에 참가하여 Alice와 Bob 모두와 연결됩니다.

## 프로젝트 구조

```
/src
  ├── /assets          # 정적 자산 (이미지, 폰트 등)
  ├── /components      # 재사용 가능한 UI 컴포넌트
  ├── /repository      # API 또는 데이터 접근 계층
  ├── /router          # Vue Router 설정
  ├── /stores          # Pinia 스토어
  ├── /types           # TypeScript 타입 정의
  ├── /views           # 페이지 레벨 뷰
  ├── App.vue          # 루트 컴포넌트
  └── main.ts          # 앱 진입점
server.js              # 시그널링 서버
```
