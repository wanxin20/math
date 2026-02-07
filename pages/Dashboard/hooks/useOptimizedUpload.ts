import { useState } from 'react';
import api from '../../../services/api';

interface UploadProgress {
  [key: string]: number;
}

interface UploadTask {
  file: File;
  key: string;
  registrationId: number;
}

/**
 * 优化的文件上传 Hook
 * 支持多文件并行上传，提升上传速度
 */
export function useOptimizedUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);

  /**
   * 并行上传多个文件
   * @param files 要上传的文件列表
   * @param maxConcurrency 最大并发数（默认3）
   */
  const uploadFiles = async (
    files: File[],
    maxConcurrency: number = 3
  ): Promise<Array<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }>> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    const results: Array<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }> = [];
    const errors: string[] = [];

    try {
      // 创建上传任务队列
      const tasks = files.map((file, index) => ({
        file,
        index,
        key: `file-${index}-${Date.now()}`,
      }));

      // 并发控制上传
      const uploading: Promise<void>[] = [];
      let taskIndex = 0;

      while (taskIndex < tasks.length || uploading.length > 0) {
        // 启动新任务（如果还有任务且未达到并发上限）
        while (taskIndex < tasks.length && uploading.length < maxConcurrency) {
          const task = tasks[taskIndex];
          taskIndex++;

          const uploadPromise = (async () => {
            try {
              const result = await api.upload.uploadFile(task.file, (percent) => {
                setUploadProgress(prev => ({ ...prev, [task.key]: percent }));
              });

              if (!result.success || !result.data) {
                throw new Error(result.message || '文件上传失败');
              }

              const { url: fileUrl, originalname, size, mimetype } = result.data;
              results.push({ fileName: originalname, fileUrl, size, mimetype });

              // 上传完成，清除进度
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[task.key];
                return newProgress;
              });
            } catch (error: any) {
              console.error(`文件 ${task.file.name} 上传失败:`, error);
              errors.push(`${task.file.name}: ${error.message}`);
              
              // 清除进度
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[task.key];
                return newProgress;
              });
            }
          })();

          uploading.push(uploadPromise);
        }

        // 等待任何一个任务完成
        if (uploading.length > 0) {
          await Promise.race(uploading);
          // 移除已完成的任务
          for (let i = uploading.length - 1; i >= 0; i--) {
            const settled = await Promise.race([
              uploading[i].then(() => true),
              Promise.resolve(false),
            ]);
            if (settled) {
              uploading.splice(i, 1);
            }
          }
        }
      }

      // 如果有错误，抛出异常
      if (errors.length > 0) {
        throw new Error(`部分文件上传失败:\n${errors.join('\n')}`);
      }

      return results;
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  /**
   * 上传单个文件
   */
  const uploadSingleFile = async (
    file: File,
    progressKey: string
  ): Promise<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }> => {
    try {
      setIsUploading(true);

      const result = await api.upload.uploadFile(file, (percent) => {
        setUploadProgress(prev => ({ ...prev, [progressKey]: percent }));
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || '文件上传失败');
      }

      const { url: fileUrl, originalname, size, mimetype } = result.data;

      // 清除进度
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[progressKey];
        return newProgress;
      });

      return { fileName: originalname, fileUrl, size, mimetype };
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 取消所有上传
   */
  const cancelAllUploads = () => {
    setUploadProgress({});
    setIsUploading(false);
  };

  return {
    uploadFiles,
    uploadSingleFile,
    uploadProgress,
    isUploading,
    cancelAllUploads,
  };
}
