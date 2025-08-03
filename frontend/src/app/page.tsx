"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, FileText, FolderPlus, MoreHorizontal, ChevronRight } from "lucide-react"
import { AudioModal } from "@/components/modals/audio-modal"
import { YouTubeModal } from "@/components/modals/youtube-modal"
import { DocumentModal } from "@/components/modals/document-modal"
import { FolderModal } from "@/components/modals/folder-modal"
import { UserProfileModal } from "@/components/modals/user-profile-modal"
import { LoginModal } from "@/components/modals/login-modal"
import { NoteDetailModal } from "@/components/modals/note-detail-modal"
import { DeleteConfirmModal } from "@/components/modals/delete-confirm-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { getNotes, deleteNote } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const actionCards = [
  {
    id: "audio",
    title: "Record or upload audio",
    description: "Upload an audio file",
    icon: Mic,
    iconBg: "bg-blue-600",
  },
  {
    id: "youtube",
    title: "YouTube video",
    description: "Paste a YouTube link",
    icon: () => (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    iconBg: "bg-red-600",
  },
  {
    id: "document",
    title: "Document upload",
    description: "Any PDF, DOC, PPT, etc!",
    icon: FileText,
    iconBg: "bg-blue-600",
  },
]

// 노트 타입 정의
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

export default function Dashboard() {
  const [audioModalOpen, setAudioModalOpen] = useState(false)
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [userProfileOpen, setUserProfileOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasNotes, setHasNotes] = useState(false)
  const [userNotes, setUserNotes] = useState<Note[]>([])
  const [noteDetailModalOpen, setNoteDetailModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)

  const { isAuthenticated, user, token } = useAuth()
  const { toast } = useToast()

  // 로그인 상태에 따라 노트 데이터 가져오기
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotes();
    }
  }, [isAuthenticated, token]);

  // 모달이 닫힐 때마다 노트 목록 새로고침
  useEffect(() => {
    if (!audioModalOpen && !documentModalOpen && !youtubeModalOpen && isAuthenticated && token) {
      fetchNotes();
    }
  }, [audioModalOpen, documentModalOpen, youtubeModalOpen]);

  // 백엔드에서 노트 데이터 가져오기
  const fetchNotes = async () => {
    try {
      if (!token) return;

      const notes = await getNotes(token);
      console.log('Fetched notes:', notes); // 디버깅용

      if (notes && notes.length > 0) {
        // 백엔드에서 가져온 노트 데이터 형식에 맞게 변환
        const formattedNotes = notes.map((note: any) => ({
          id: note.id,
          title: note.title,
          date: `Created on ${new Date(note.created_at || Date.now()).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}`,
          icon: note.note_type === 'document' ? FileText : Mic, // 노트 타입에 따른 아이콘
          iconBg: note.note_type === 'document' ? 'bg-blue-600' : 'bg-purple-600',
          summary: note.summary,
          transcription: note.original_transcription,
          noteType: note.note_type
        }));

        // 최신 순으로 정렬 (created_at 기준)
        formattedNotes.sort((a: Note, b: Note) => {
          const dateA = new Date(notes.find((n: any) => n.id === a.id)?.created_at || 0);
          const dateB = new Date(notes.find((n: any) => n.id === b.id)?.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });

        console.log('Formatted notes:', formattedNotes); // 디버깅용
        setUserNotes(formattedNotes);
        setHasNotes(formattedNotes.length > 0);
      } else {
        setUserNotes([]);
        setHasNotes(false);
      }
    } catch (error) {
      console.error("노트 데이터를 가져오는 중 오류 발생:", error);
      setUserNotes([]);
      setHasNotes(false);
    }
  };

  // 삭제 확인 모달 열기
  const handleDeleteNoteClick = (note: Note) => {
    setNoteToDelete(note);
    setDeleteConfirmModalOpen(true);
  }

  // 실제 삭제 실행
  const handleConfirmDelete = async () => {
    if (!noteToDelete || !token) return;

    try {
      await deleteNote(noteToDelete.id, token);
      setUserNotes((prev) => prev.filter((note) => note.id !== noteToDelete.id));

      // 노트가 모두 삭제되면 hasNotes를 false로 설정
      if (userNotes.length === 1) {
        setHasNotes(false);
      }

      toast({
        title: "노트 삭제 완료",
        description: `"${noteToDelete.title}" 노트가 삭제되었습니다.`,
      });
    } catch (error) {
      console.error("노트 삭제 중 오류 발생:", error);
      toast({
        title: "삭제 오류",
        description: "노트 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setNoteToDelete(null);
    }
  }

  // 폴더 생성 처리 (Coming Soon)
  const handleCreateFolder = () => {
    toast({
      title: "Coming Soon!",
      description: "폴더 기능은 곧 제공될 예정입니다.",
      duration: 3000,
    });
  }

  // 노트 상세 보기
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setNoteDetailModalOpen(true);
  }

  // 노트 생성 완료 처리
  const handleNoteCreated = (newNote: any) => {
    // 이미 포맷된 노트 객체가 전달됨
    // 새로 생성된 노트를 목록에 추가
    setUserNotes(prev => [newNote, ...prev]);
    setHasNotes(true);

    // 생성된 노트 상세 보기 표시
    setSelectedNote(newNote);
    setNoteDetailModalOpen(true);
  }

  const handleCardClick = (cardId: string) => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    switch (cardId) {
      case "audio":
        setAudioModalOpen(true)
        break
      case "youtube":
        setYoutubeModalOpen(true)
        break
      case "document":
        setDocumentModalOpen(true)
        break
    }
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar
        onUserClick={() => isAuthenticated ? setUserProfileOpen(true) : setLoginModalOpen(true)}
        onClose={() => setSidebarOpen(false)}
      />
      <SidebarInset onClick={() => sidebarOpen && setSidebarOpen(false)}>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setSidebarOpen(true)}
              className="w-12 h-12 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Button variant="outline" onClick={() => setLoginModalOpen(true)}>
                로그인
              </Button>
            )}
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 space-y-8 p-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isAuthenticated
                ? `안녕하세요, ${user?.name}님! tino-te.ai로 노트를 생성해보세요.`
                : "로그인하여 노트를 생성해보세요."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actionCards.map((card) => {
              const IconComponent = card.icon
              return (
                <Card
                  key={card.id}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800 border-0"
                  onClick={() => handleCardClick(card.id)}
                >
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{card.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {hasNotes && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-gray-100">All Notes</h2>
              </div>

              {/* 노트 목록 */}
              <div className="space-y-3">
                {userNotes.map((note) => (
                  <Card
                    key={note.id}
                    className="bg-gray-50 dark:bg-gray-800 border-0 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleNoteClick(note)}
                  >
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${note.iconBg} rounded-full flex items-center justify-center`}>
                          <note.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold dark:text-gray-100">{note.title}</h3>
                          <p className="text-sm text-muted-foreground">{note.date}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {note.noteType === 'document' ? 'Document' : 'Audio'} • {note.summary?.substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()} // 카드 클릭 이벤트 방지
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNoteClick(note);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNoteClick(note);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!hasNotes && isAuthenticated && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">No notes yet</h3>
              <p className="text-muted-foreground mb-4">Create your first note using one of the options above</p>
            </div>
          )}

          {/* Create Folder 버튼을 항상 표시 (로그인된 경우) */}
          {isAuthenticated && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleCreateFolder}>
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>

      <AudioModal
        open={audioModalOpen}
        onOpenChange={setAudioModalOpen}
        onNoteCreated={handleNoteCreated}
      />
      <YouTubeModal open={youtubeModalOpen} onOpenChange={setYoutubeModalOpen} />
      <DocumentModal
        open={documentModalOpen}
        onOpenChange={setDocumentModalOpen}
        onNoteCreated={handleNoteCreated}
      />
      <FolderModal
        open={folderModalOpen}
        onOpenChange={setFolderModalOpen}
        onFolderCreate={() => handleCreateFolder()}
      />
      <UserProfileModal open={userProfileOpen} onOpenChange={setUserProfileOpen} />
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
      <NoteDetailModal
        open={noteDetailModalOpen}
        onOpenChange={setNoteDetailModalOpen}
        note={selectedNote}
      />
      <DeleteConfirmModal
        open={deleteConfirmModalOpen}
        onOpenChange={setDeleteConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        noteTitle={noteToDelete?.title || ""}
      />
    </SidebarProvider>
  )
}