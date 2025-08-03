"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useRef } from 'react'
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface Note {
  id: string;
  title: string;
  date: string;
  icon: any;
  iconBg: string;
  summary: string;
  transcription: string;
  noteType: string;
}

interface NoteDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note | null
}

export function NoteDetailModal({ open, onOpenChange, note }: NoteDetailModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  if (!note) return null;

  const IconComponent = note.icon;

  // 텍스트 파일 다운로드 함수 (백업용)
  const downloadAsText = () => {
    const content = `${note.title}\n${'='.repeat(note.title.length)}\n\n요약:\n${note.summary}\n\n원본 내용:\n${note.transcription}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF 다운로드 함수 (임시로 텍스트 다운로드)
  const downloadAsPDF = () => {
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "다운로드를 위해 로그인해주세요.",
        variant: "destructive"
      });
      return;
    }

    // 현재는 텍스트 파일로 다운로드 (서버 설정 후 PDF로 변경 예정)
    downloadAsText();
    
    toast({
      title: "다운로드 완료",
      description: "노트가 텍스트 파일로 다운로드되었습니다.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${note.iconBg} rounded-full flex items-center justify-center`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">{note.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">{note.date}</p>
                <p className="text-xs text-gray-500">
                  {note.noteType === 'document' ? 'Document' : 'Audio'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAsPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              다운로드
            </Button>
          </div>
        </DialogHeader>

        <div ref={contentRef} className="mt-6 space-y-6">
          {/* 요약 섹션 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Summary</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {note.summary}
              </p>
            </div>
          </div>

          {/* 원본 텍스트 섹션 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">
              {note.noteType === 'document' ? 'Original Text' : 'Transcription'}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                {note.transcription}
              </p>
            </div>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  )
}