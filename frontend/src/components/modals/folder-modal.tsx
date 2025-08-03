"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFolderCreate?: (folderName: string) => void
}

export function FolderModal({ open, onOpenChange, onFolderCreate }: FolderModalProps) {
  const [folderName, setFolderName] = useState("")

  const handleCreateFolder = () => {
    if (folderName.trim() && onFolderCreate) {
      onFolderCreate(folderName.trim())
      setFolderName("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-full">
            <DialogTitle className="text-xl font-semibold mb-2">Create new folder</DialogTitle>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Use folders to organize notes.</p>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <Input
            placeholder="Enter folder name (Ex: Computer Science 101)"
            className="h-12"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
          />

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            onClick={handleCreateFolder}
            disabled={!folderName.trim()}
          >
            Create folder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
