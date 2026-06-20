# LipCoding - 음성 입력 생산성 앱

## 설정

```bash
# 1. 의존성 설치
cd frontend && npm install
cd ../backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# 2. 로컬 실행
# 터미널 1 - 백엔드
cd backend && source venv/bin/activate && python main.py

# 터미널 2 - 프론트엔드
cd frontend && npm run dev
```

## 배포 (Azure)

```bash
azd up
```

## 기술 스택
- React 18 + Vite
- FastAPI
- Python 3.11
- Azure Container Apps
