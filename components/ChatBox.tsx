// components/ChatBox.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Message from './Message';
import Input from './Input';
import { trpc } from '@/lib/trpc/client';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'model';
  type: 'text' | 'image' | 'image_prompt';
  created_at: string;
  user_id: string; // Keep for consistency, though session_id is now primary link
  session_id: string; // New: Link to chat session
}

interface ChatBoxProps {
  currentSessionId: string; // New: Accepts the active session ID
}

const ChatBox: React.FC<ChatBoxProps> = ({ currentSessionId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use useQuery with 'currentSessionId' as input. It will refetch when this prop changes.
  const { data: initialMessages, isLoading: isLoadingMessages, isError: isErrorMessages, error: messagesError, refetch } = trpc.chat.getMessages.useQuery(
    { sessionId: currentSessionId },
    {
      enabled: !!currentSessionId, // Only fetch if currentSessionId is available
      refetchOnWindowFocus: false, // Prevents excessive refetches
      refetchOnReconnect: false,
    }
  );

  const sendTextMutation = trpc.chat.sendTextMessage.useMutation({
    onSuccess: () => {
      refetch(); // Refetch messages after successful send to update UI
    },
    onError: (err) => {
      setError(err.message || 'Failed to send message.');
      console.error('[ChatBox] Error sending message:', err);
    }
  });

  const generateImageMutation = trpc.chat.generateImage.useMutation({
    onSuccess: () => {
      refetch(); // Refetch messages after successful image generation to update UI
    },
    onError: (err) => {
      setError(err.message || 'Failed to generate image.');
      console.error('[ChatBox] Error generating image:', err);
    }
  });


  // Effect to load initial messages when the currentSessionId changes or data arrives
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      console.log(`[ChatBox] Loaded ${initialMessages.length} messages for session ${currentSessionId}`);
    } else if (isErrorMessages) {
      setError(messagesError?.message || 'Failed to load chat history for session.');
      console.error(`[ChatBox] Error loading messages for session ${currentSessionId}:`, messagesError);
      setMessages([]); // Clear messages on error
    } else if (!isLoadingMessages && !initialMessages && currentSessionId) {
        // If loading finished, no initial messages, and a session ID exists, it means the session is new/empty
        setMessages([]);
        console.log(`[ChatBox] Session ${currentSessionId} is new or empty.`);
    }
  }, [initialMessages, isErrorMessages, messagesError, currentSessionId, isLoadingMessages]);

  // Effect to scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);


  const handleSendMessage = async (prompt: string) => {
    console.log('[ChatBox] handleSendMessage called with prompt:', prompt);
    setError(null);
    if (!currentSessionId) {
      setError('No active chat session. Please start a new chat.');
      return;
    }

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: prompt,
      role: 'user',
      type: 'text',
      created_at: new Date().toISOString(),
      user_id: '', // Will be filled by server
      session_id: currentSessionId, // Include session ID
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      console.log('[ChatBox] Calling sendTextMutation...');
      await sendTextMutation.mutateAsync({ prompt, isUser: true, sessionId: currentSessionId });
      // The onSuccess callback will handle refetching and state update
    } catch (err: any) {
      console.error('[ChatBox] Error in handleSendMessage:', err);
      setError(err.message || 'Failed to send message.');
      setMessages((prev) => prev.filter(msg => msg.id !== newUserMessage.id)); // Revert optimistic update
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    console.log('[ChatBox] handleGenerateImage called with prompt:', prompt);
    setError(null);
    if (!currentSessionId) {
      setError('No active chat session. Please start a new chat.');
      return;
    }

    const newUserImagePrompt: ChatMessage = {
      id: crypto.randomUUID(),
      content: prompt,
      role: 'user',
      type: 'image_prompt',
      created_at: new Date().toISOString(),
      user_id: '',
      session_id: currentSessionId, // Include session ID
    };
    setMessages((prev) => [...prev, newUserImagePrompt]);

    try {
      console.log('[ChatBox] Calling generateImageMutation...');
      await generateImageMutation.mutateAsync({ prompt, sessionId: currentSessionId });
      // The onSuccess callback will handle refetching and state update
    } catch (err: any) {
      console.error('[ChatBox] Error in handleGenerateImage:', err);
      setError(err.message || 'Failed to generate image.');
      setMessages((prev) => prev.filter(msg => msg.id !== newUserImagePrompt.id)); // Revert optimistic update
    }
  };

  const isLoading = sendTextMutation.isPending || generateImageMutation.isPending || isLoadingMessages;
  console.log('[ChatBox] Current isLoading state:', isLoading);


  return (
    <Container fluid className="d-flex flex-column p-0" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="message-list flex-grow-1 overflow-y-auto p-3" style={{ flexGrow: 1, overflowY: 'auto' }}>
        {isLoadingMessages && (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading messages...</span>
            </Spinner>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Display initial welcome message if no messages yet */}
        {messages.length === 0 && !isLoadingMessages && !error && (
            <div className="text-center text-muted my-5">
                Start typing to begin your conversation!
            </div>
        )}

        {messages.map((msg) => (
          <Message key={msg.id} content={msg.content} role={msg.role} type={msg.type} />
        ))}

        {isLoading && (sendTextMutation.isPending || generateImageMutation.isPending) && (
          <div className="d-flex justify-content-center my-3">
            <Spinner animation="grow" size="sm" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area p-3 border-top bg-light" style={{ flexShrink: 0 }}>
        <Input onSendMessage={handleSendMessage} onGenerateImage={handleGenerateImage} isLoading={isLoading} />
      </div>
    </Container>
  );
};

export default ChatBox;
