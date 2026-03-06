/**
 * 浏览器指纹生成工具
 * 用于生成包含设备信息的唯一指纹
 */

/**
 * 生成Canvas指纹
 * @returns Canvas指纹字符串
 */
export function generateCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return 'canvas_not_supported';
    }
    
    // 设置Canvas尺寸
    canvas.width = 200;
    canvas.height = 50;
    
    // 绘制文本和图形来生成唯一指纹
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    
    ctx.fillStyle = '#069';
    ctx.fillText('AI-Chat Fingerprint 🚀', 2, 15);
    
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas fingerprint', 4, 35);
    
    // 添加一些几何图形
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.beginPath();
    ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
    // 转换为base64并生成hash
    const dataURL = canvas.toDataURL();
    
    // 简单的hash函数
    let hash = 0;
    for (let i = 0; i < dataURL.length; i++) {
      const char = dataURL.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(16);
  } catch (error) {
    console.warn('Canvas fingerprint generation failed:', error);
    return 'canvas_error_' + Date.now();
  }
}

/**
 * 生成完整的浏览器指纹信息
 * @returns 指纹对象
 */
export function generateFingerprint() {
  return {
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    color_depth: window.screen.colorDepth.toString(),
    platform: navigator.platform,
    canvas_fingerprint: generateCanvasFingerprint()
  };
}

/**
 * 从当前URL中提取channel_code参数
 * @returns channel_code值或null
 */
export function getChannelCodeFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('channel_code');
}

/**
 * 生成X-Fingerprint请求头的值（JSON字符串）
 * @returns JSON格式的指纹字符串
 */
export function generateFingerprintHeader(): string {
  const fingerprint = generateFingerprint();
  return JSON.stringify(fingerprint);
}