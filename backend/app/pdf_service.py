# AWS 배포용 PDF 생성 서비스

import io
import base64
from typing import Dict, Any
from fastapi import HTTPException
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


# 한글 폰트 설정 (AWS Lambda에서 사용 가능한 방법)
def setup_korean_font():
    """한글 폰트를 설정합니다. Railway 환경에서도 작동합니다."""
    try:
        # Railway/클라우드 환경용 폰트 경로들
        font_paths = [
            "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",  # Ubuntu/Debian
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Railway 기본
            "/System/Library/Fonts/AppleGothic.ttf",  # macOS
            "C:/Windows/Fonts/malgun.ttf",  # Windows
        ]

        for font_path in font_paths:
            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont("Korean", font_path))
                return "Korean"

        # 폰트를 찾지 못한 경우 기본 폰트 사용
        return "Helvetica"
    except Exception as e:
        print(f"폰트 설정 오류: {e}")
        return "Helvetica"


def create_pdf_from_note(note_data: Dict[str, Any]) -> bytes:
    """
    노트 데이터로부터 PDF를 생성합니다.
    AWS Lambda에서도 작동하도록 설계되었습니다.
    """
    try:
        # 메모리 버퍼 생성
        buffer = io.BytesIO()

        # PDF 문서 생성
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )

        # 스타일 설정
        styles = getSampleStyleSheet()
        korean_font = setup_korean_font()

        # 커스텀 스타일 생성
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontName=korean_font,
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
        )

        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontName=korean_font,
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20,
        )

        body_style = ParagraphStyle(
            "CustomBody",
            parent=styles["Normal"],
            fontName=korean_font,
            fontSize=10,
            spaceAfter=12,
            leading=14,
        )

        # PDF 내용 구성
        story = []

        # 제목
        story.append(Paragraph(note_data.get("title", "제목 없음"), title_style))
        story.append(Spacer(1, 12))

        # 메타 정보
        meta_info = f"생성일: {note_data.get('created_at', '')}<br/>타입: {note_data.get('note_type', '').upper()}"
        story.append(Paragraph(meta_info, body_style))
        story.append(Spacer(1, 20))

        # 요약 섹션
        story.append(Paragraph("📝 요약", heading_style))
        summary_text = note_data.get("summary", "요약 내용이 없습니다.")
        # HTML 태그 제거 및 마크다운 간단 처리
        summary_text = summary_text.replace("**", "<b>").replace("**", "</b>")
        summary_text = summary_text.replace("###", "<br/><b>").replace("\n", "<br/>")
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 20))

        # 원본 텍스트 섹션
        original_title = (
            "🎤 전사 내용"
            if note_data.get("note_type") == "audio"
            else "📄 원본 텍스트"
        )
        story.append(Paragraph(original_title, heading_style))
        original_text = note_data.get("original_transcription", "원본 내용이 없습니다.")
        # 긴 텍스트 처리
        if len(original_text) > 3000:
            original_text = original_text[:3000] + "...(내용이 길어 일부만 표시됩니다)"
        original_text = original_text.replace("\n", "<br/>")
        story.append(Paragraph(original_text, body_style))

        # PDF 생성
        doc.build(story)

        # 바이트 데이터 반환
        buffer.seek(0)
        return buffer.getvalue()

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"PDF 생성 중 오류가 발생했습니다: {str(e)}"
        )


def create_pdf_endpoint_handler(note_data: Dict[str, Any]) -> Dict[str, str]:
    """
    API 엔드포인트에서 사용할 PDF 생성 핸들러
    """
    try:
        pdf_bytes = create_pdf_from_note(note_data)

        # Base64로 인코딩하여 JSON 응답으로 전송
        pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

        return {
            "pdf_data": pdf_base64,
            "filename": f"{note_data.get('title', 'note')}.pdf",
            "content_type": "application/pdf",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF 생성 실패: {str(e)}")


# AWS Lambda용 경량화 버전
def create_simple_pdf(title: str, summary: str, content: str) -> bytes:
    """
    AWS Lambda 환경을 위한 간단한 PDF 생성 함수
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)

    styles = getSampleStyleSheet()
    story = []

    # 간단한 구조로 PDF 생성
    story.append(Paragraph(title, styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("요약", styles["Heading2"]))
    story.append(Paragraph(summary, styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("내용", styles["Heading2"]))
    story.append(Paragraph(content[:2000], styles["Normal"]))  # 길이 제한

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
