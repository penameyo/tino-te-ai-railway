"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface YouTubeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function YouTubeModal({ open, onOpenChange }: YouTubeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center w-full">
            <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold text-center">YouTube video</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <Input placeholder="Paste a YouTube link" className="h-12" />

          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12"
            onClick={() => {
              alert('추후 업데이트 예정입니다!');
            }}
          >
            Generate Notes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
