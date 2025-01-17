import { useState, useCallback, useEffect } from 'react';
import type { Attachment } from 'ai';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = useCallback(() => {
    console.log('Starting recording...');
    setIsRecording(true);
  }, []);

  const handleStopRecording = useCallback(() => {
    console.log('Stopping recording...');
    setIsRecording(false);
  }, []);



  useEffect(() => {
    console.log('Recording state changed:', { isRecording });
    
    // 可以在这里添加更多的状态监控逻辑
    if (isRecording) {
      console.log('Recording started at:', new Date().toISOString());
    } else {
      console.log('Recording stopped at:', new Date().toISOString());
    }

    // 清理函数
    return () => {
      if (isRecording) {
        console.log('Recording cleanup triggered at:', new Date().toISOString());
      }
    };
  }, [isRecording]);

  return {
    isRecording,
    handleStartRecording,
    handleStopRecording,
  };
} 