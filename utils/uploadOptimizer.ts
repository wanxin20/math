/**
 * 文件上传优化工具
 * 支持分片上传、断点续传、并行上传
 */

export interface UploadOptions {
  file: File;
  onProgress?: (percent: number) => void;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  chunkSize?: number; // 分片大小，默认5MB
  concurrency?: number; // 并发数，默认3
}

export interface ChunkUploadResult {
  chunkIndex: number;
  success: boolean;
  error?: Error;
}

/**
 * 计算文件的MD5哈希（用于秒传和断点续传）
 */
export async function calculateFileMD5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks for hash calculation
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new (window as any).SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      spark.append(e.target?.result);
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };

    fileReader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
}

/**
 * 判断文件是否需要分片上传
 * 小于10MB的文件直接上传，大于10MB的使用分片上传
 */
export function shouldUseChunkedUpload(file: File): boolean {
  const threshold = 10 * 1024 * 1024; // 10MB
  return file.size > threshold;
}

/**
 * 将文件分割成多个块
 */
export function splitFileIntoChunks(file: File, chunkSize: number = 5 * 1024 * 1024): Blob[] {
  const chunks: Blob[] = [];
  let start = 0;

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }

  return chunks;
}

/**
 * 上传单个分片
 */
export async function uploadChunk(
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  fileName: string,
  fileHash: string,
  apiBaseUrl: string,
  token: string | null
): Promise<any> {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('fileName', fileName);
  formData.append('fileHash', fileHash);

  const response = await fetch(`${apiBaseUrl}/upload/chunk`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '上传失败' }));
    throw new Error(error.message || '分片上传失败');
  }

  return response.json();
}

/**
 * 合并所有分片
 */
export async function mergeChunks(
  fileName: string,
  fileHash: string,
  totalChunks: number,
  apiBaseUrl: string,
  token: string | null
): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/upload/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      fileName,
      fileHash,
      totalChunks,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '合并失败' }));
    throw new Error(error.message || '文件合并失败');
  }

  return response.json();
}

/**
 * 分片上传（带并发控制）
 */
export async function uploadFileWithChunks(
  file: File,
  apiBaseUrl: string,
  token: string | null,
  onProgress?: (percent: number) => void,
  chunkSize: number = 5 * 1024 * 1024,
  concurrency: number = 3
): Promise<any> {
  try {
    // 1. 计算文件哈希（用于秒传和断点续传）
    const fileHash = `${file.name}-${file.size}-${file.lastModified}`; // 简化版，生产环境建议使用真实MD5
    
    // 2. 分割文件
    const chunks = splitFileIntoChunks(file, chunkSize);
    const totalChunks = chunks.length;

    // 3. 并发上传分片
    let uploadedChunks = 0;
    const failedChunks: number[] = [];

    // 创建上传任务队列
    const uploadTasks: Array<() => Promise<void>> = chunks.map((chunk, index) => {
      return async () => {
        try {
          await uploadChunk(chunk, index, totalChunks, file.name, fileHash, apiBaseUrl, token);
          uploadedChunks++;
          
          // 更新进度（0-90%为上传进度，90-100%为合并进度）
          if (onProgress) {
            const percent = Math.floor((uploadedChunks / totalChunks) * 90);
            onProgress(percent);
          }
        } catch (error) {
          console.error(`分片 ${index} 上传失败:`, error);
          failedChunks.push(index);
          throw error;
        }
      };
    });

    // 并发控制执行
    await executeWithConcurrency(uploadTasks, concurrency);

    // 检查是否有失败的分片
    if (failedChunks.length > 0) {
      throw new Error(`部分分片上传失败: ${failedChunks.join(', ')}`);
    }

    // 4. 合并分片
    if (onProgress) {
      onProgress(95);
    }

    const result = await mergeChunks(file.name, fileHash, totalChunks, apiBaseUrl, token);

    if (onProgress) {
      onProgress(100);
    }

    return result;
  } catch (error) {
    console.error('分片上传失败:', error);
    throw error;
  }
}

/**
 * 并发控制执行任务
 */
export async function executeWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = task().then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => (p as any).isResolved),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * 批量并行上传多个文件
 */
export async function uploadMultipleFiles(
  files: File[],
  apiBaseUrl: string,
  token: string | null,
  onProgress?: (fileIndex: number, percent: number) => void,
  concurrency: number = 2
): Promise<any[]> {
  const results: any[] = [];

  // 创建上传任务
  const uploadTasks = files.map((file, index) => {
    return async () => {
      try {
        const result = shouldUseChunkedUpload(file)
          ? await uploadFileWithChunks(
              file,
              apiBaseUrl,
              token,
              (percent) => onProgress?.(index, percent),
              5 * 1024 * 1024,
              2 // 单个文件内部的并发数
            )
          : await uploadSmallFile(
              file,
              apiBaseUrl,
              token,
              (percent) => onProgress?.(index, percent)
            );
        
        results.push(result);
        return result;
      } catch (error) {
        console.error(`文件 ${file.name} 上传失败:`, error);
        throw error;
      }
    };
  });

  // 并发上传文件
  await executeWithConcurrency(uploadTasks, concurrency);

  return results;
}

/**
 * 上传小文件（<10MB）
 */
export async function uploadSmallFile(
  file: File,
  apiBaseUrl: string,
  token: string | null,
  onProgress?: (percent: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            data: data.data || data,
          });
        } else {
          reject(new Error(data.message || '上传失败'));
        }
      } catch (error: any) {
        reject(new Error(error.message || '文件上传失败'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误，上传失败'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('上传已取消'));
    });

    xhr.open('POST', `${apiBaseUrl}/upload/file`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}
