# /TINO-TE.ai-BETA-backend/app/services.py

import httpx
import os
import tempfile
from fastapi import HTTPException, UploadFile
import PyPDF2
import docx
import io

# 우리가 만든 설정 파일에서 API 키를 안전하게 가져옵니다.
from app.config import settings

# --- 코드 설명 ---
# 이 파일은 외부 서비스(OpenAI, DeepSeek)와 통신하는
# 핵심 비즈니스 로직을 담고 있습니다. 'async' 키워드는
# 이 함수들이 비동기적으로 작동함을 의미하며, API 요청을 보내고
# 응답을 기다리는 동안 다른 작업을 처리할 수 있어 성능에 유리합니다.

WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions"
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

async def transcribe_media_with_whisper(file: UploadFile) -> str:
    """Whisper API를 호출하여 미디어 파일의 음성을 텍스트로 변환합니다."""
    
    try:
        # httpx를 사용해 비동기 HTTP 클라이언트를 생성합니다.
        async with httpx.AsyncClient() as client:
            # 파일 내용을 읽습니다
            file_content = await file.read()
            print(f"파일 크기: {len(file_content)} bytes")
            print(f"파일 타입: {file.content_type}")
            
            # Whisper API는 'multipart/form-data' 형식으로 파일을 받습니다.
            files = {'file': (file.filename, file_content, file.content_type)}
            headers = {'Authorization': f'Bearer {settings.OPENAI_API_KEY}'}
            
            # 전사 품질 향상을 위한 설정
            data = {
                'model': 'whisper-1',
                'language': 'ko',  # 한국어 설정으로 전사 품질 향상
                'prompt': '''이것은 한국어 교육 콘텐츠입니다. 강의, 세미나, 회의, 또는 학습 관련 대화 내용일 수 있습니다. 
다음 사항을 고려하여 정확하게 전사해주세요:
- 전문 용어와 학술 용어를 정확히 인식
- 숫자, 날짜, 고유명사를 정확히 표기
- 문장 부호를 적절히 사용하여 읽기 쉽게 구성
- 불필요한 추임새나 반복은 자연스럽게 정리''',
                'temperature': 0.0,  # 가장 일관성 있는 전사를 위해 0으로 설정
                'response_format': 'text'  # 텍스트 형식으로 응답
            }

            print(f"Whisper API 요청 시작...")
            
            # Whisper API에 POST 요청을 보냅니다.
            response = await client.post(
                WHISPER_API_URL, headers=headers, files=files, data=data, timeout=180
            )

            print(f"Whisper API 응답 상태: {response.status_code}")
            
            # 요청이 실패하면 에러를 발생시킵니다.
            if response.status_code != 200:
                print(f"Whisper API 오류: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Whisper API Error: {response.text}"
                )

            # 성공하면, JSON 응답에서 'text' 필드를 추출하여 반환합니다.
            if response.headers.get('content-type', '').startswith('application/json'):
                result = response.json()
                transcription = result.get("text", "")
            else:
                # response_format이 'text'인 경우 직접 텍스트 반환
                transcription = response.text
                
            print(f"전사 결과: {transcription[:100]}...")
            return transcription
            
    except Exception as e:
        print(f"Whisper API 호출 중 예외 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 전사 중 오류가 발생했습니다: {str(e)}"
        )

async def extract_text_from_document(file: UploadFile) -> str:
    """
    다양한 문서 형식(PDF, DOCX 등)에서 텍스트를 추출합니다.
    """
    content = await file.read()
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    try:
        if file_extension == '.pdf':
            # PDF 파일 처리
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            text = ""
            with open(temp_file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                for page_num in range(len(pdf_reader.pages)):
                    text += pdf_reader.pages[page_num].extract_text() + "\n"
            
            os.unlink(temp_file_path)  # 임시 파일 삭제
            return text
            
        elif file_extension in ['.docx', '.doc']:
            # Word 문서 처리
            doc = docx.Document(io.BytesIO(content))
            return "\n".join([para.text for para in doc.paragraphs])
            
        elif file_extension in ['.txt']:
            # 텍스트 파일 처리
            return content.decode('utf-8')
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"지원하지 않는 파일 형식입니다: {file_extension}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"문서 처리 중 오류가 발생했습니다: {str(e)}"
        )

async def summarize_text_with_openai(text: str) -> dict:
    """
    OpenAI GPT-4o-mini API를 호출하여 텍스트를 학습 노트 형식으로 변환합니다.
    """
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {settings.OPENAI_API_KEY}'
            }
            
            # 더 구체적이고 효과적인 프롬프트 작성
            system_prompt = """당신은 최고 수준의 학습 노트 작성 전문가입니다. 
주어진 텍스트를 학생들이 효과적으로 학습할 수 있는 체계적이고 실용적인 노트로 변환하는 것이 목표입니다.

**응답 형식:**
### [핵심을 담은 명확한 제목]

#### 요약
- **핵심 개념**: 가장 중요한 개념들을 3-5개 포인트로 정리
- **주요 내용**: 실무나 시험에 중요한 내용들을 구체적으로 설명
- **기억할 점**: 꼭 기억해야 할 팁이나 주의사항
- **연관 지식**: 관련된 배경 지식이나 응용 분야

**작성 원칙:**
1. 복잡한 내용은 단계별로 쉽게 설명
2. 예시나 비유를 활용하여 이해도 향상
3. 중요도에 따라 정보를 계층화
4. 학습자가 바로 활용할 수 있는 실용적 내용 포함
5. 전문 용어는 쉬운 설명과 함께 제공

모든 응답은 한국어로 작성하며, 대학생 수준에서 이해하기 쉽고 기억하기 좋은 형태로 구성해주세요."""

            user_prompt = f"""다음 텍스트를 효과적인 학습 노트로 변환해주세요:

{text}

**변환 요청사항:**
- 위 내용에서 학습에 가장 중요한 핵심 정보를 추출
- 이론과 실무 모두에 도움이 되는 내용으로 구성
- 복습할 때 빠르게 핵심을 파악할 수 있도록 구조화
- 관련 개념들 간의 연결고리를 명확히 표현
- 실제 적용 가능한 예시나 팁이 있다면 포함

학습자가 이 노트만 보고도 핵심 내용을 완전히 이해하고 활용할 수 있도록 작성해주세요."""
            
            # OpenAI GPT-4o-mini API에 보낼 요청 본문 구성
            payload = {
                "model": "gpt-4o-mini",  # OpenAI GPT-4o-mini 모델 사용
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2,  # 창의성과 일관성의 균형
                "max_tokens": 3000,  # 더 상세한 노트를 위해 토큰 수 증가
                "top_p": 0.8,  # 다양성과 품질의 균형
                "frequency_penalty": 0.2,  # 반복 줄이기
                "presence_penalty": 0.1   # 새로운 주제 도입 장려
            }

            print(f"OpenAI API 요청 시작...")
            
            # OpenAI API에 POST 요청을 보냅니다.
            response = await client.post(
                "https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=180
            )
            
            print(f"OpenAI API 응답 상태: {response.status_code}")
            
            if response.status_code != 200:
                print(f"OpenAI API 오류: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"OpenAI API Error: {response.text}"
                )
                
            # 응답에서 요약된 내용을 추출합니다.
            ai_response = response.json()["choices"][0]["message"]["content"]
            print(f"OpenAI 응답: {ai_response[:200]}...")
            
            # AI 응답을 파싱하여 제목과 요약을 분리
            try:
                lines = ai_response.strip().split('\n')
                title = ""
                summary = ""
                
                # 제목 찾기 (### 또는 # 으로 시작하는 라인)
                for i, line in enumerate(lines):
                    if line.startswith('###') or line.startswith('#'):
                        title = line.replace('#', '').strip()
                        # 제목 다음부터 요약 내용 추출
                        summary = '\n'.join(lines[i+1:]).strip()
                        break
                
                # 제목을 찾지 못한 경우 첫 번째 줄을 제목으로 사용
                if not title:
                    title = lines[0].strip() if lines else "AI 생성 노트"
                    summary = '\n'.join(lines[1:]).strip() if len(lines) > 1 else ai_response
                
                # 빈 요약인 경우 전체 응답을 요약으로 사용
                if not summary:
                    summary = ai_response
                    
                return {
                    "title": title[:100],  # 제목 길이 제한
                    "summary": summary
                }
                
            except Exception as parse_error:
                print(f"응답 파싱 오류: {parse_error}")
                # 파싱에 실패한 경우 전체 응답을 사용
                return {
                    "title": "AI 생성 학습 노트",
                    "summary": ai_response
                }
                
    except Exception as e:
        print(f"OpenAI API 호출 중 예외 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"텍스트 요약 중 오류가 발생했습니다: {str(e)}"
        )

