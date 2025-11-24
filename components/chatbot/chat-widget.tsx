"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, X, Send, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// === CHATBASE CONFIG ===
const CHATBASE_BOT_ID = "gwPtDlzvkWYz03H8JnUFU"
const CHATBASE_DOMAIN = "www.chatbase.co"

async function getChatbaseToken(userId: string, email: string): Promise<string> {
  const res = await fetch("/api/chatbase/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, email }),
  })
  if (!res.ok) throw new Error("Failed to get Chatbase token")
  const data = await res.json()
  return data.token
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi! How can I help you today?" },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user, userProfile } = useAuth()

  // Load Chatbase script
  useEffect(() => {
    if (typeof window === "undefined" || (window as any).chatbase) return

    const script = document.createElement("script")
    script.src = "https://www.chatbase.co/embed.min.js"
    script.id = CHATBASE_BOT_ID
    script.domain = CHATBASE_DOMAIN
    script.async = true
    document.body.appendChild(script)

    ;(window as any).chatbase = (...args: any[]) => {
      ;((window as any).chatbase.q = (window as any).chatbase.q || []).push(args)
    }

    return () => {
      document.getElementById(CHATBASE_BOT_ID)?.remove()
    }
  }, [])

  // Identify user
  useEffect(() => {
    if (!user || !isOpen) return

    getChatbaseToken(user.uid, userProfile?.email || user.email || "")
      .then((token) => {
        if ((window as any).chatbase) {
          ;(window as any).chatbase("identify", { token })
        }
      })
      .catch(console.error)
  }, [user, userProfile, isOpen])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setInput("")
    setLoading(true)

    if ((window as any).chatbase) {
      ;(window as any).chatbase("send", "user_message", userMessage)
    }

    const handler = (event: any) => {
      if (event.type === "assistant_message" && event.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: event.message }])
        setLoading(false)
        window.removeEventListener("chatbase", handler)
      }
    }
    window.addEventListener("chatbase", handler)

    // Fallback
    setTimeout(() => {
      if (loading) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting." }])
        setLoading(false)
      }
    }, 15000)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 z-50 transition-all hover:scale-110"
        size="icon"
      >
        <MessageSquare className="w-7 h-7" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-lg font-semibold">ParkShare Assistant</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 bg-background">
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-4 pb-20">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="Ask me anything about parking..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-full">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-2">Powered by Chatbase AI</p>
        </div>
      </CardContent>
    </Card>
  )
}