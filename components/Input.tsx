// components/Input.tsx
"use client";

import React, { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';

interface InputProps {
  onSendMessage: (prompt: string) => void;
  onGenerateImage: (prompt: string) => void;
  isLoading: boolean;
}

const Input: React.FC<InputProps> = ({ onSendMessage, onGenerateImage, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called. Prompt:', prompt, 'Is loading:', isLoading); // ADD THIS LOG
    if (prompt.trim() && !isLoading) {
      onSendMessage(prompt);
      setPrompt('');
    }
  };

  const handleImageGeneration = () => {
    console.log('handleImageGeneration called. Prompt:', prompt, 'Is loading:', isLoading); // ADD THIS LOG
    if (prompt.trim() && !isLoading) {
      onGenerateImage(prompt);
      setPrompt('');
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="w-100">
      <InputGroup className="mb-3">
        <Form.Control
          as="textarea"
          rows={1}
          placeholder="Type your message or image prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="rounded-pill pe-5"
          style={{ resize: 'none', minHeight: '38px', maxHeight: '100px', overflowY: 'auto' }}
        />
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          className="rounded-pill position-absolute end-0 me-1"
          style={{ zIndex: 1, top: '50%', transform: 'translateY(-50%)' }}
        >
          {isLoading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send-fill" viewBox="0 0 16 16">
              <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.417.405 1.545 1.545c.08.08.174.124.265.138a.5.5 0 0 0 .164-.047l.79-.196-1.554 1.554a.5.5 0 0 0-.003.71l.417.417c.189.189.46.223.71.003L15.964.686ZM.855 5.855L14.49 1.3L9.123 4.298z"/>
            </svg>
          )}
        </Button>
      </InputGroup>
      <div className="d-grid gap-2 mb-3">
        <Button
          variant="secondary"
          onClick={handleImageGeneration}
          disabled={!prompt.trim() || isLoading}
          className="rounded-pill"
        >
          {isLoading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <>Generate Image </>
          )}
        </Button>
      </div>
    </Form>
  );
};

export default Input;
