import { NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: '没有找到音频文件' },
        { status: 400 }
      );
    }

    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('音频文件信息：');
    console.log('文件大小：', buffer.length, 'bytes');
    console.log('文件类型：', audioFile.type);
    
    // 解析 WAV 头部信息
    const sampleRate = buffer.readUInt32LE(24);
    const audioData = buffer.slice(44); // 跳过 44 字节的 WAV 头

    // 将音频数据转换为 Float32Array
    const float32Samples = new Float32Array(audioData.length / 2);
    for (let i = 0; i < float32Samples.length; i++) {
      float32Samples[i] = audioData.readInt16LE(i * 2) / 32768.0;
    }
    
    console.log('音频数据信息：');
    console.log('采样率：', sampleRate);
    console.log('采样数量：', float32Samples.length);
    console.log('前10个采样值：', Array.from(float32Samples.slice(0, 10)));

    // 发送到 ASR 服务
    const asrFormData = new FormData();
    asrFormData.append('audio', new Blob([buffer], { type: 'audio/wav' }), 'audio.wav');

    const text = await fetch('http://localhost:3002/asr', {
      method: 'POST',
      body: asrFormData,
      // 添加超时设置
      signal: AbortSignal.timeout(10000), // 10秒超时
      // 禁用自动压缩
      headers: {
        'Accept-Encoding': 'identity'
      }
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data.success) {
        throw new Error(data.error || '语音识别失败');
      }
      return data.text;
    });
    
    return NextResponse.json({ text });
  } catch (error) {
    console.error('语音转文字失败:', error);
    return NextResponse.json(
      { error: '语音转文字失败' },
      { status: 500 }
    );
  }
} 
