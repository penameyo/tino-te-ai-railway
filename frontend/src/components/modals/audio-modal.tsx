"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, Upload, StopCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createNoteFromMedia } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { CreditConfirmModal } from "./credit-confirm-modal"

interface AudioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNoteCreated?: (note: any) => void
}

export function AudioModal({ open, onOpenChange, onNoteCreated }: AudioModalProps) {
  const { token } = useAuth()
  const { toast } = useToast()

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showCreditConfirm, setShowCreditConfirm] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 녹음 시간 업데이트
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open])

  const resetState = () => {
    // 녹음 중이면 먼저 중단
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    
    setIsRecording(false)
    setRecordingTime(0)
    setAudioBlob(null)
    setIsProcessing(false)
    audioChunksRef.current = []
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  // 녹음 중일 때 모달 닫기 방지
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isRecording) {
      // 녹음 중이면 확인 메시지 표시
      const shouldClose = window.confirm(
        "녹음이 진행 중입니다. 정말로 닫으시겠습니까?\n녹음 중인 내용이 손실될 수 있습니다."
      );
      
      if (shouldClose) {
        // 사용자가 확인하면 녹음 중단하고 모달 닫기
        stopRecording();
        onOpenChange(false);
      }
      // 사용자가 취소하면 모달을 열린 상태로 유지
      return;
    }
    
    if (!newOpen && isProcessing) {
      // 처리 중이면 확인 메시지 표시
      const shouldClose = window.confirm(
        "오디오 처리가 진행 중입니다. 정말로 닫으시겠습니까?\n처리 중인 내용이 손실될 수 있습니다."
      );
      
      if (!shouldClose) {
        return;
      }
    }
    
    onOpenChange(newOpen);
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
        setAudioBlob(audioBlob)

        // 스트림의 모든 트랙을 중지
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast({
        title: "마이크 접근 오류",
        description: "마이크에 접근할 수 없습니다. 권한을 확인해주세요.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // 미디어 스트림 완전히 정리
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop()
        })
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processAudioFile(file)
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
    if (file && file.type.startsWith('audio/')) {
      processAudioFile(file)
    } else {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "오디오 파일(.mp3, .wav 등)만 업로드 가능합니다.",
        variant: "destructive"
      })
    }
  }

  const processAudioFile = async (file: File) => {
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "파일을 처리하려면 먼저 로그인해주세요.",
        variant: "destructive"
      })
      return
    }
    
    // 확인 모달을 표시하기 위해 파일 저장
    setPendingFile(file);
    setShowCreditConfirm(true);
  }
  
  const confirmAndProcessAudio = async () => {
    if (!pendingFile || !token) {
      console.log('Missing pendingFile or token:', { pendingFile: !!pendingFile, token: !!token });
      return;
    }
    
    console.log('Starting audio processing:', { fileName: pendingFile.name, fileSize: pendingFile.size, fileType: pendingFile.type });
    setIsProcessing(true);

    try {
      const result = await createNoteFromMedia(pendingFile, token)
      console.log('Audio processing successful:', result);
      toast({
        title: "노트 생성 완료",
        description: "오디오 파일이 성공적으로 노트로 변환되었습니다.",
      })
      
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
          icon: Mic,
          iconBg: 'bg-purple-600',
          summary: result.summary,
          transcription: result.original_transcription,
          noteType: 'audio'
        };
        onNoteCreated(createdNote);
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error processing audio file:', error)
      toast({
        title: "처리 오류",
        description: error instanceof Error ? error.message : "오디오 파일 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setPendingFile(null);
    }
  }

  const handleRecordedAudioSubmit = async () => {
    if (!audioBlob || !token) return

    // Blob을 File 객체로 변환
    const file = new File([audioBlob], "recorded-audio.mp3", { type: "audio/mp3" })
    
    // 확인 모달을 표시하기 위해 파일 저장
    setPendingFile(file);
    setShowCreditConfirm(true);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center w-full">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">Record or upload audio</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {!audioBlob ? (
            <>
              {isRecording ? (
                <div className="space-y-4">
                  <div className="flex justify-center items-center">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{formatTime(recordingTime)}</p>
                    <p className="text-sm text-red-500 font-medium">🔴 녹음 중... (모달을 닫지 마세요)</p>
                    <p className="text-xs text-gray-500 mt-1">녹음을 완료하려면 "Stop recording" 버튼을 눌러주세요</p>
                  </div>
                  <Button
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white h-12"
                    onClick={stopRecording}
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop recording
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
                    onClick={startRecording}
                    disabled={isProcessing}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Record audio live
                  </Button>

                  <div
                    className={`border-2 border-dashed ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="audio/*"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                    />
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Drag .mp3 audio file here, or click to select</p>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-center font-medium">Audio recorded successfully!</p>
                <p className="text-center text-sm text-gray-500">Duration: {formatTime(recordingTime)}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetState}
                  disabled={isProcessing}
                >
                  Record again
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleRecordedAudioSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Create note'
                  )}
                </Button>
              </div>
            </div>
          )}

          {isProcessing && !audioBlob && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">Processing your audio...</span>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* 크레딧 확인 모달 */}
      <CreditConfirmModal
        open={showCreditConfirm}
        onOpenChange={setShowCreditConfirm}
        onConfirm={confirmAndProcessAudio}
        creditCost={10}
        actionType="audio"
      />
    </Dialog>
  )
}