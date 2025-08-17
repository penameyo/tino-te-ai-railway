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
  const [processingStep, setProcessingStep] = useState<string>("")
  const [processingProgress, setProcessingProgress] = useState<number>(0)
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
    setProcessingStep("")
    setProcessingProgress(0)
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
    setProcessingProgress(0);

    try {
      // 1단계: 파일 업로드 준비
      setProcessingStep("🎵 오디오 파일 준비 중...");
      setProcessingProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500)); // 시각적 피드백

      // 2단계: 음성 전사 시작
      setProcessingStep("🎤 음성을 텍스트로 변환 중...");
      setProcessingProgress(30);
      
      // 3단계: API 호출 (실제 처리)
      setProcessingStep("🤖 AI가 음성을 분석하고 있어요...");
      setProcessingProgress(60);
      
      const result = await createNoteFromMedia(pendingFile, token)
      
      // 4단계: 노트 생성 완료
      setProcessingStep("📝 학습 노트 생성 중...");
      setProcessingProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 5단계: 완료
      setProcessingStep("✅ 완료!");
      setProcessingProgress(100);
      
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
      
      await new Promise(resolve => setTimeout(resolve, 500)); // 완료 메시지 표시
      onOpenChange(false)
    } catch (error) {
      console.error('Error processing audio file:', error)
      setProcessingStep("❌ 처리 중 오류가 발생했습니다");
      setProcessingProgress(0);
      toast({
        title: "처리 오류",
        description: error instanceof Error ? error.message : "오디오 파일 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
        setProcessingStep("")
        setProcessingProgress(0)
        setPendingFile(null);
      }, 1000);
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
            <div className="relative w-20 h-20 mb-6">
              {/* 배경 그라데이션 원 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-full shadow-lg"></div>
              {/* 글로우 효과 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full blur-md opacity-50 animate-pulse"></div>
              {/* 아이콘 */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Mic className="w-9 h-9 text-white drop-shadow-sm" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              🎤 음성 노트 생성
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              음성을 녹음하거나 파일을 업로드해서 AI 학습 노트를 만들어보세요
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {!audioBlob ? (
            <>
              {isRecording ? (
                <div className="space-y-6">
                  {/* 녹음 중 애니메이션 */}
                  <div className="flex justify-center items-center relative">
                    {/* 파동 효과 */}
                    <div className="absolute w-24 h-24 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                    <div className="absolute w-20 h-20 bg-red-500 rounded-full opacity-30 animate-ping" style={{animationDelay: '0.15s'}}></div>
                    <div className="absolute w-16 h-16 bg-red-500 rounded-full opacity-40 animate-ping" style={{animationDelay: '0.3s'}}></div>
                    
                    {/* 중앙 녹음 아이콘 */}
                    <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <Mic className="w-8 h-8 text-white drop-shadow-sm" />
                    </div>
                  </div>
                  
                  {/* 녹음 시간 및 상태 */}
                  <div className="text-center space-y-3">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                      <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                        {formatTime(recordingTime)}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">녹음 진행 중</p>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        ⚠️ 녹음 중에는 모달을 닫지 마세요
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        완료하려면 아래 "녹음 중지" 버튼을 눌러주세요
                      </p>
                    </div>
                  </div>
                  
                  {/* 녹음 중지 버튼 */}
                  <Button
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white h-12 shadow-lg transition-all duration-200 hover:shadow-xl"
                    onClick={stopRecording}
                  >
                    <StopCircle className="w-5 h-5 mr-2" />
                    녹음 중지
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-14 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] font-medium"
                    onClick={startRecording}
                    disabled={isProcessing}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <Mic className="w-3 h-3" />
                      </div>
                      🎤 실시간 음성 녹음
                    </div>
                  </Button>

                  {/* 구분선 */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      또는
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
                  </div>

                  {/* 파일 업로드 영역 */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group ${
                      dragActive 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg scale-[1.02]' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800/50 dark:hover:to-blue-900/20'
                    }`}
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
                    
                    {/* 업로드 아이콘 */}
                    <div className="relative mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                      {dragActive && (
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-30 animate-pulse"></div>
                      )}
                    </div>
                    
                    {/* 업로드 텍스트 */}
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        📁 오디오 파일 업로드
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        .mp3, .wav, .m4a 파일을 드래그하거나 클릭해서 선택하세요
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-600 dark:text-blue-400 font-medium">
                          MP3
                        </div>
                        <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-600 dark:text-green-400 font-medium">
                          WAV
                        </div>
                        <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-600 dark:text-purple-400 font-medium">
                          M4A
                        </div>
                      </div>
                    </div>
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
            <div className="space-y-6 py-6">
              {/* 처리 중 헤더 */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-spin opacity-20"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  AI가 작업 중이에요
                </h3>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {processingStep}
                </p>
              </div>
              
              {/* 세련된 진행률 바 */}
              <div className="space-y-3">
                <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-700 ease-out shadow-sm"
                    style={{ width: `${processingProgress}%` }}
                  >
                    {/* 진행률 바 내부 글로우 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                    {/* 움직이는 하이라이트 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    진행률
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {processingProgress}%
                  </span>
                </div>
              </div>
              
              {/* 격려 메시지 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <p className="text-sm text-center text-gray-700 dark:text-gray-300 font-medium">
                  잠시만 기다려주세요. 곧 완성됩니다! ✨
                </p>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                  고품질 학습 노트를 생성하고 있어요 🤖
                </p>
              </div>
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