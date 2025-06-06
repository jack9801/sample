// components/LoginCard.tsx
"use client"; // This component is interactive, so it MUST be a client component.

import React from 'react';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';

const LoginCard: React.FC = () => {
  return (
    <Container fluid className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <Row>
        <Col className="text-center">
          <Card className="p-4 shadow-lg rounded-4 border-0" style={{ maxWidth: '400px' }}>
            <Card.Body>
              <h1 className="mb-4 text-primary">Welcome to Chat Clone</h1>
              <p className="lead mb-4">
                Login to start chatting with AI or generate stunning images!
              </p>
              {/* This Button is a react-bootstrap component and is correctly within a 'use client' boundary. */}
              <Button href="/api/auth/login" variant="primary" size="lg" className="rounded-pill px-4 py-2">
                Login
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginCard;
