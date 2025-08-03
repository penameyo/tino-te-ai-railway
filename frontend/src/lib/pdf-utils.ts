// PDF 다운로드 유틸리티 함수들

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const downloadNotePDF = async (noteId: string, token: string, noteTitle: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notes/${noteId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'PDF 생성 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    
    // Base64 데이터를 Blob으로 변환
    const binaryString = atob(data.pdf_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'application/pdf' });
    
    // 다운로드 실행
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.filename || `${noteTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('PDF 다운로드 오류:', error);
    throw error;
  }
};

// 클라이언트 사이드 PDF 생성 (패키지 설치 시 사용)
export const generatePDFClientSide = async (noteTitle: string, summary: string, transcription: string) => {
  try {
    // 동적 import로 패키지 로드 (설치된 경우에만)
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;
    
    // PDF 생성 로직
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // 제목 추가
    pdf.setFontSize(18);
    pdf.text(noteTitle, 20, 30);
    
    // 요약 추가
    pdf.setFontSize(14);
    pdf.text('요약', 20, 50);
    pdf.setFontSize(10);
    const summaryLines = pdf.splitTextToSize(summary, 170);
    pdf.text(summaryLines, 20, 60);
    
    // 원본 내용 추가
    const yPosition = 60 + (summaryLines.length * 5) + 20;
    pdf.setFontSize(14);
    pdf.text('원본 내용', 20, yPosition);
    pdf.setFontSize(10);
    const contentLines = pdf.splitTextToSize(transcription.substring(0, 2000), 170);
    pdf.text(contentLines, 20, yPosition + 10);
    
    // 다운로드
    pdf.save(`${noteTitle}.pdf`);
    
    return true;
  } catch (error) {
    console.error('클라이언트 사이드 PDF 생성 오류:', error);
    throw new Error('PDF 생성 패키지가 설치되지 않았습니다.');
  }
};