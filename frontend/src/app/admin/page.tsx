"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react"

// 사용자 타입 정의
interface User {
  id: number
  name: string
  student_id: string
  daily_credits: number
  api_key: string
}

// API 기본 URL
const API_BASE_URL = 'http://localhost:8000';

export default function AdminPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({ name: "", student_id: "" })
  const [submitting, setSubmitting] = useState(false)

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const adminApiKey = localStorage.getItem('admin_api_key')
      if (!adminApiKey) {
        throw new Error('관리자 API 키가 없습니다.')
      }
      
      console.log('API 키:', adminApiKey); // 디버깅용
      
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
        headers: {
          'X-Admin-API-Key': adminApiKey
        }
      })
      if (!response.ok) {
        throw new Error('사용자 목록을 가져오는데 실패했습니다.')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "오류 발생",
        description: "사용자 목록을 가져오는데 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 페이지 로드 시 사용자 목록 가져오기
  useEffect(() => {
    fetchUsers()
  }, [])

  // 새 사용자 추가
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.name || !newUser.student_id) {
      toast({
        title: "입력 오류",
        description: "이름과 학번을 모두 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const adminApiKey = localStorage.getItem('admin_api_key')
      if (!adminApiKey) {
        throw new Error('관리자 API 키가 없습니다.')
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-API-Key': adminApiKey
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '사용자 추가에 실패했습니다.')
      }

      toast({
        title: "사용자 추가 성공",
        description: `${newUser.name} (${newUser.student_id}) 사용자가 추가되었습니다.`,
      })

      // 폼 초기화 및 사용자 목록 새로고침
      setNewUser({ name: "", student_id: "" })
      fetchUsers()
    } catch (error: any) {
      console.error('Error adding user:', error)
      toast({
        title: "사용자 추가 실패",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 사용자 삭제
  const handleDeleteUser = async (studentId: string) => {
    if (!confirm(`정말로 학번 ${studentId}의 사용자를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const adminApiKey = localStorage.getItem('admin_api_key')
      if (!adminApiKey) {
        throw new Error('관리자 API 키가 없습니다.')
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${studentId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-API-Key': adminApiKey
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '사용자 삭제에 실패했습니다.')
      }

      toast({
        title: "사용자 삭제 성공",
        description: `학번 ${studentId}의 사용자가 삭제되었습니다.`,
      })

      // 사용자 목록 새로고침
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "사용자 삭제 실패",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // 크레딧 초기화
  const handleResetCredits = async () => {
    if (!confirm('모든 사용자의 크레딧을 초기화하시겠습니까?')) {
      return
    }

    try {
      const adminApiKey = localStorage.getItem('admin_api_key')
      if (!adminApiKey) {
        throw new Error('관리자 API 키가 없습니다.')
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/reset-credits`, {
        method: 'POST',
        headers: {
          'X-Admin-API-Key': adminApiKey
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '크레딧 초기화에 실패했습니다.')
      }

      toast({
        title: "크레딧 초기화 성공",
        description: "모든 사용자의 크레딧이 초기화되었습니다.",
      })

      // 사용자 목록 새로고침
      fetchUsers()
    } catch (error: any) {
      console.error('Error resetting credits:', error)
      toast({
        title: "크레딧 초기화 실패",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">TINO-TE.ai 관리자 페이지</h1>

      {/* 새 사용자 추가 폼 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>베타테스터 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_id">학번</Label>
                <Input
                  id="student_id"
                  value={newUser.student_id}
                  onChange={(e) => setNewUser({ ...newUser, student_id: e.target.value })}
                  placeholder="학번을 입력하세요"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추가 중...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  베타테스터 추가
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>베타테스터 목록</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Button variant="outline" onClick={handleResetCredits}>
              <RefreshCw className="w-4 h-4 mr-2" />
              크레딧 초기화
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">사용자 목록을 불러오는 중...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>학번</TableHead>
                    <TableHead>크레딧</TableHead>
                    <TableHead>API 키</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        등록된 베타테스터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.student_id}</TableCell>
                        <TableCell>{user.daily_credits}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{user.api_key}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.student_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}