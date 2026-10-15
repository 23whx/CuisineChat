/**
 * 文件传输相关工具函数
 */

const CHUNK_SIZE = 16 * 1024; // 16KB per chunk

/**
 * 将文件转换为 base64
 */
export const fileToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // 去掉 data:xxx;base64, 前缀
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 将 base64 转换为 Blob
 */
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const binary = atob(base64);
  // 直接写入 Uint8Array，避免先创建同样长度的普通数组（大文件时内存翻倍且很慢）
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

/**
 * 下载文件
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 立即 revoke 在部分浏览器（Safari/Firefox）会导致下载失败
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 验证文件类型
 */
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

/**
 * 分片文件（用于大文件传输）
 */
export const splitFileIntoChunks = (base64: string): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};

/**
 * 合并文件分片
 */
export const mergeChunks = (chunks: string[]): string => {
  return chunks.join('');
};

