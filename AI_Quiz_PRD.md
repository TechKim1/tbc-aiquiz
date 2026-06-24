# AI 퀴즈 프로그램 PRD
**Product Requirements Document v1.1**
작성일: 2026-06-24 | 최종 수정: 2026-06-24 (MVP Firebase Auth 제거)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [목표 및 성공 지표](#2-목표-및-성공-지표)
3. [사용자 역할 정의](#3-사용자-역할-정의)
4. [기술 스택](#4-기술-스택)
5. [기능 요구사항](#5-기능-요구사항)
6. [사용자 흐름 상세](#6-사용자-흐름-상세)
7. [데이터 모델 (Firebase Firestore)](#7-데이터-모델-firebase-firestore)
8. [API 설계](#8-api-설계)
9. [OpenAI 연동 명세](#9-openai-연동-명세)
10. [Firebase 연동 명세](#10-firebase-연동-명세)
11. [UI/UX 요구사항](#11-uiux-요구사항)
12. [비기능 요구사항](#12-비기능-요구사항)
13. [개발 우선순위 및 마일스톤](#13-개발-우선순위-및-마일스톤)
14. [미결 사항 및 제약 조건](#14-미결-사항-및-제약-조건)

---

## 1. 프로젝트 개요

### 배경

사내 교육 및 온보딩 과정에서 임직원의 학습 효과를 높이기 위한 AI 기반 퀴즈 프로그램이다. 교육담당자가 학습 자료를 입력하면 AI가 자동으로 문제를 생성하며, 임직원은 타이머 기반의 긴장감 있는 환경에서 퀴즈를 풀고 결과 및 리더보드를 통해 동기부여를 받는다.

### 핵심 가치

- **자동화**: OpenAI API를 활용한 문제 자동 생성으로 교육담당자의 업무 부담 최소화
- **긴장감**: 문제당 카운트다운 타이머로 집중력 및 참여도 향상
- **경쟁**: 리더보드를 통한 임직원 간 선의의 경쟁 유도
- **실시간성**: Firebase 기반 실시간 데이터 동기화

---

## 2. 목표 및 성공 지표

### 목표

| 구분 | 내용 |
|------|------|
| 단기 (1개월) | 교육담당자가 30분 이내에 퀴즈 세트 생성 → 임직원 배포 완료 |
| 중기 (3개월) | 전체 임직원 퀴즈 응시율 80% 이상 달성 |
| 장기 (6개월) | 퀴즈 결과 데이터 기반 교육 커리큘럼 개선 |

### 성공 지표 (KPI)

- 퀴즈 세트 생성 소요 시간: 평균 10분 이하
- 임직원 퀴즈 완료율: 70% 이상
- 평균 재도전율: 30% 이상 (타이머 긴장감 효과 측정)
- 시스템 응답속도: 문제 생성 30초 이내, 화면 로딩 2초 이내

---

## 3. 사용자 역할 정의

### 3.1 교육담당자 (Admin)

- 퀴즈 세트 생성, 수정, 삭제, 공개/비공개 관리
- 타이머 시간 설정 권한
- 전체 임직원 응시 현황 및 분석 대시보드 접근
- **MVP 인증 방식**: 환경변수로 설정한 관리자 비밀번호(`ADMIN_PASSWORD`) 입력 후 접근
  - 인증 성공 시 브라우저 `sessionStorage`에 관리자 세션 플래그 저장
  - 페이지 새로고침 시 재입력 필요 (세션 단위 유지)
  - ※ Firebase Authentication 미사용 (Phase 2 이후 도입 검토)

### 3.2 임직원 (Participant)

- 닉네임 입력 후 인증 없이 참여
- 공개된 퀴즈 세트 목록 열람 및 응시
- 본인 결과 및 리더보드 확인
- 재도전 허용 (횟수 제한은 교육담당자 설정에 따름)

---

## 4. 기술 스택

### 프론트엔드

| 항목 | 선택 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 스타일링 | Tailwind CSS |
| 상태관리 | Zustand |
| 라우팅 | React Router v6 |

### 백엔드 / 인프라

| 항목 | 선택 |
|------|------|
| 인증 (MVP) | 관리자 비밀번호 — 환경변수 `ADMIN_PASSWORD` 기반 (Firebase Auth 미사용) |
| 데이터베이스 | Firebase Firestore (실시간 DB) |
| 파일 저장 | Firebase Storage (PDF 업로드) |
| 서버리스 함수 | Firebase Cloud Functions (OpenAI 호출) |
| AI | OpenAI API (GPT-4o) |

### 환경 변수 관리

```
# Firebase
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=

# 관리자 인증 (MVP — Firebase Auth 미사용)
REACT_APP_ADMIN_PASSWORD=            # 클라이언트 빌드에 포함되므로 내부망 전용 운영 권장

# OpenAI (Cloud Functions 환경변수로 관리 - 클라이언트 노출 금지)
OPENAI_API_KEY=
```

> ⚠️ **보안 주의 1**: OpenAI API 키는 반드시 Firebase Cloud Functions의 서버 환경변수로만 관리하며, 클라이언트 코드에 절대 노출하지 않는다.
>
> ⚠️ **보안 주의 2**: `REACT_APP_ADMIN_PASSWORD`는 빌드 번들에 포함된다. MVP는 사내망(VPN) 환경에서만 접근하도록 배포하거나, Phase 2에서 Firebase Auth로 교체한다.

---

## 5. 기능 요구사항

### 5.1 교육담당자 기능

#### F-01. 퀴즈 세트 생성

| 항목 | 상세 |
|------|------|
| 입력 방식 | ① 주제 텍스트 입력 ② 본문 텍스트 붙여넣기 ③ PDF 파일 업로드 (최대 10MB) |
| 문제 수 | 5 / 10 / 20문제 선택 |
| 난이도 | 쉬움 / 보통 / 어려움 |
| 문제 유형 | 객관식 4지선다 / 단답형 / 혼합 |
| 타이머 설정 | 문제당 15초 / 30초 / 60초 / 90초 / 직접 입력 |
| 재도전 허용 | 무제한 / 1회 / 3회 선택 |

#### F-02. 문제 검토 및 편집

- AI 생성 문제 미리보기 (문제, 보기, 정답, 해설 포함)
- 개별 문제 텍스트 수정
- 문제 삭제 및 순서 변경 (드래그앤드롭)
- 선택 문제만 재생성 요청

#### F-03. 세트 공개 및 코드 발급

- 세트 저장 시 6자리 영숫자 코드 자동 발급 (예: `QUIZ01`)
- 공개 / 비공개 / 기간 설정 (시작일 ~ 종료일)
- 복사 링크 및 QR 코드 생성

#### F-04. 관리자 대시보드

- 세트별 응시 인원, 평균 점수, 완료율
- 문제별 오답률 순위 (취약 문항 파악)
- 응시자 개인별 점수 및 풀이 시간 열람
- CSV 데이터 내보내기

---

### 5.2 임직원 기능

#### F-05. 닉네임 입력 및 참여

- 닉네임 최소 2자, 최대 10자
- 동일 닉네임 중복 허용 (단, 동일 세트 내 동일 닉네임은 기존 기록에 덮어쓰기)
- 선택적으로 부서/팀 입력 (리더보드 필터링 활용)

#### F-06. 퀴즈 진행

- 문제 1개씩 순차 표시
- **카운트다운 타이머**: 설정된 초(sec)부터 역방향 카운트
  - 남은 시간 > 50%: 초록색
  - 남은 시간 10~50%: 노란색
  - 남은 시간 < 10%: 빨간색 + 진동 애니메이션
  - 0초 도달 시: 자동 오답 처리 후 다음 문제로 이동
- 진행률 표시 바 (현재 문제 번호 / 전체 문제 수)
- 답변 선택 후 즉시 다음 문제 이동 (정답 여부는 결과 화면에서 공개)
- 문제 번호 이동 불가 (앞으로 되돌아가기 없음)

#### F-07. 결과 확인

- 총점 및 정답률 (예: 7/10, 70%)
- 문제별 정오답 표시 + 해설
- 소요 시간 (타이머 초과 문제 포함 총 시간)
- 리더보드 내 현재 순위
- 재도전 버튼 (허용 횟수 내)

---

### 5.3 리더보드

#### F-08. 리더보드 표시

- 세트별 독립 리더보드
- 정렬 기준: **점수 내림차순 → 총 풀이 시간 오름차순** (동점 시 빠른 사람 상위)
- 상위 50명 표시 (스크롤)
- 현재 참여자 본인 행 하이라이트
- 실시간 업데이트 (Firebase onSnapshot)
- 부서별 필터링 옵션

---

## 6. 사용자 흐름 상세

### 6.1 교육담당자 흐름

```
관리자 비밀번호 입력 (sessionStorage 세션 플래그 저장)
  └─► 대시보드
        ├─► [퀴즈 세트 생성]
        │     ├─ 세트 제목 입력
        │     ├─ 입력 방식 선택 (주제 / 텍스트 / PDF)
        │     ├─ 옵션 설정 (문제 수, 난이도, 유형, 타이머, 재도전)
        │     ├─ [AI 문제 생성 요청] → Cloud Functions → OpenAI API
        │     ├─ 문제 검토 & 편집
        │     └─ 저장 & 공개 → 세트 코드 발급
        └─► [기존 세트 관리]
              ├─ 공개/비공개 토글
              ├─ 응시 현황 대시보드
              └─ CSV 내보내기
```

### 6.2 임직원 흐름

```
접속 (세트 코드 or 링크)
  └─► 닉네임 입력 (+ 선택: 부서)
        └─► 문제 세트 선택 or 자동 진입
              └─► 퀴즈 진행
                    ├─ 문제 표시
                    ├─ ⏱ 카운트다운 시작
                    ├─ 답변 선택 → 다음 문제
                    └─ 시간 초과 → 오답 처리 → 다음 문제
                          └─► 결과 화면
                                ├─ 점수 / 정오답 / 해설
                                ├─ 리더보드 확인
                                └─ 재도전 or 종료
```

---

## 7. 데이터 모델 (Firebase Firestore)

### 7.1 컬렉션 구조

```
/quizSets/{setId}
  - title: string
  - description: string
  - createdBy: string (uid)
  - createdAt: timestamp
  - status: 'draft' | 'active' | 'closed'
  - startDate: timestamp | null
  - endDate: timestamp | null
  - settings:
      questionCount: number
      difficulty: 'easy' | 'medium' | 'hard'
      questionType: 'multiple' | 'short' | 'mixed'
      timerSeconds: number          // 문제당 타이머 (초)
      retryLimit: number | null     // null = 무제한
  - accessCode: string              // 6자리 코드
  - shareUrl: string

/quizSets/{setId}/questions/{questionId}
  - order: number
  - type: 'multiple' | 'short'
  - question: string
  - options: string[]               // 객관식일 때만 (4개)
  - answer: string                  // 정답
  - explanation: string             // 해설
  - createdAt: timestamp

/quizSets/{setId}/submissions/{submissionId}
  - nickname: string
  - department: string | null
  - score: number
  - totalQuestions: number
  - totalTimeMs: number             // 총 소요 시간 (밀리초)
  - submittedAt: timestamp
  - answers: [
      { questionId, selectedAnswer, isCorrect, timeSpentMs }
    ]

/leaderboards/{setId}
  - updatedAt: timestamp
  - rankings: [
      { rank, nickname, department, score, totalTimeMs, submittedAt }
    ]                               // 상위 50명 캐싱
```

### 7.2 Firestore 보안 규칙 (MVP 기준)

> **MVP 주의**: Firebase Authentication을 사용하지 않으므로 `request.auth` 기반 규칙을 적용할 수 없다.
> 대신 아래 전략을 사용한다.
> - 교육담당자 쓰기 작업(세트 생성/수정)은 **Cloud Functions 경유**로만 허용
> - 클라이언트는 읽기만 허용, 직접 쓰기 차단
> - Phase 2에서 Firebase Auth 도입 후 `request.auth.token.role` 기반으로 전환 예정

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // quizSets: 누구나 active 세트 읽기 가능, 직접 쓰기 불가 (Cloud Functions만 허용)
    match /quizSets/{setId} {
      allow read: if resource.data.status == 'active';
      allow write: if false;
    }

    // questions: active 세트의 문제 읽기 가능, 직접 쓰기 불가
    match /quizSets/{setId}/questions/{questionId} {
      allow read: if get(/databases/$(database)/documents/quizSets/$(setId)).data.status == 'active';
      allow write: if false;
    }

    // submissions: 누구나 생성 가능, 읽기는 리더보드용으로 허용
    match /quizSets/{setId}/submissions/{submissionId} {
      allow create: if true;
      allow read: if true;
      allow update, delete: if false;
    }

    // leaderboards: 누구나 읽기, 직접 쓰기 불가 (Cloud Functions만 업데이트)
    match /leaderboards/{setId} {
      allow read: if true;
      allow write: if false;
    }
  }
}

---

## 8. API 설계

### Cloud Functions 엔드포인트

#### POST `/generateQuestions`

문제 생성 요청 (교육담당자 전용)

**Request**
```json
{
  "inputType": "topic" | "text" | "pdf",
  "content": "string (주제 또는 텍스트) or null",
  "pdfStoragePath": "string or null",
  "settings": {
    "questionCount": 10,
    "difficulty": "medium",
    "questionType": "multiple",
    "language": "ko"
  }
}
```

**Response**
```json
{
  "questions": [
    {
      "order": 1,
      "type": "multiple",
      "question": "다음 중 개인정보에 해당하지 않는 것은?",
      "options": ["이름", "주민등록번호", "공개된 회사명", "얼굴사진"],
      "answer": "공개된 회사명",
      "explanation": "공개된 회사명은 특정 개인을 식별할 수 없으므로 개인정보에 해당하지 않습니다."
    }
  ]
}
```

#### POST `/submitQuiz`

퀴즈 제출 및 리더보드 업데이트

**Request**
```json
{
  "setId": "string",
  "nickname": "string",
  "department": "string | null",
  "answers": [
    { "questionId": "string", "selectedAnswer": "string", "timeSpentMs": 12000 }
  ]
}
```

**Response**
```json
{
  "submissionId": "string",
  "score": 8,
  "totalQuestions": 10,
  "totalTimeMs": 95000,
  "rank": 3,
  "results": [
    { "questionId": "...", "isCorrect": true, "correctAnswer": "...", "explanation": "..." }
  ]
}
```

---

## 9. OpenAI 연동 명세

### 모델

`gpt-4o` (Cloud Functions 서버에서만 호출)

### 문제 생성 프롬프트 템플릿

```
당신은 기업 교육용 퀴즈 문제를 생성하는 전문가입니다.

[입력 내용]
{content}

[요구사항]
- 문제 수: {questionCount}개
- 난이도: {difficulty} (쉬움/보통/어려움)
- 유형: {questionType} (multiple=객관식 4지선다, short=단답형, mixed=혼합)
- 언어: 한국어

[출력 형식] JSON 배열만 출력하세요. 다른 텍스트 없이.
[
  {
    "order": 1,
    "type": "multiple",
    "question": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],  // 객관식만
    "answer": "정답",
    "explanation": "해설 (2-3문장)"
  }
]

[주의사항]
- 정답이 항상 특정 위치(예: 첫 번째)에 오지 않도록 무작위 배치
- 오답 보기는 그럴듯하게 작성 (명백히 틀린 보기 지양)
- 해설은 왜 정답인지, 왜 다른 보기가 틀렸는지 포함
```

### PDF 처리 흐름

```
PDF 업로드 → Firebase Storage
  └─► Cloud Functions:
        ├─ Firebase Storage에서 PDF 다운로드
        ├─ OpenAI Files API 또는 텍스트 추출 라이브러리로 텍스트 변환
        └─ 추출된 텍스트를 프롬프트에 삽입 → 문제 생성
```

### 토큰 사용량 관리

- 입력 텍스트 최대 길이: 8,000 토큰 (초과 시 앞부분 요약 후 사용)
- 응답 max_tokens: 4,000
- temperature: 0.7 (다양성 확보)

---

## 10. Firebase 연동 명세

### 10.1 관리자 인증 (MVP — Firebase Auth 미사용)

Firebase Authentication 대신 아래 방식으로 관리자 접근을 제어한다.

```javascript
// 관리자 로그인 처리 (클라이언트)
const handleAdminLogin = (inputPassword) => {
  if (inputPassword === process.env.REACT_APP_ADMIN_PASSWORD) {
    sessionStorage.setItem('isAdmin', 'true');
    navigate('/admin/dashboard');
  } else {
    setError('비밀번호가 올바르지 않습니다.');
  }
};

// 관리자 페이지 접근 보호 (React Router Guard)
const AdminRoute = ({ children }) => {
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  return isAdmin ? children : <Navigate to="/admin/login" />;
};
```

> Phase 2에서 Firebase Authentication (Email/Password + Custom Claims `role: 'admin'`)으로 교체 예정

### 10.2 Firebase Storage

```
/quizPdfs/{setId}/{filename}   // PDF 원본 저장
```

- 파일 크기 제한: 10MB
- 허용 파일 형식: PDF만
- 보안 규칙: MVP에서는 Cloud Functions만 읽기, 업로드는 Cloud Functions 경유
  (Firebase Auth 미사용으로 클라이언트 직접 업로드 시 누구나 가능 — 내부망 운영으로 보완)

### 10.3 실시간 리더보드 (onSnapshot)

```javascript
// 클라이언트에서 리더보드 실시간 구독
const unsubscribe = onSnapshot(
  doc(db, 'leaderboards', setId),
  (snapshot) => {
    setRankings(snapshot.data().rankings);
  }
);
```

### 10.4 Firebase 인덱스 (필요 복합 인덱스)

```
컬렉션: quizSets/{setId}/submissions
필드: score (내림차순), totalTimeMs (오름차순)
```

---

## 11. UI/UX 요구사항

### 11.1 타이머 UI 명세

| 상태 | 색상 | 추가 효과 |
|------|------|----------|
| 남은 시간 > 50% | 초록 (`#22C55E`) | 없음 |
| 남은 시간 10~50% | 노랑 (`#EAB308`) | 없음 |
| 남은 시간 < 10% | 빨강 (`#EF4444`) | 테두리 깜빡임 + 진동 애니메이션 |
| 0초 | 빨강 | "시간 초과!" 팝업 0.5초 후 자동 이동 |

- 타이머 형태: 원형 프로그레스 바 + 숫자 (초 단위)
- 위치: 화면 상단 우측 고정

### 11.2 화면 목록

| 화면 ID | 화면명 | 대상 |
|---------|--------|------|
| SCR-01 | 시작/선택 화면 | 공통 |
| SCR-02 | 관리자 비밀번호 입력 | 교육담당자 |
| SCR-03 | 관리자 대시보드 | 교육담당자 |
| SCR-04 | 퀴즈 세트 생성 | 교육담당자 |
| SCR-05 | 문제 검토 & 편집 | 교육담당자 |
| SCR-06 | 세트 코드 공유 | 교육담당자 |
| SCR-07 | 닉네임 입력 | 임직원 |
| SCR-08 | 퀴즈 세트 목록 | 임직원 |
| SCR-09 | 퀴즈 진행 (타이머 포함) | 임직원 |
| SCR-10 | 결과 화면 | 임직원 |
| SCR-11 | 리더보드 | 공통 |

### 11.3 반응형 지원

- 모바일 우선 설계 (임직원이 스마트폰으로 접속하는 경우 고려)
- 최소 지원 해상도: 375px (iPhone SE)
- 태블릿 / 데스크탑: 최대 너비 768px 센터 정렬

---

## 12. 비기능 요구사항

### 성능

| 항목 | 목표 |
|------|------|
| 문제 생성 응답 시간 | 30초 이내 (10문제 기준) |
| 퀴즈 화면 로딩 | 2초 이내 |
| 리더보드 실시간 반영 | 제출 후 3초 이내 |
| 동시 응시 지원 | 최소 500명 동시 접속 |

### 보안

- OpenAI API 키: Cloud Functions 환경변수만 사용, 클라이언트 노출 금지
- Firebase 보안 규칙으로 권한 외 데이터 접근 차단
- PDF 업로드 시 파일 형식 검증 (Magic Bytes 확인)
- Rate Limiting: 동일 IP 문제 생성 요청 분당 5회 제한

### 가용성

- Firebase 기반으로 99.9% SLA 목표
- Cloud Functions Cold Start 최소화를 위해 최소 인스턴스 1개 유지 (선택)

### 접근성

- 키보드 탐색 지원 (Tab / Enter로 퀴즈 진행 가능)
- 색맹 사용자를 위한 타이머 상태: 색상 + 아이콘 병행 표시
- 스크린 리더 호환 (ARIA 레이블 적용)

---

## 13. 개발 우선순위 및 마일스톤

### Phase 1 — MVP (4주)

**목표**: 핵심 퀴즈 생성 및 응시 기능 (Firebase Auth 미사용)

- [ ] Firebase 프로젝트 셋업 (Firestore, Storage, Functions)
- [ ] 관리자 비밀번호 인증 (`REACT_APP_ADMIN_PASSWORD` + sessionStorage)
- [ ] 퀴즈 세트 생성 (텍스트 / 주제 입력 방식)
- [ ] OpenAI API 연동 문제 생성 (객관식)
- [ ] 임직원 닉네임 입력 → 퀴즈 진행 → 결과 확인
- [ ] 타이머 카운트다운 (자동 오답 처리 포함)
- [ ] 기본 리더보드

### Phase 2 — 기능 완성 (3주)

- [ ] **Firebase Authentication 도입** (Email/Password + Custom Claims `role: 'admin'`)
- [ ] PDF 업로드 및 파싱 연동
- [ ] 문제 편집 기능 (수정, 삭제, 순서 변경)
- [ ] 단답형 문제 유형 추가
- [ ] 관리자 대시보드 (응시 현황, 오답률 분석)
- [ ] 세트 코드 / QR 코드 공유

### Phase 3 — 고도화 (2주)

- [ ] 부서별 리더보드 필터링
- [ ] CSV 데이터 내보내기
- [ ] 모바일 최적화 및 접근성 개선
- [ ] 문제 재생성 선택 기능
- [ ] 기간 설정 (세트 활성화 기간)

---

## 14. 미결 사항 및 제약 조건

### 미결 사항

| # | 사항 | 결정 필요 주체 |
|---|------|--------------|
| 1 | 임직원 인증 방식 — 닉네임만 vs. 사번 연동 | 인사팀 확인 필요 |
| 2 | 단답형 정답 채점 방식 — 완전 일치 vs. AI 유사도 채점 | 교육팀 결정 |
| 3 | 퀴즈 결과 데이터 보관 기간 | 정보보안팀 확인 필요 |
| 4 | 임직원 리더보드 닉네임 공개 범위 — 전사 vs. 팀 내 | 인사팀 확인 필요 |
| 5 | OpenAI 사용 비용 예산 (월 예상 호출량 기반 산정 필요) | 예산 담당자 확인 |

### 제약 조건

- Firebase Spark 플랜(무료)으로 시작 시 Cloud Functions 사용 불가 → **Blaze 플랜 필수**
- OpenAI API 응답 지연이 30초를 초과할 경우 Cloud Functions timeout 조정 필요 (기본 60초)
- PDF 내 이미지 기반 텍스트(스캔 문서)는 OCR 처리 별도 구현 필요 (v1 미지원)
- **MVP 보안 제약**: `REACT_APP_ADMIN_PASSWORD`가 클라이언트 번들에 포함되므로 사내망(VPN) 환경에서만 운영 권장. Phase 2에서 Firebase Auth로 전환 시 해당 제약 해소

---

*문서 버전: 1.1 | 최종 수정: 2026-06-24 (MVP Firebase Auth 제거)*
