"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Loader2, File as FileIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createNoteFromDocument } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { CreditConfirmModal } from "./credit-confirm-modal"

interface DocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNoteCreated?: (note: any) => void
}

export function DocumentModal({ open, onOpenChange, onNoteCreated }: DocumentModalProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showCreditConfirm, setShowCreditConfirm] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 파일 확장자에 따른 아이콘 색상 결정
  const getFileColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return 'text-red-500'
      case 'doc':
      case 'docx':
        return 'text-blue-500'
      case 'ppt':
      case 'pptx':
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }
  
  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (validExtensions.includes(fileExtension)) {
      setSelectedFile(file)
    } else {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "PDF, DOC, DOCX, PPT, PPTX, TXT 파일만 업로드 가능합니다.",
        variant: "destructive"
      })
    }
  }
  
  const handleProcessDocument = () => {
    if (!selectedFile || !token) {
      if (!token) {
        toast({
          title: "로그인 필요",
          description: "문서를 처리하려면 먼저 로그인해주세요.",
          variant: "destructive"
        })
      }
      return
    }
    
    // 확인 모달 표시
    setShowCreditConfirm(true);
  }
  
  const confirmAndProcessDocument = async () => {
    if (!selectedFile || !token) {
      console.log('Missing selectedFile or token:', { selectedFile: !!selectedFile, token: !!token });
      return;
    }
    
    console.log('Starting document processing:', { fileName: selectedFile.name, fileSize: selectedFile.size, fileType: selectedFile.type });
    setIsProcessing(true);
    
    try {
      const result = await createNoteFromDocument(selectedFile, token);
      console.log('Document processing successful:', result);
      
      toast({
        title: "노트 생성 완료",
        description: "문서가 성공적으로 노트로 변환되었습니다.",
      });
      
      // 생성된 노트 정보를 부모 컴포넌트로 전달
      if (onNoteCreated) {
        const createdNote = {
          id: result.id,
          title: result.title,
          date: `Created on ${new Date(result.created_at || Date.now()).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}`,
          icon: FileText,
          iconBg: 'bg-blue-600',
          summary: result.summary,
          transcription: result.original_transcription,
          noteType: 'document'
        };
        onNoteCreated(createdNote);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "처리 오류",
        description: error instanceof Error ? error.message : "문서 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }
  
  const resetState = () => {
    setSelectedFile(null)
    setIsProcessing(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetState()
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center w-full">
            <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">Document upload</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {!selectedFile ? (
            <div 
              className={`border-2 border-dashed ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300'} rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Drag file here, or click to select</p>
              <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOC, PPT, TXT</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <FileIcon className={`w-6 h-6 ${getFileColor(selectedFile.name)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={resetState}
                  disabled={isProcessing}
                >
                  다른 파일 선택
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleProcessDocument}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    '노트 생성하기'
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {isProcessing && !selectedFile && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">문서 처리 중...</span>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* 크레딧 확인 모달 */}
      <CreditConfirmModal
        open={showCreditConfirm}
        onOpenChange={setShowCreditConfirm}
        onConfirm={confirmAndProcessDocument}
        creditCost={5}
        actionType="document"
      />
    </Dialog>
  )
}