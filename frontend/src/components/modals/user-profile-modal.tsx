"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageCircle, LogOut, ClipboardList } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center w-full">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
              <Image
                src="/tino-logo.png"
                alt="User Avatar"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">User Profile</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="karim@example.com" />
          </div>

          <Button variant="outline" className="w-full justify-start bg-transparent">
            <ClipboardList className="w-4 h-4 mr-2" />
            Review
          </Button>

          <Button variant="outline" className="w-full justify-start bg-transparent">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
