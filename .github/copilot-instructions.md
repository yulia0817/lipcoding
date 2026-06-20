# 입코딩 프로젝트 규칙

## 프로젝트 구조
- `frontend/`: React 앱
- `backend/`: FastAPI 앱
- `infra/`: Azure Bicep IaC

## 입코딩 원칙
- 한국어 질문 → 한국어 답변
- 간결한 코드, 명확한 의도
- 음성 입력 친화적: 짧은 명령어 우선

## 기술 스택
- 프론트엔드: React + Vite
- 백엔드: FastAPI + uvicorn
- 배포: Azure App Service
- 환경: `lipcoding-dev`

## 배포 프로세스
```bash
azd init
azd up
```

## Git 커밋 규칙
- 형식: `[영역] 메시지` (예: `[backend] FastAPI 초기 설정`)
- 한국어 가능
- Co-authored-by 자동 추가

## 파일 규칙
- 핵심만 주석: 명확하지 않은 로직만 설명
- 불필요한 주석 제거
- 최소한의 코드, 최대 효율
