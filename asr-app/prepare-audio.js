const fs = require('fs');
const wav = require('wav');

// 读取 WAV 文件
const reader = new wav.Reader();
const file = fs.createReadStream('zh.wav');

file.pipe(reader);

reader.on('format', function (format) {
    const buffers = [];
    
    reader.on('data', function (chunk) {
        buffers.push(chunk);
    });
    
    reader.on('end', function () {
        const buffer = Buffer.concat(buffers);
        // 将 buffer 转换为 Float32Array
        const samples = new Float32Array(buffer.length / 2);
        for (let i = 0; i < samples.length; i++) {
            samples[i] = buffer.readInt16LE(i * 2) / 32768.0;
        }
        
        // 创建 JSON 对象，保持 samples 为 Float32Array
        const data = {
            sampleRate: format.sampleRate,
            samples: Object.values(samples)  // 保持数字数组的形式
        };
        
        // 写入 JSON 文件
        fs.writeFileSync('audio.json', JSON.stringify(data));
        const stats = fs.statSync('audio.json');
        console.log(`音频数据已保存到 audio.json，文件大小: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    });
}); 