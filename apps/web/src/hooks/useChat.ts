import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const useChat = (activeRole: 'cfo' | 'marketer' | 'hr' | 'operations') => {
  const [messagesMap, setMessagesMap] = useState<Record<'cfo' | 'marketer' | 'hr' | 'operations', Message[]>>({
    cfo: [],
    marketer: [],
    hr: [],
    operations: []
  });

  const currentMessages = messagesMap[activeRole] || [];

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      // Read active scenario from localStorage to inject into AI context
      let activeScenario = null;
      try {
        const isActive = localStorage.getItem('ai_cfo_scenario_active') === 'true';
        if (isActive && activeRole === 'cfo') {
          const stored = localStorage.getItem('ai_cfo_scenario_inputs');
          if (stored) {
            activeScenario = JSON.parse(stored);
          }
        }
      } catch (e) {
        console.warn("Failed to read scenario from localStorage", e);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: currentMessages,
          role: activeRole,
          activeScenario
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

