import { useState } from 'react';
import api from '../../../services/api';
import { API_BASE_URL } from '../../../constants';
import { Language } from '../../../i18n';
import { NotificationState, ConfirmDialogState } from '../types';

interface UsePaperSubmissionParams {
  myRegistrations: any[];
  loadMyRegistrations: () => Promise<void>;
  onSubmit: (compId: string, fileNameOrLabel: string) => void;
  setNotification: (n: NotificationState) => void;
  setConfirmDialog: (d: ConfirmDialogState) => void;
  startInvoiceFlow: (compId: string, registrationId: number) => void;
  lang: Language;
}

export function usePaperSubmission({
  myRegistrations,
  loadMyRegistrations,
  onSubmit,
  setNotification,
  setConfirmDialog,
  startInvoiceFlow,
  lang,
}: UsePaperSubmissionParams) {
  const [submittingPaper, setSubmittingPaper] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  /** 点击「提交」按钮，确认提交并进入支付流程 */
  const handleSubmitClick = (compId: string) => {
    const registration = myRegistrations.find(r => r.competitionId === compId);
    if (!registration?.id) return;

    // 检查是否已上传文件
    if (!registration.paperSubmission || !registration.paperSubmission.submissionFileUrl) {
      setNotification({
        show: true,
        title: lang === 'zh' ? '提示' : 'Notice',
        message: lang === 'zh' ? '请先上传论文文件' : 'Please upload paper file first',
        type: 'warning',
      });
      return;
    }

    // 检查是否是重新提交（REVISION_REQUIRED 状态）
    const isRevision = registration.status === 'REVISION_REQUIRED';
    
    // 弹窗确认
    setConfirmDialog({
      show: true,
      title: lang === 'zh' ? '确认提交' : 'Confirm Submission',
      message: isRevision 
        ? (lang === 'zh' 
          ? '确认重新提交吗？您已支付过评审费，此次提交无需再次支付。提交后将无法修改文件，如需修改请联系管理员。' 
          : 'Confirm resubmission? You have already paid the review fee, so no additional payment is required. Once submitted, files cannot be modified. Please contact the administrator if you need to make changes.')
        : (lang === 'zh' 
          ? '确认提交吗？提交后需支付评审费才能完成提交。提交后将无法修改文件，如需修改请联系管理员。' 
          : 'Confirm submission? You need to pay the review fee to complete the submission. Once submitted, files cannot be modified. Please contact the administrator if you need to make changes.'),
      confirmText: lang === 'zh' ? '确认提交' : 'Confirm',
      cancelText: lang === 'zh' ? '取消' : 'Cancel',
      onConfirm: () => handleSubmitConfirmed(compId),
    });
  };

  const handleSubmitConfirmed = async (compId: string) => {
    const registration = myRegistrations.find(r => r.competitionId === compId);
    if (!registration?.id) return;

    try {
      const response = await api.registration.confirmSubmission(registration.id);
      if (response.success) {
        await loadMyRegistrations();
        
        // 检查是否需要跳过支付流程（退回后重新提交的情况）
        if (response.data?.skipPayment) {
          setNotification({
            show: true,
            title: lang === 'zh' ? '提交成功' : 'Submitted Successfully',
            message: lang === 'zh' ? '论文已成功提交，无需重复支付评审费。' : 'Paper submitted successfully. No additional payment required.',
            type: 'success',
          });
          onSubmit(compId, registration.paperSubmission?.paperTitle || 'Paper');
        } else {
          // 首次提交，需要进入支付流程
          startInvoiceFlow(compId, registration.id);
        }
      } else {
        setNotification({
          show: true,
          title: lang === 'zh' ? '提交失败' : 'Submit Failed',
          message: response.message || (lang === 'zh' ? '提交失败，请重试' : 'Failed to submit, please try again'),
          type: 'error',
        });
      }
    } catch (error: any) {
      setNotification({
        show: true,
        title: lang === 'zh' ? '错误' : 'Error',
        message: error.message || (lang === 'zh' ? '提交失败，请重试' : 'Failed to submit, please try again'),
        type: 'error',
      });
    }
  };

  /** 选择文件后直接自动保存 */
  const handlePaperFilesSelected = async (compId: string, fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    await handleLocalSubmit(compId, files);
  };

  /** 上传待提交列表中的全部文件（追加到已保存的文件） */
  const handleLocalSubmit = async (compId: string, files: FileList | File[]) => {
    const fileList = Array.from(files?.length ? files : []);
    if (fileList.length === 0) return;

    setSubmittingPaper(true);
    try {
      const registration = myRegistrations.find(r => r.competitionId === compId);
      if (!registration || !registration.id) {
        alert(lang === 'zh' ? '找不到报名记录' : 'Registration not found');
        return;
      }

      const uploaded: Array<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }> = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const progressKey = `${compId}-${i}`;
        
        // 上传文件，并监听进度
        const uploadResult = await api.upload.uploadFile(file, (percent) => {
          setUploadProgress(prev => ({ ...prev, [progressKey]: percent }));
        });
        
        if (!uploadResult.success || !uploadResult.data) {
          // 清除进度
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[progressKey];
            return newProgress;
          });
          alert(uploadResult.message || (lang === 'zh' ? '文件上传失败' : 'File upload failed'));
          return;
        }
        const { url: fileUrl, originalname, size, mimetype } = uploadResult.data;
        uploaded.push({ fileName: originalname, fileUrl, size, mimetype });
        
        // 上传完成，清除进度
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
      }

      const existingFiles = registration.paperSubmission?.submissionFiles || [];
      const allFiles = [...existingFiles, ...uploaded];

      const first = allFiles[0];
      const paperData = {
        registrationId: registration.id as number,
        paperTitle: allFiles.length === 1 ? first.fileName : (lang === 'zh' ? `论文（${allFiles.length} 个文件）` : `Paper (${allFiles.length} files)`),
        submissionFiles: allFiles,
      };

      const submitResult = await api.paper.submit(paperData as Parameters<typeof api.paper.submit>[0]);
      if (!submitResult.success) {
        alert(submitResult.message || (lang === 'zh' ? '论文提交失败' : 'Paper submission failed'));
        return;
      }

      await loadMyRegistrations();
      onSubmit(compId, allFiles.length === 1 ? first.fileName : `${allFiles.length} files`);
    } catch (error: any) {
      console.error('Paper submission error:', error);
      setNotification({
        show: true,
        title: lang === 'zh' ? '保存失败' : 'Save Failed',
        message: lang === 'zh' ? '文件保存失败，请重试' : 'File save failed, please try again',
        type: 'error',
      });
    } finally {
      setSubmittingPaper(false);
    }
  };

  /** 删除已保存的文件 */
  const handleDeleteSavedFile = (compId: string, fileIndex: number, fileName: string) => {
    setConfirmDialog({
      show: true,
      title: lang === 'zh' ? '确认删除' : 'Confirm Delete',
      message: lang === 'zh' ? `确定要删除文件「${fileName}」吗？` : `Delete file "${fileName}"?`,
      confirmText: lang === 'zh' ? '删除' : 'Delete',
      cancelText: lang === 'zh' ? '取消' : 'Cancel',
      onConfirm: () => handleDeleteFileConfirmed(compId, fileIndex),
    });
  };

  const handleDeleteFileConfirmed = async (compId: string, fileIndex: number) => {
    setSubmittingPaper(true);
    try {
      const registration = myRegistrations.find(r => r.competitionId === compId);
      if (!registration || !registration.id || !registration.paperSubmission) {
        setNotification({
          show: true,
          title: lang === 'zh' ? '错误' : 'Error',
          message: lang === 'zh' ? '找不到报名记录' : 'Registration not found',
          type: 'error',
        });
        return;
      }

      const existingFiles = registration.paperSubmission.submissionFiles || [];
      const updatedFiles = existingFiles.filter((_: any, index: number) => index !== fileIndex);

      if (updatedFiles.length === 0) {
        setNotification({
          show: true,
          title: lang === 'zh' ? '提示' : 'Notice',
          message: lang === 'zh' ? '至少需要保留一个文件' : 'At least one file is required',
          type: 'warning',
        });
        return;
      }

      const first = updatedFiles[0];
      const paperData = {
        registrationId: registration.id as number,
        paperTitle: updatedFiles.length === 1 ? first.fileName : (lang === 'zh' ? `论文（${updatedFiles.length} 个文件）` : `Paper (${updatedFiles.length} files)`),
        submissionFiles: updatedFiles,
      };

      const submitResult = await api.paper.submit(paperData as Parameters<typeof api.paper.submit>[0]);
      if (!submitResult.success) {
        setNotification({
          show: true,
          title: lang === 'zh' ? '删除失败' : 'Delete Failed',
          message: submitResult.message || (lang === 'zh' ? '删除失败' : 'Delete failed'),
          type: 'error',
        });
        return;
      }

      await loadMyRegistrations();
      setNotification({
        show: true,
        title: lang === 'zh' ? '删除成功' : 'Deleted',
        message: lang === 'zh' ? '文件已删除' : 'File deleted successfully',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Delete file error:', error);
      setNotification({
        show: true,
        title: lang === 'zh' ? '删除失败' : 'Delete Failed',
        message: lang === 'zh' ? '删除失败，请重试' : 'Delete failed, please try again',
        type: 'error',
      });
    } finally {
      setSubmittingPaper(false);
    }
  };

  /** 查看论文 */
  const handleViewPaper = (fileUrl: string) => {
    if (fileUrl) {
      const baseUrl = API_BASE_URL.replace(/\/api\/v1$/, '');
      const fullUrl = fileUrl.startsWith('http')
        ? fileUrl
        : `${baseUrl}${fileUrl}`;
      window.open(fullUrl, '_blank');
    }
  };

  return {
    submittingPaper,
    uploadProgress,
    handlePaperFilesSelected,
    handleSubmitClick,
    handleDeleteSavedFile,
    handleViewPaper,
  };
}
