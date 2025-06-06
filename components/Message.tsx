// components/Message.tsx
"use client";

import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

interface MessageProps {
  content: string;
  role: 'user' | 'model';
  type: 'text' | 'image' | 'image_prompt';
}

const Message: React.FC<MessageProps> = ({ content, role, type }) => {
  const isUser = role === 'user';
  const cardBg = isUser ? 'primary' : 'light';
  const textColor = isUser ? 'white' : 'dark';
  const justifyContent = isUser ? 'justify-content-end' : 'justify-content-start';

  return (
    <Row className={`mb-3 ${justifyContent}`}>
      <Col xs={10} sm={9} md={7} lg={6}>
        <Card className={`shadow-sm rounded-3 border-0 bg-${cardBg} text-${textColor}`}>
          <Card.Body className="p-3">
            {type === 'text' || type === 'image_prompt' ? (
              <p className="mb-0">{content}</p>
            ) : type === 'image' ? (
              <img
                src={content}
                alt="Generated"
                className="img-fluid rounded-3 generated-image border-2 border-gray-400"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  minHeight: '150px', // Keep a reasonable min-height for visibility
                  maxHeight: '400px',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/400x200/ff0000/ffffff?text=Image+Load+Error";
                  e.currentTarget.alt = "Image failed to load";
                }}
              />
            ) : null}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Message;
