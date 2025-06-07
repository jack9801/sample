"use client"; // This directive marks this component as a Client Component

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import ChatBox from '../components/ChatBox'; // Your ChatBox component
import { trpc } from '../lib/trpc/client'; // Import tRPC client

// ChatSession type matches backend (uses title)
interface ChatSession {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
}

export default function HomePage() {
  const { user, error: authError, isLoading: isLoadingAuth } = useUser();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Fetch all sessions for the user
  const getSessionsQuery = trpc.chat.getSessions.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const createSessionMutation = trpc.chat.createSession.useMutation();

  // Restore session ID from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem("currentSessionId");
    if (savedSessionId && isValidUUID(savedSessionId)) {
      setCurrentSessionId(savedSessionId);
    }
  }, []);

  // Save session ID to localStorage whenever it changes
  useEffect(() => {
    if (currentSessionId && isValidUUID(currentSessionId)) {
      localStorage.setItem("currentSessionId", currentSessionId);
    }
  }, [currentSessionId]);

  // Log currentSessionId whenever it changes
  useEffect(() => {
    console.log('[HomePage] currentSessionId changed to:', currentSessionId);
    if (currentSessionId && !isValidUUID(currentSessionId)) {
      console.error('[HomePage] WARNING: currentSessionId is NOT a valid UUID:', currentSessionId);
    }
  }, [currentSessionId]);

  // Use effect to handle data changes
  useEffect(() => {
    if (getSessionsQuery.data) {
      setSessions(getSessionsQuery.data as ChatSession[]);
      if (getSessionsQuery.data.length > 0 && !currentSessionId) {
        setCurrentSessionId(getSessionsQuery.data[0].id);
      }
    }
  }, [getSessionsQuery.data, currentSessionId]);

  // Helper function to validate UUID format
  const isValidUUID = (uuid: string) => {
    // Basic UUID v4 regex validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };


  // --- Render based on Auth0 status ---

  if (isLoadingAuth) {
    // Show a loading spinner while Auth0 checks session
    return (
      <Container fluid className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light text-center">
        <Spinner animation="border" role="status" className="mb-3 text-primary" />
        <p className="text-muted">Checking your authentication status...</p>
      </Container>
    );
  }

  if (authError) {
    // Display an error if Auth0 encounters one
    console.error("Auth0 error:", authError);
    return (
      <Container fluid className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light text-center p-4">
        <Alert variant="danger" className="w-100 shadow-sm rounded-lg border-0" style={{ maxWidth: '400px' }}>
          <h4 className="alert-heading fw-bold">Authentication Error!</h4>
          <p className="mb-4">An error occurred during authentication: <br /> {authError.message}</p>
          <hr />
          <Button href="/api/auth/login" variant="outline-danger" className="w-100 rounded-pill fw-bold">
            <i className="fas fa-sign-in-alt me-2"></i> Try Logging In Again
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!user) {
    // --- Unauthenticated User Landing Page ---
    return (
      <Container fluid className="d-flex flex-column align-items-center justify-content-center vh-100 bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3 text-shadow">
            <i className="fas fa-robot me-3"></i>ChatGPT Clone
          </h1>
          <p className="lead opacity-75 mb-0">
            Your personal AI assistant for conversations and creative tasks.
          </p>
        </div>

        <div className="d-grid gap-3 w-100" style={{ maxWidth: '300px' }}>
          <Button href="/api/auth/login" variant="light" size="lg" className="rounded-pill fw-bold shadow-lg py-3">
            <i className="fas fa-sign-in-alt me-2"></i> Sign In
          </Button>
          <Button href="/api/auth/login?screen_hint=signup" variant="outline-light" size="lg" className="rounded-pill fw-bold py-3 border-2">
            <i className="fas fa-user-plus me-2"></i> Sign Up
          </Button>
        </div>

        <p className="text-muted mt-5 opacity-75">
          Secure authentication powered by Auth0.
        </p>
      </Container>
    );
  }

  // --- Authenticated User - Main Chat Application ---
  return (
    <Container fluid className="d-flex flex-column h-100 p-0 vh-100">
      {/* Top Bar for Mobile - Username and Logout */}
      <Row className="p-3 bg-dark text-white align-items-center justify-content-between mx-0" style={{ flexShrink: 0 }}>
        <Col className="text-start">
          <h5 className="mb-0">Hi, {user.name || 'User'}!</h5>
        </Col>
        <Col xs="auto">
          <Button href="/api/auth/logout" variant="outline-light" size="sm" className="rounded-pill">
            <i className="fas fa-sign-out-alt me-2"></i>Logout
          </Button>
        </Col>
      </Row>

      {/* Main Content Area - Sessions (Left) and ChatBox (Right) */}
      <Row className="flex-grow-1 mx-0" style={{ overflow: 'hidden' }}>
        {/* Sessions Sidebar - Use Bootstrap responsive classes */}
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
          {getSessionsQuery.isLoading && <div className="p-3 text-center text-muted"><Spinner animation="border" size="sm" /> Loading sessions...</div>}
          {getSessionsQuery.isError && <Alert variant="danger" className="m-3">Error: {getSessionsQuery.error.message}</Alert>}
          <div className="list-group list-group-flush flex-grow-1 overflow-y-auto">
            {sessions.map((session) => (
              <Button
                key={session.id}
                as="a"
                href="#"
                className={`list-group-item list-group-item-action ${session.id === currentSessionId ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentSessionId(session.id); }}
              >
                {session.title || `Chat ${new Date(session.created_at).toLocaleDateString()}`}
              </Button>
            ))}
            {sessions.length === 0 && !getSessionsQuery.isLoading && !generalError && (
              <div className="p-3 text-center text-muted">No chats yet. Click "New Chat" to start.</div>
            )}
          </div>
        </Col>

        {/* Chat Box Area */}
        <Col xs={12} md={9} className="d-flex flex-column p-0">
          {generalError && <Alert variant="danger" className="m-3">{generalError}</Alert>}
          {currentSessionId && isValidUUID(currentSessionId) ? ( // Ensure sessionId is valid before rendering ChatBox
            <ChatBox currentSessionId={currentSessionId} />
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 bg-white p-4">
              <h3 className="text-muted">Select a chat or start a new one.</h3>
              <Button
                variant="primary"
                onClick={() => {
                  if (!createSessionMutation.isPending) {
                    createSessionMutation.mutate({ title: "New Chat" });
                  }
                }}
                disabled={createSessionMutation.isPending}
                className="mt-3 rounded-pill"
              >
                {createSessionMutation.isPending ? <Spinner animation="border" size="sm" /> : <i className="fas fa-plus me-2"></i>}
                Start New Chat
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}
