// app/chat/page.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Container, Navbar, Button, Spinner, Offcanvas, ListGroup, Form, InputGroup, Alert } from 'react-bootstrap';
import ChatBox from '@/components/ChatBox';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';

// Define the shape of a chat session for the frontend
interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

const ChatPage: React.FC = () => {
  const { user, isLoading, error } = useUser();
  const router = useRouter();

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false); // State for Offcanvas visibility
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null); // State for which session is being edited
  const [newSessionTitle, setNewSessionTitle] = useState<string>(''); // State for the new title input

  // tRPC hooks for sessions and messages
  const createChatSessionMutation = trpc.chat.createChatSession.useMutation();
  const deleteChatSessionMutation = trpc.chat.deleteChatSession.useMutation();
  const updateChatSessionTitleMutation = trpc.chat.updateChatSessionTitle.useMutation();
  // Fetch all chat sessions for the user
  const { data: chatSessions, isLoading: isLoadingSessions, isError: isErrorSessions, refetch: refetchChatSessions } = trpc.chat.getChatSessions.useQuery();

  // Get tRPC context for query invalidation
  const trpcContext = trpc.useContext();

  // Ref for the input field to auto-focus
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("[ChatPage] User not authenticated or session expired, redirecting to login.");
      router.push('/');
    }
    if (error) {
      console.error("[ChatPage] Auth0 error:", error);
      router.push('/');
    }
  }, [user, isLoading, error, router]);

  // Handle initial session loading or creation
  useEffect(() => {
    if (user && chatSessions && !isLoadingSessions) {
      if (chatSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(chatSessions[0].id);
        console.log("[ChatPage] Set initial chat session to:", chatSessions[0].id);
      } else if (chatSessions.length === 0 && !currentSessionId) {
        handleNewChat();
      }
    }
  }, [user, chatSessions, isLoadingSessions, currentSessionId]);

  // Effect to focus the input field when editing starts
  useEffect(() => {
    if (editingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [editingSessionId]);

  // Handler to create a new chat session
  const handleNewChat = async () => {
    setShowOffcanvas(false);
    setEditingSessionId(null);
    try {
      console.log("[ChatPage] Creating new chat session...");
      const newSession = await createChatSessionMutation.mutateAsync();
      console.log("[ChatPage] New chat session created:", newSession.id);
      setCurrentSessionId(newSession.id);
      await refetchChatSessions();
      await trpcContext.chat.getMessages.invalidate();
    } catch (err: any) {
      console.error("[ChatPage] Failed to create new chat session:", err);
      window.alert(`Failed to create new chat: ${err.message}`);
    }
  };

  // Handler to switch to an existing chat session
  const handleSelectSession = async (sessionId: string) => {
    setShowOffcanvas(false);
    setEditingSessionId(null);
    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
      console.log("[ChatPage] Switched to chat session:", sessionId);
      await trpcContext.chat.getMessages.invalidate();
    }
  };

  // Handler to delete a chat session
  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this chat session? This cannot be undone.")) {
      try {
        console.log(`[ChatPage] Deleting session: ${sessionId}`);
        await deleteChatSessionMutation.mutateAsync({ sessionId });
        console.log(`[ChatPage] Session ${sessionId} deleted.`);
        await refetchChatSessions();

        if (currentSessionId === sessionId) {
          if (chatSessions && chatSessions.length > 1) {
            const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
            setCurrentSessionId(remainingSessions[0].id);
            await trpcContext.chat.getMessages.invalidate();
          } else {
            setCurrentSessionId(null);
            handleNewChat();
          }
        }
      } catch (err: any) {
        console.error(`[ChatPage] Failed to delete session ${sessionId}:`, err);
        window.alert(`Failed to delete chat: ${err.message}`);
      }
    }
  };

  // Handler to start renaming a session
  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setNewSessionTitle(session.title);
  };

  // Handler for input change during rename
  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSessionTitle(e.target.value);
  };

  // Handler to save the new title
  const handleSaveTitle = async (sessionId: string) => {
    if (newSessionTitle.trim() === '') {
      window.alert("Chat title cannot be empty.");
      return;
    }
    try {
      console.log(`[ChatPage] Renaming session ${sessionId} to "${newSessionTitle}"`);
      await updateChatSessionTitleMutation.mutateAsync({ sessionId, newTitle: newSessionTitle.trim() });
      console.log(`[ChatPage] Session ${sessionId} renamed successfully.`);
      await refetchChatSessions();
      setEditingSessionId(null);
      setNewSessionTitle('');
    } catch (err: any) {
      console.error(`[ChatPage] Failed to rename session ${sessionId}:`, err);
      window.alert(`Failed to rename chat: ${err.message}`);
    }
  };

  // NEW: Handler for pressing Enter key during rename (updated event type)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, sessionId: string) => {
    if (e.key === 'Enter') {
      handleSaveTitle(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setNewSessionTitle('');
    }
  };


  if (isLoading) {
    console.log("[ChatPage] Auth0 is loading user session...");
    return (
      <Container fluid className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading authentication...</span>
        </Spinner>
      </Container>
    );
  }

  if (!user) {
    console.log("[ChatPage] No user found after loading, showing access denied message.");
    return (
      <Container fluid className="text-center p-5 d-flex flex-column justify-content-center align-items-center vh-100">
        <h1>Access Denied</h1>
        <p>Please log in to access the chat application.</p>
        <Button variant="primary" onClick={() => router.push('/')} className="rounded-pill px-4 py-2">
          Go to Login
        </Button>
      </Container>
    );
  }

  console.log("[ChatPage] User authenticated:", user.name || user.email || user.sub);
  const currentSession = chatSessions?.find(s => s.id === currentSessionId);
  const currentSessionTitle = currentSession?.title || "New Chat";


  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Button variant="primary" onClick={() => setShowOffcanvas(true)} className="me-2">
            <i className="fas fa-bars"></i>
          </Button>
          <Navbar.Brand href="#" className="fw-bold text-truncate" style={{ maxWidth: '200px' }}>
            {currentSessionTitle}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="d-flex w-100 justify-content-end align-items-center">
              <Button
                variant="outline-light"
                onClick={handleNewChat}
                className="rounded-pill me-2 px-3 py-1"
              >
                + New Chat
              </Button>
              <Button href="/api/auth/logout" variant="outline-light" className="rounded-pill">
                Logout
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Offcanvas for Chat Sessions */}
      <Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} placement="start" scroll={true} backdrop={true}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Your Chats</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          <Button variant="primary" onClick={handleNewChat} className="mb-3 rounded-pill">
            + Start New Chat
          </Button>
          {isLoadingSessions ? (
            <div className="d-flex justify-content-center my-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : isErrorSessions ? (
            <Alert variant="danger">Failed to load chats.</Alert>
          ) : (
            <ListGroup variant="flush">
              {chatSessions?.map((session) => (
                <ListGroup.Item
                  key={session.id}
                  action
                  onClick={() => handleSelectSession(session.id)}
                  active={session.id === currentSessionId}
                  className="d-flex justify-content-between align-items-center py-2 pe-0"
                >
                  {editingSessionId === session.id ? (
                    <InputGroup className="flex-grow-1">
                      <Form.Control
                        ref={renameInputRef}
                        type="text"
                        value={newSessionTitle}
                        onChange={handleChangeTitle}
                        onKeyDown={(e) => handleKeyDown(e, session.id)} // Fixed type here
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => handleSaveTitle(session.id)}
                        className="rounded-start"
                      />
                      <Button variant="success" onClick={(e) => {
                        e.stopPropagation();
                        handleSaveTitle(session.id);
                      }} className="rounded-end">
                        <i className="fas fa-check"></i>
                      </Button>
                    </InputGroup>
                  ) : (
                    <>
                      <div className="flex-grow-1 text-truncate pe-2">
                        {session.title || `Chat ${new Date(session.created_at).toLocaleDateString()}`}
                      </div>
                      <div className="d-flex align-items-center">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="ms-2 border-0"
                          onClick={(e) => handleStartRename(session, e)}
                          title="Rename Chat"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-2 border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          title="Delete Chat"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {currentSessionId ? (
        <ChatBox currentSessionId={currentSessionId} />
      ) : (
        <Container fluid className="d-flex justify-content-center align-items-center flex-column vh-100">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading chat...</span>
          </Spinner>
          <p>Waiting for a chat session to be created or loaded...</p>
        </Container>
      )}
    </>
  );
};

export default ChatPage;
