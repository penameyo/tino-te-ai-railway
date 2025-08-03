"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserInfo } from './api';

// 사용자 타입 정의
export interface User {
  id: string;
  student_id: string;
  name: string;
  daily_credits: number;
  api_key?: string;
}

// 인증 컨텍스트 타입 정의
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

// 기본값으로 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

// 인증 컨텍스트 제공자 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 로컬 스토리지에서 토큰 불러오기
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserInfo(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // 사용자 정보 가져오기
  const fetchUserInfo = async (authToken: string) => {
    try {
      setIsLoading(true);
      const userData = await getUserInfo(authToken);
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 함수
  const login = async (authToken: string) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    await fetchUserInfo(authToken);
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 인증 컨텍스트 사용을 위한 훅
export function useAuth() {
  return useContext(AuthContext);
}