import { useState, useEffect } from 'react';

export interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    const userMessage: Message = { role: 'user', parts: [{ text }] };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      const modelMessage: Message = { role: 'model', parts: [{ text: data.response }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading, error };
};
