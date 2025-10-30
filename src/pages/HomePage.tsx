import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageCard } from '@/components/MessageCard';
import { TypingIndicator } from '@/components/TypingIndicator';
import type { Message, ApiResponse } from '@shared/types';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCcw, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
// Helper to generate a consistent mock user ID
const getMockUserId = (): string => {
  let userId = localStorage.getItem('mockUserId');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('mockUserId', userId);
  }
  return userId;
};
export function HomePage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling
  const mockUserId = useRef<string>(getMockUserId()); // Persistent mock user ID for the session
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<Message[]> = await response.json();
      if (data.success && data.data) {
        setMessages(data.data);
      } else {
        setError(data.error || 'Failed to fetch messages.');
        toast.error('Failed to load messages', { description: data.error || 'Please try again.' });
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      toast.error('Network error', { description: 'Could not connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  // Effect to manage typing indicator
  useEffect(() => {
    if (newMessageText.length > 0) {
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000); // Simulate typing for 3 seconds
    } else {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessageText]);
  // Effect for auto-scrolling to the bottom of the message list
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); // Scroll whenever messages update
  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessageText.trim() === '') {
      toast.warning('Message cannot be empty', { description: 'Please write something before posting.' });
      return;
    }
    setIsPosting(true);
    setError(null);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newMessageText, mockSenderId: mockUserId.current }), // Pass mockSenderId
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<Message[]> = await response.json();
      if (data.success && data.data) {
        setMessages(data.data);
        setNewMessageText('');
        toast.success('Message posted!', { description: 'Your message is now live.' });
      } else {
        setError(data.error || 'Failed to post message.');
        toast.error('Failed to post message', { description: data.error || 'Please try again.' });
      }
    } catch (e) {
      console.error('Error posting message:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      toast.error('Network error', { description: 'Could not post message.' });
    } finally {
      setIsPosting(false);
    }
  };
  return (
    <AppLayout container className="min-h-screen">
      {/* The main content wrapper, now constrained to max-w-3xl and centered */}
      <div className="max-w-3xl mx-auto space-y-12 py-12 md:py-16"> {/* Added vertical spacing */}
        <ThemeToggle className="absolute top-4 right-4 md:top-6 md:right-6" />
        {/* Header */}
        <header className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Unison
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            A serene, anonymous space for a single topic discussion.
          </p>
        </header>
        {/* Message Submission Form - Transformed into a chat-like input */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-4"
        >
          <Card className="p-4">
            <form onSubmit={handlePostMessage} className="space-y-4">
              <Textarea
                placeholder="What's on your mind? Share your thoughts anonymously..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                rows={4}
                className="w-full bg-secondary text-secondary-foreground border border-input placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
                disabled={isPosting}
                aria-label="Message content" // ARIA label for accessibility
              />
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={fetchMessages}
                  disabled={isLoading || isPosting}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  aria-label="Refresh messages" // ARIA label for accessibility
                >
                  <RefreshCcw className="h-5 w-5" />
                  <span className="sr-only">Refresh Messages</span>
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 active:scale-95 flex items-center gap-2"
                  disabled={isPosting || newMessageText.trim() === ''}
                  aria-label="Send message" // ARIA label for accessibility
                >
                  {isPosting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>
        </motion.section>
        {/* Message List */}
        <section className="space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-4 text-muted-foreground">Loading messages...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-12 text-destructive">
              <p className="font-semibold">Error: {error}</p>
              <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
            </div>
          )}
          {!isLoading && !error && messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-semibold">No messages yet!</p>
              <p className="text-sm">Be the first to share your thoughts.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {!isLoading && !error && messages.length > 0 && (
              <motion.div
                layout
                className="space-y-4"
              >
                {messages.map((message) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    isCurrentUser={message.mockSenderId === mockUserId.current} // Use persistent mockUserId
                  />
                ))}
                <div ref={messagesEndRef} /> {/* Element to scroll into view */}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <footer className="text-center text-muted-foreground/80 pt-12">
          <p>Built with ❤️ at Cloudflare</p>
        </footer>
        <Toaster richColors closeButton />
      </div>
    </AppLayout>
  );
}