# LipCoding - 음성 입력 생산성 앱

천하제일 입코딩 대회 참가 프로젝트

## 기술 스택
- **프론트엔드**: React 18 + Vite
- **백엔드**: FastAPI + Python
- **배포**: Microsoft Azure (App Service)
- **IaC**: Bicep

## 프로젝트 구조
```
lipcoding/
├── frontend/          # React 앱
├── backend/           # FastAPI 앱
├── infra/             # Azure Bicep (인프라 코드)
├── .github/           # GitHub 설정 및 규칙
├── azure.yaml         # AZD 설정
└── .gitignore
```

## 시작하기

### 1. 로컬 개발
```bash
# 프론트엔드
cd frontend
npm install
npm run dev

# 백엔드 (다른 터미널)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 2. Azure 배포
```bash
azd init
azd up
```

## 환경 정보
- 리소스 그룹: `rg-lipcoding`
- 환경: `lipcoding-dev`
- 구독: Azure subscription 1
