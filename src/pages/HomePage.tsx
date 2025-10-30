import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageCard } from '@/components/MessageCard';
import type { Message, ApiResponse } from '@shared/types';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
export function HomePage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
        body: JSON.stringify({ text: newMessageText }),
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
      <div className="max-w-3xl mx-auto space-y-12">
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
        {/* Message Submission Form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-6"
        >
          <form onSubmit={handlePostMessage} className="space-y-4">
            <Textarea
              placeholder="What's on your mind? Share your thoughts anonymously..."
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              rows={4}
              className="w-full bg-secondary text-secondary-foreground border border-input placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
              disabled={isPosting}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={fetchMessages}
                disabled={isLoading || isPosting}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 active:scale-95"
                disabled={isPosting || newMessageText.trim() === ''}
              >
                {isPosting ? 'Posting...' : 'Post Message'}
              </Button>
            </div>
          </form>
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
                className="space-y-6"
              >
                {messages.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <footer className="text-center text-muted-foreground/80 pt-12">
          <p>Built with ❤�� at Cloudflare</p>
        </footer>
        <Toaster richColors closeButton />
      </div>
    </AppLayout>
  );
}