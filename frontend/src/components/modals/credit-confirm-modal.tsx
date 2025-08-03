"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface CreditConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  creditCost: number;
  actionType: 'audio' | 'document';
}

export function CreditConfirmModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  creditCost, 
  actionType 
}: CreditConfirmModalProps) {
  const actionTypeText = actionType === 'audio' ? '오디오 파일' : '문서 파일';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex flex-col items-center w-full">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">크레딧 사용 확인</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-center mb-4">
            이 {actionTypeText}을 처리하면 <span className="font-bold text-amber-600">{creditCost} 크레딧</span>이 차감됩니다.
          </p>
          <p className="text-center text-sm text-gray-500">
            크레딧은 매일 자정에 10으로 초기화됩니다.
          </p>
        </div>
        
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}