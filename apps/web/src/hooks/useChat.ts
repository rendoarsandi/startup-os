import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const mutation = useMutation({
    mutationFn: async (text: string) => {
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
      return data.response;
    },
    onMutate: (text) => {
      const userMessage: Message = { role: 'user', parts: [{ text }] };
      setMessages(prev => [...prev, userMessage]);
    },
    onSuccess: (responseText) => {
      const modelMessage: Message = { role: 'model', parts: [{ text: responseText }] };
      setMessages(prev => [...prev, modelMessage]);
    },
  });

  const sendMessage = (text: string) => {
    mutation.mutate(text);
  };

  return {
    messages,
    sendMessage,
    isLoading: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
};
