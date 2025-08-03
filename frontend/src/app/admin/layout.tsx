"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 관리자 비밀번호 (실제 환경에서는 환경 변수나 설정 파일에서 가져와야 합니다)
  const ADMIN_PASSWORD = "admin123";

  useEffect(() => {
    // 로컬 스토리지에서 관리자 인증 상태 확인
    const adminAuth = localStorage.getItem("admin_auth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_auth", "true");
      localStorage.setItem("admin_api_key", "admin_secret_key_12345");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_api_key");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">관리자 로그인</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              관리자 페이지에 접근하려면 비밀번호를 입력하세요.
            </p>
          </div>
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full">
              로그인
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                메인 페이지로 돌아가기
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TINO-TE.ai 관리자 페이지</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="text-white border-white hover:bg-blue-700"
            onClick={() => router.push("/")}
          >
            메인 페이지
          </Button>
          <Button
            variant="outline"
            className="text-white border-white hover:bg-blue-700"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}