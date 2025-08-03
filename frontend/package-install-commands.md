# 필요한 패키지 설치 명령어

## 마크다운 렌더링을 위한 패키지
```bash
npm install react-markdown remark-gfm react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter
```

## PDF 생성을 위한 패키지
```bash
npm install jspdf html2canvas
npm install --save-dev @types/jspdf
```

## 설치 후 확인
```bash
npm list react-markdown remark-gfm react-syntax-highlighter jspdf html2canvas
```

이 패키지들을 설치한 후 프론트엔드를 다시 시작하세요:
```bash
npm run dev
```