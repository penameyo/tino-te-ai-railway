"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  noteTitle: string
}

export function DeleteConfirmModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  noteTitle 
}: DeleteConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center w-full">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">노트를 삭제하시겠습니까?</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              다음 노트가 영구적으로 삭제됩니다:
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 p-2 rounded">
              &quot;{noteTitle}&quot;
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleConfirm}
            >
              삭제
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}