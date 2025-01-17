'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { X as XIcon, Check as CheckIcon, Mic as MicIcon } from 'lucide-react';
import type { Attachment, CreateMessage, Message } from 'ai';

interface AudioRecorderProps {
  onStartRecording: () => void;
  onStopRecording: (attachment: AudioAttachment) => void;
  append?: (message: Message | CreateMessage) => Promise<string | null | undefined>;
  setInput?: (input: string) => void;
  handleSubmit?: (event?: { preventDefault?: () => void }) => void;
}

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  isListening: boolean;
}

interface AudioAttachment extends Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
  text?: string;
}

function AudioVisualizer({
  audioContext,
  analyser,
  isListening,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current || !analyser || !isListening) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isListening || !analyser || !ctx) return;

      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(248, 248, 248)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#34d399');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isListening]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-8">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded"
        style={{ background: 'rgb(248, 248, 248)' }}
      />
      <div className="absolute top-1/2 -translate-y-1/2 right-2 text-xs font-mono text-muted-foreground">
        {formatTime(recordingTime)}
      </div>
    </div>
  );
}

export function AudioRecorder({ 
  onStartRecording, 
  onStopRecording,
  append,
  setInput,
  handleSubmit 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout>();
  const MAX_DURATION = 40;
  const hasInitialized = useRef(false);

  const cleanupResources = useCallback(async () => {
    // 1. 停止并清理所有音轨
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      streamRef.current = null;
    }

    // 2. 停止 MediaRecorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // 3. 断开并清理 AudioContext 相关资源
    if (analyser) {
      analyser.disconnect();
      setAnalyser(null);
    }

    if (audioContext) {
      try {
        if (audioContext.state !== 'closed') {
          await audioContext.close();
        }
        setAudioContext(null);
      } catch (e) {
        console.error('Error closing audio context:', e);
      }
    }

    // 4. 清除定时器
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = undefined;
    }

    // 5. 重置状态
    setIsRecording(false);
    setAudioChunks([]);
  }, [analyser, audioContext]);

  const startRecording = useCallback(async () => {
    try {
      if (isRecording || mediaRecorderRef.current || streamRef.current) {
        console.log('Recording already in progress, skipping start');
        return;
      }

      await cleanupResources();
      onStartRecording();
      
      // 获取音频流
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // 单声道
          sampleRate: 16000 // 指定采样率
        } 
      });
      
      streamRef.current = stream;
      
      // 创建 AudioContext 和分析器
      const context = new AudioContext({ sampleRate: 16000 });
      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();
      
      analyserNode.fftSize = 128;
      analyserNode.minDecibels = -90;
      analyserNode.maxDecibels = -10;
      analyserNode.smoothingTimeConstant = 0.85;
      
      source.connect(analyserNode);
      
      setAudioContext(context);
      setAnalyser(analyserNode);

      // 配置 MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000
      });
      
      mediaRecorderRef.current = recorder;
      setAudioChunks([]);
      
      recorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) {
          setAudioChunks(chunks => [...chunks, e.data]);
        }
      });

      recorder.start(100);
      setIsRecording(true);

      // 设置最大录制时长
      maxDurationTimerRef.current = setTimeout(() => {
        stopRecording(true);
      }, MAX_DURATION * 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      cleanupResources();
    }
  }, [isRecording, cleanupResources]);

  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // 创建单声道 16kHz 的 WAV
    const wavBuffer = audioContext.createBuffer(
      1, // 单声道
      audioBuffer.length,
      16000 // 固定采样率
    );
    
    // 复制并重采样音频数据
    wavBuffer.copyToChannel(audioBuffer.getChannelData(0), 0);
    
    // 转换为 WAV
    const offlineContext = new OfflineAudioContext(1, wavBuffer.length, 16000);
    const source = offlineContext.createBufferSource();
    source.buffer = wavBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    
    // 创建 WAV 文件
    return await new Promise<Blob>((resolve) => {
      const length = renderedBuffer.length * 2;
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);
      
      // WAV 头部信息
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // 单声道
      view.setUint32(24, 16000, true); // 采样率
      view.setUint32(28, 16000 * 2, true); // 字节率
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, length, true);

      // 写入音频数据
      const samples = renderedBuffer.getChannelData(0);
      let offset = 44;
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
      
      resolve(new Blob([buffer], { type: 'audio/wav' }));
    });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const stopRecording = useCallback(async (shouldSave: boolean = false) => {
    console.log('开始停止录音...');
    console.log('当前录音状态:', isRecording);
    console.log('MediaRecorder 状态:', mediaRecorderRef.current?.state);
    console.log('音轨状态:', streamRef.current?.getTracks().map(t => t.readyState));

    try {
      if (!isRecording) {
        console.log('Not recording, early return');
        return;
      }

      // 确保先停止 MediaRecorder
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }

      // 立即停止所有音轨
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        streamRef.current = null;
      }

      // 其他清理操作
      await cleanupResources();

      // 处理保存逻辑
      if (shouldSave && audioChunks.length > 0) {
        console.log('开始处理音频数据...');
        const webmBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('WebM blob 大小:', webmBlob.size);
        
        const wavBlob = await convertWebmToWav(webmBlob);
        console.log('WAV blob 大小:', wavBlob.size);
        
        const url = URL.createObjectURL(wavBlob);
        
        const tempAudio: AudioAttachment = {
          name: `recording_${Date.now()}.wav`,
          type: 'audio/wav',
          size: wavBlob.size,
          url: url
        };

        try {
          console.log('开始语音转文字...');
          // 创建 FormData 对象
          const formData = new FormData();
          formData.append('audio', wavBlob, 'audio.wav');

          // 发送到后端 API
          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('语音转文字请求失败');
          }

          const data = await response.json();
          console.log('转换后的数据:', data);
          
          if (data.text && setInput && handleSubmit) {
            const recognizedText = data.text.text;
            console.log('设置识别文本:', recognizedText);
            setInput(recognizedText);
            
            // 使用 Promise.resolve().then() 确保在下一个微任务中执行提交
            // 这样可以确保 setInput 已经完成更新
            Promise.resolve().then(() => {
              console.log('执行提交');
              handleSubmit({ preventDefault: () => {} });
            });
          }
          
          onStopRecording({ ...tempAudio, text: data.text?.text });
        } catch (error) {
          console.error('语音转文字失败:', error);
          toast.error('语音转文字失败');
          onStopRecording(tempAudio);
        }
      } else {
        onStopRecording({ name: '', type: '', size: 0, url: '' });
      }

      console.log('录音已停止');
    } catch (error) {
      console.error('停止录音时出错:', error);
      toast.error('停止录音时出错');
    }
  }, [isRecording, audioChunks, cleanupResources, onStopRecording, setInput, handleSubmit]);

  // 1. 检查组件初始化时的 useEffect
  useEffect(() => {
    if (hasInitialized.current) {
      console.log('Already initialized, skipping');
      return;
    }

    hasInitialized.current = true;
    let mounted = true;

    const initRecording = async () => {
      if (mounted) {
        await startRecording();
      }
    };

    initRecording();

    return () => {
      mounted = false;
      cleanupResources();
    };
  }, []);

  // 3. 添加调试日志来追踪组件的生命周期
  useEffect(() => {
    console.log('Component mounted');
    return () => {
      console.log('Component unmounting');
    };
  }, []);

  return (
    <div className="w-full min-h-[98px] bg-background border border-input rounded-2xl flex items-center justify-between px-4 shadow-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          stopRecording(false);
        }}
        className="size-8 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        <XIcon className="size-4" />
      </Button>

      <div className="flex-1 mx-4">
        <AudioVisualizer
          audioContext={audioContext}
          analyser={analyser}
          isListening={isRecording}
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          stopRecording(true);
        }}
        className="size-8 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        <CheckIcon className="size-4" />
      </Button>
    </div>
  );
}