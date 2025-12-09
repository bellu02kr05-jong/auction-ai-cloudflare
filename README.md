# AI 경매 상담 - Cloudflare Pages

20년 경력 경매 전문가의 노하우를 담은 AI 경매 상담 서비스

## 기술 스택

- **Frontend**: HTML/CSS/JavaScript (Cloudflare Pages)
- **Backend**: Cloudflare Pages Functions (서버리스)
- **Vector DB**: Qdrant Cloud
- **LLM**: Groq (Llama 3.3 70B)
- **Embedding**: HuggingFace Inference API

## 배포 방법

### 1. GitHub에 올리기

```bash
git init
git add .
git commit -m "Cloudflare Pages 배포"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/auction-ai-cloudflare.git
git push -u origin main
```

### 2. Cloudflare Pages 연결

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 접속
2. **Pages** 클릭
3. **Create a project** → **Connect to Git**
4. GitHub 저장소 선택
5. Build settings:
   - Framework preset: `None`
   - Build command: (비워두기)
   - Build output directory: `/`
6. **Save and Deploy**

### 3. 환경 변수 설정 (중요!)

Cloudflare Pages → 프로젝트 → **Settings** → **Environment variables**

다음 변수들 추가:

| Variable name | Value |
|---------------|-------|
| `QDRANT_URL` | `https://2125bcd4-071e-48b2-98e1-94eeeeae5668.europe-west3-0.gcp.cloud.qdrant.io` |
| `QDRANT_API_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.pILRV9DUe98W_HJr_xJvBv7Q0-CPn5bplIaEfBzCyqQ` |
| `GROQ_API_KEY` | `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` |
| `HF_API_KEY` | HuggingFace API 키 (아래 참조) |

### 4. HuggingFace API 키 발급

1. [HuggingFace](https://huggingface.co/) 가입
2. Settings → Access Tokens
3. **New token** 생성 (Read 권한)
4. Cloudflare 환경변수에 추가

### 5. 재배포

환경 변수 설정 후 **Deployments** → **Retry deployment**

## 파일 구조

```
auction-ai-cloudflare/
├── index.html              # 프론트엔드
├── functions/
│   └── api/
│       └── chat.js         # 서버리스 API
└── README.md
```

## API 엔드포인트

### POST /api/chat

요청:
```json
{
  "message": "권리분석이 뭐야?",
  "top_k": 5
}
```

응답:
```json
{
  "answer": "권리분석이란...",
  "sources": [
    { "filename": "기초반_1강", "score": 0.85 }
  ]
}
```

## 문제 해결

### "HuggingFace API 오류"
- HF_API_KEY가 올바른지 확인
- HuggingFace 계정에서 API 사용량 확인

### "Qdrant API 오류"
- QDRANT_URL, QDRANT_API_KEY 확인
- Qdrant Cloud 콘솔에서 클러스터 상태 확인

### "Groq API 오류"
- GROQ_API_KEY 확인
- Groq 콘솔에서 사용량 확인

## 라이선스

MIT License
