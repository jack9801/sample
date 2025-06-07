// app/chat/page.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Container, Navbar, Button, Spinner, Offcanvas, ListGroup, Form, InputGroup, Alert, Col } from 'react-bootstrap';
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
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);

  // tRPC hooks for sessions and messages (CORRECT HOOK NAMES)
  const createSessionMutation = trpc.chat.createSession.useMutation();
  const deleteSessionMutation = trpc.chat.deleteSession.useMutation();
  const renameSessionMutation = trpc.chat.renameSession.useMutation();
  const { data: chatSessions, isLoading: isLoadingSessions, isError: isErrorSessions, refetch: refetchChatSessions } = trpc.chat.getSessions.useQuery();

  // Get tRPC context for query invalidation
  const trpcContext = trpc.useContext();

  // Ref for the input field to auto-focus
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
    if (error) {
      router.push('/');
    }
  }, [user, isLoading, error, router]);

  // Handle initial session loading or creation
  useEffect(() => {
    const savedSessionId = localStorage.getItem("currentSessionId");
    if (savedSessionId && isValidUUID(savedSessionId)) {
      setCurrentSessionId(savedSessionId);
    }
    setRestoredFromStorage(true);
  }, []);

  // Auto-select or create a session on load
  useEffect(() => {
    if (
      user &&
      chatSessions &&
      !isLoadingSessions &&
      restoredFromStorage
    ) {
      if (chatSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(chatSessions[0].id);
      } else if (chatSessions.length === 0 && !currentSessionId) {
        handleNewChat();
      }
    }
    // eslint-disable-next-line
  }, [user, chatSessions, isLoadingSessions, currentSessionId, restoredFromStorage]);

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
      const newSession = await createSessionMutation.mutateAsync({ title: `New Chat ${sessions.length + 1}` });
      setCurrentSessionId(newSession.id);
      await refetchChatSessions();
      await trpcContext.chat.getMessages.invalidate();
    } catch (err: any) {
      window.alert(`Failed to create new chat: ${err.message}`);
    }
  };

  // Handler to switch to an existing chat session
  const handleSelectSession = async (sessionId: string) => {
    setShowOffcanvas(false);
    setEditingSessionId(null);
    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
      await trpcContext.chat.getMessages.invalidate();
    }
  };

  // Handler to delete a chat session
  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this chat session? This cannot be undone.")) {
      try {
        await deleteSessionMutation.mutateAsync({ sessionId });
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
      await renameSessionMutation.mutateAsync({ sessionId, newTitle: newSessionTitle.trim() });
      await refetchChatSessions();
      setEditingSessionId(null);
      setNewSessionTitle('');
    } catch (err: any) {
      window.alert(`Failed to rename chat: ${err.message}`);
    }
  };

  // Handler for pressing Enter/Escape during rename
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, sessionId: string) => {
    if (e.key === 'Enter') {
      handleSaveTitle(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setNewSessionTitle('');
    }
  };

  // Sync local sessions state with query data
  useEffect(() => {
    console.log("chatSessions changed:", chatSessions);
    if (chatSessions) {
      setSessions(chatSessions);
    }
  }, [chatSessions]);

  // Restore currentSessionId from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem("currentSessionId");
    if (savedSessionId && isValidUUID(savedSessionId)) {
      setCurrentSessionId(savedSessionId);
    }
    setRestoredFromStorage(true);
  }, []);

  // Save currentSessionId to localStorage whenever it changes
  useEffect(() => {
    if (currentSessionId && isValidUUID(currentSessionId)) {
      localStorage.setItem("currentSessionId", currentSessionId);
    }
  }, [currentSessionId]);

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading authentication...</span>
        </Spinner>
      </Container>
    );
  }

  if (!user) {
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
              {sessions.map((session) => (
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
                        onKeyDown={(e) => handleKeyDown(e, session.id)}
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

      <Container fluid className="d-flex flex-column flex-md-row vh-100 p-0">
        {/* Sidebar for chat sessions - hidden on small screens */}
        <Col xs={12} md={3} className="p-0 border-end d-flex flex-column bg-light d-none d-md-flex">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Chats</h6>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                if (!createSessionMutation.isPending) {
                  createSessionMutation.mutate({ title: `New Chat ${sessions.length + 1}` });
                }
              }}
              disabled={createSessionMutation.isPending}
              className="rounded-pill"
            >
              {createSessionMutation.isPending ? <Spinner animation="border" size="sm" /> : <i className="fas fa-plus me-1"></i>}
              New Chat
            </Button>
          </div>
          <div className="list-group list-group-flush flex-grow-1 overflow-y-auto">
            {sessions.map((session) => (
              <div key={session.id} className="d-flex align-items-center">
                <Button
                  as="a"
                  href="#"
                  className={`flex-grow-1 text-start list-group-item list-group-item-action ${session.id === currentSessionId ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setCurrentSessionId(session.id); }}
                >
                  {session.title || `Chat ${new Date(session.created_at).toLocaleDateString()}`}
                </Button>
                {/* Rename */}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="ms-1"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const newTitle = prompt("Enter new chat title:", session.title);
                    if (newTitle && newTitle.trim() && newTitle !== session.title) {
                      await renameSessionMutation.mutateAsync({ sessionId: session.id, newTitle: newTitle.trim() });
                      await refetchChatSessions();
                    }
                  }}
                  title="Rename Chat"
                >
                  <i className="fas fa-pencil-alt"></i>
                </Button>
                {/* Delete */}
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="ms-1"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this chat?")) {
                      await deleteSessionMutation.mutateAsync({ sessionId: session.id });
                      await refetchChatSessions();
                      if (currentSessionId === session.id) setCurrentSessionId(null);
                    }
                  }}
                  title="Delete Chat"
                >
                  <i className="fas fa-trash"></i>
                </Button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="p-3 text-center text-muted">No chats yet. Click "New Chat" to start.</div>
            )}
          </div>
        </Col>

        <Col xs={12} md={9} className="p-0">
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
        </Col>
      </Container>
    </>
  );
};

export default ChatPage;

function isValidUUID(uuid: any) {
  // Basic UUID validation regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
}
