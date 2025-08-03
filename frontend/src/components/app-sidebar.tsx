"use client"

import type * as React from "react"
import { Home, ChevronLeft, Send } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

// 피드백 클릭 추적 함수
const trackFeedbackClick = async (userId: string) => {
  try {
    const trackingData = {
      userId,
      timestamp: new Date().toISOString(),
      currentPage: window.location.pathname,
      dayOfWeek: new Date().toLocaleDateString('ko-KR', { weekday: 'long' }),
      weekNumber: Math.ceil((new Date().getDate()) / 7)
    };
    
    // 로컬 스토리지에 임시 저장 (나중에 API로 전송)
    const existingClicks = JSON.parse(localStorage.getItem('feedbackClicks') || '[]');
    existingClicks.push(trackingData);
    localStorage.setItem('feedbackClicks', JSON.stringify(existingClicks));
    
    console.log('✅ Feedback click tracked:', trackingData);
    
    // 콘솔에 성공 메시지 표시
    alert('피드백 페이지로 이동합니다!');
  } catch (error) {
    console.error('❌ Failed to track feedback click:', error);
    // 추적 실패해도 피드백 페이지는 열기
  }
};

const navigation = [
  {
    title: "Dashboard",
    icon: Home,
    isActive: true,
  },
]

// 크레딧 정보는 사용자 정보에서 가져옵니다
const DEFAULT_TOTAL_CREDITS = 10; // 기본 총 크레딧 (매일 초기화)

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onUserClick: () => void
  onClose?: () => void
}

export function AppSidebar({ onUserClick, onClose, ...props }: AppSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <div className="w-6 h-6 rounded overflow-hidden">
                <Image
                  src="/tino-logo.png"
                  alt="TINO-TE.ai"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              tino-te.ai BETA
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Credit Info */}
          {isAuthenticated && user ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚡</span>
                <span className="text-sm font-medium">Credits</span>
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {user.daily_credits} / {DEFAULT_TOTAL_CREDITS}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className={`${
                    user.daily_credits > 0 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500" 
                      : "bg-gray-400"
                  } h-2 rounded-full transition-all duration-300`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, (user.daily_credits / DEFAULT_TOTAL_CREDITS) * 100))}%` 
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚡</span>
                <span className="text-sm font-medium">Credits</span>
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                로그인 필요
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-gray-400 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }} />
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href="#" className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              console.log('🔥 Button clicked!');
              alert('버튼이 클릭되었습니다!');
              
              if (isAuthenticated && user) {
                console.log('✅ User is authenticated:', user.name);
                alert(`안녕하세요 ${user.name}님! 피드백 페이지로 이동합니다.`);
                window.open('https://naver.me/FGEhxMpm', '_blank');
              } else {
                console.log('❌ User not authenticated');
                alert('로그인이 필요합니다. 로그인 모달을 엽니다.');
                onUserClick();
              }
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Feedback
          </Button>

          <div
            className="flex items-center gap-3 mt-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            onClick={onUserClick}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src="/tino-logo.png"
                alt="User Avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            {isAuthenticated && user ? (
              <span className="text-sm font-medium">{user.name}</span>
            ) : (
              <span className="text-sm font-medium">Log in</span>
            )}
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
