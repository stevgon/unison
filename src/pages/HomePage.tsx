import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageCard } from '@/components/MessageCard';
import { MessageCardSkeleton } from '@/components/MessageCardSkeleton'; // Import the new skeleton component
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for general use
import type { Message, ApiResponse, PaginatedMessagesResponse } from '@shared/types';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCcw, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuthSession } from '@/hooks/use-auth-session'; // Import the new auth hook
import { authenticatedFetch } from '@/lib/api'; // Import the new authenticated fetch wrapper
// Helper to generate a consistent mock user ID for the session
const getMockUserId = (): string => {
  let userId = localStorage.getItem('mockUserId');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('mockUserId', userId);
  }
  return userId;
};
const MESSAGE_FETCH_LIMIT = 20; // Number of messages to fetch per page
export function HomePage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initial load
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false); // For loading more messages
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true); // Whether more messages are available
  const [nextCursor, setNextCursor] = useState<{ timestamp?: string; id?: string } | null>(null); // Cursor for pagination
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling
  const mockUserId = useRef<string>(getMockUserId()); // Persistent mock user ID for the session
  const {
    token,
    isLoadingSession,
    sessionError,
    requestToken,
    invalidateSession,
    getToken,
  } = useAuthSession(); // Use the new auth hook
  // Standalone async function to fetch messages, accepting state setters and toast as arguments
  const fetchMessages = useCallback(async (isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }
    try {
      let url = `/api/messages?limit=${MESSAGE_FETCH_LIMIT}`;
      if (isLoadMore && nextCursor?.timestamp && nextCursor?.id) {
        url += `&cursorTimestamp=${nextCursor.timestamp}&cursorId=${nextCursor.id}`;
      }
      const response = await authenticatedFetch<PaginatedMessagesResponse>(
        url,
        { method: 'GET' },
        getToken,
        invalidateSession
      );
      if (response.success && response.data) {
        const { messages: newMessages, hasMore: newHasMore, nextCursorTimestamp, nextCursorId } = response.data;
        if (isLoadMore) {
          setMessages((prevMessages) => [...prevMessages, ...newMessages]);
        } else {
          setMessages(newMessages);
        }
        setHasMore(newHasMore);
        setNextCursor({ timestamp: nextCursorTimestamp, id: nextCursorId });
      } else {
        setError(response.error || 'Failed to fetch messages.');
        toast.error('Failed to load messages', { description: response.error || 'Please try again.' });
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      toast.error('Network error', { description: 'Could not connect to the server.' });
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [getToken, invalidateSession]); // Dependencies for useCallback
  // Effect to call the standalone fetchMessages function on component mount
  useEffect(() => {
    // Request token if not available on initial load
    if (!token && !isLoadingSession) {
      requestToken();
    }
    // Fetch messages once token is available or session is loading
    if (token || isLoadingSession) {
      fetchMessages();
    }
  }, [token, isLoadingSession, requestToken, fetchMessages]); // Re-run if token or session loading state changes
  // Effect for auto-scrolling to the bottom of the message list
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); // Scroll whenever messages update
  const handlePostMessage = useCallback(async () => {
    if (newMessageText.trim() === '') {
      toast.warning('Message cannot be empty', { description: 'Please write something before posting.' });
      return;
    }
    if (!token) {
      toast.error('Session required', { description: 'Please refresh the page to get a new session token.' });
      return;
    }
    setIsPosting(true);
    setError(null);
    try {
      const response = await authenticatedFetch<Message[]>(
        '/api/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: newMessageText, mockSenderId: mockUserId.current }),
        },
        getToken,
        invalidateSession
      );
      if (response.success && response.data) {
        // After posting, re-fetch the initial set of messages to get the latest
        // This will reset pagination and show the newest message at the top
        // Assuming the backend returns the full updated list or the latest page
        // The `fetchMessages()` call is redundant if `response.data` already contains the updated list.
        // We reset pagination state and then update messages with the response data.
        setHasMore(true);
        setNextCursor(null);
        setMessages(response.data);
        setNewMessageText('');
        toast.success('Message posted!', { description: 'Your message is now live.' });
      } else {
        setError(response.error || 'Failed to post message.');
        toast.error('Failed to post message', { description: response.error || 'Please try again.' });
      }
    } catch (e) {
      console.error('Error posting message:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      toast.error('Network error', { description: e instanceof Error ? e.message : 'Could not post message.' });
    } finally {
      setIsPosting(false);
    }
  }, [newMessageText, token, getToken, invalidateSession]); // Dependencies on newMessageText, token, and auth functions
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handlePostMessage(); // Send message
    }
  }, [handlePostMessage]);
  const displayLoading = isLoading || isLoadingSession;
  const displayError = error || sessionError;
  return (
    <AppLayout container>
      {/* The main content wrapper, constrained to max-w-3xl and centered, with flex column layout and reduced vertical spacing */}
      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col space-y-4">
        {/* Header - new single-row layout */}
        <header className="flex items-center justify-between py-6 animate-fade-in">
          <div className="flex items-baseline gap-4"> {/* Group title and topic on same line */}
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              Unison
            </h1>
            <p className="text-lg text-muted-foreground">Anonymous Thoughts</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground/80 text-sm flex-shrink-0">Built with ❤️ at Cloudflare</p>
            <ThemeToggle className="" /> {/* Pass empty className to override default absolute positioning */}
          </div>
        </header>
        {/* Message List - now flex-grow and scrollable */}
        <section className="flex-grow overflow-y-auto space-y-6 p-4 border border-border rounded-lg">
          {displayLoading && !isLoadingMore && messages.length === 0 && ( // Only show initial loading skeletons
            <div className="space-y-4">
              {Array.from({ length: MESSAGE_FETCH_LIMIT }).map((_, index) => (
                <MessageCardSkeleton key={index} isCurrentUser={index % 2 === 0} />
              ))}
            </div>
          )}
          {displayError && (
            <div className="text-center py-12 text-destructive">
              <p className="font-semibold">Error: {displayError}</p>
              <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
            </div>
          )}
          {!displayLoading && !displayError && messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-semibold">No messages yet!</p>
              <p className="text-sm">Be the first to share your thoughts.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {!displayLoading && !displayError && messages.length > 0 && (
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
                {hasMore && (
                  <div className="text-center py-4">
                    <Button
                      onClick={() => fetchMessages(true)}
                      disabled={isLoadingMore || isLoading || isPosting}
                      variant="outline"
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {isLoadingMore ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></span>
                          Loading More...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
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
          className="bg-background"
        >
          <Card className="p-4 focus-within:shadow-glow transition-shadow duration-200"> {/* Added focus-within:shadow-glow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <form onSubmit={(e) => { e.preventDefault(); handlePostMessage(); }} className="flex items-end gap-2">
                <Textarea
                  placeholder="What's on your mind? Share your thoughts anonymously..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={handleKeyDown} // Add onKeyDown handler
                  rows={1}
                  className="flex-grow min-h-[2.5rem] max-h-[10rem] overflow-y-auto resize-none bg-secondary text-secondary-foreground border border-input placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
                  disabled={isPosting || isLoadingSession || !token} // Disable if session is loading or no token
                  aria-label="Message content"
                />
                <Button
                  type="submit"
                  className="h-[2.5rem] bg-primary text-primary-foreground hover:bg-primary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 active:scale-95 flex items-center gap-2" // Refined hover:bg-primary/80
                  disabled={isPosting || newMessageText.trim() === '' || isLoadingSession || !token} // Disable if session is loading or no token
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
                  onClick={() => fetchMessages(false)} // Re-fetch initial page
                  disabled={isLoading || isPosting || isLoadingSession} // Disable if session is loading
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 h-[2.5rem] w-[2.5rem]"
                  aria-label="Refresh messages"
                >
                  <motion.span
                    animate={{ rotate: displayLoading ? 360 : 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    initial={{ rotate: 0 }}
                  >
                    <RefreshCcw className="h-5 w-5" />
                  </motion.span>
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