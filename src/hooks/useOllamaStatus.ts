import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useOllamaStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const check = async () => {
    try {
      const ok = await invoke<boolean>('ollama_health_check');
      setIsConnected(ok);
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, recheck: check };
}
