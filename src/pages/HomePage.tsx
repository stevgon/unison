import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageCard } from '@/components/MessageCard';
import type { Message, ApiResponse } from '@shared/types';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCcw, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
// Helper to generate a consistent mock user ID for the session
const getMockUserId = (): string => {
  let userId = localStorage.getItem('mockUserId');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('mockUserId', userId);
  }
  return userId;
};
// Standalone async function to fetch messages, accepting state setters and toast as arguments
async function fetchMessages(
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  toast: typeof import('@/components/ui/sonner').toast
) {
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
}
export function HomePage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling
  const mockUserId = useRef<string>(getMockUserId()); // Persistent mock user ID for the session
  // Effect to call the standalone fetchMessages function on component mount
  useEffect(() => {
    fetchMessages(setIsLoading, setError, setMessages, toast);
  }, []); // Empty dependency array ensures this runs only once on mount
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
    <AppLayout
      container
      footer={
        <footer className="absolute bottom-0 left-0 p-4 text-muted-foreground/80 text-sm rotate-90 transform-origin-top-left z-50">
          <p>Built with ❤️ at Cloudflare</p>
        </footer>
      }
    >
      {/* The main content wrapper, constrained to max-w-3xl and centered, with flex column layout */}
      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col relative space-y-6">
        {/* Header - with dedicated vertical padding */}
        <header className="text-center space-y-2 animate-fade-in py-8 md:py-10 lg:py-12 relative">
          <ThemeToggle className="absolute top-4 right-4 md:top-6 md:right-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Unison
          </h1>
        </header>
        {/* Message List - now flex-grow and scrollable */}
        <section className="flex-grow overflow-y-auto space-y-6 p-4 border border-border rounded-lg">
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
                    isCurrentUser={message.mockSenderId === mockUserId.current}
                  />
                ))}
                <div ref={messagesEndRef} /> {/* Element to scroll into view */}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        {/* Message Submission Form - sticky at the bottom */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-background border-t border-border"
        >
          <Card className="p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <form onSubmit={handlePostMessage} className="flex items-end gap-2">
                <Textarea
                  placeholder="What's on your mind? Share your thoughts anonymously..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  rows={1}
                  className="flex-grow min-h-[2.5rem] max-h-[10rem] overflow-y-auto resize-none bg-secondary text-secondary-foreground border border-input placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
                  disabled={isPosting}
                  aria-label="Message content"
                />
                <Button
                  type="submit"
                  className="h-[2.5rem] bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 active:scale-95 flex items-center gap-2"
                  disabled={isPosting || newMessageText.trim() === ''}
                  aria-label="Send message"
                >
                  {isPosting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
                      <span className="sr-only sm:not-sr-only">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">Send</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchMessages(setIsLoading, setError, setMessages, toast)}
                  disabled={isLoading || isPosting}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 h-[2.5rem] w-[2.5rem]"
                  aria-label="Refresh messages"
                >
                  <RefreshCcw className="h-5 w-5" />
                  <span className="sr-only">Refresh Messages</span>
                </Button>
              </form>
            </motion.div>
          </Card>
        </motion.section>
        <Toaster richColors closeButton />
      </div>
    </AppLayout>
  );
}