import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const useChat = (activeRole: 'cfo' | 'marketer' | 'hr') => {
  const [messagesMap, setMessagesMap] = useState<Record<'cfo' | 'marketer' | 'hr', Message[]>>({
    cfo: [],
    marketer: [],
    hr: []
  });

  const currentMessages = messagesMap[activeRole] || [];

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: currentMessages,
          role: activeRole
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      return data.response;
    },
    onMutate: (text) => {
      const userMessage: Message = { role: 'user', parts: [{ text }] };
      setMessagesMap(prev => ({
        ...prev,
        [activeRole]: [...(prev[activeRole] || []), userMessage]
      }));
    },
    onSuccess: (responseText) => {
      const modelMessage: Message = { role: 'model', parts: [{ text: responseText }] };
      setMessagesMap(prev => ({
        ...prev,
        [activeRole]: [...(prev[activeRole] || []), modelMessage]
      }));
    },
  });

  const sendMessage = (text: string) => {
    mutation.mutate(text);
  };

  const clearChat = () => {
    setMessagesMap(prev => ({
      ...prev,
      [activeRole]: []
    }));
  };

  return {
    messages: currentMessages,
    sendMessage,
    clearChat,
    isLoading: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
};

