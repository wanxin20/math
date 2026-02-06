import React from 'react';
import { RegistrationStatus } from '../../../types';
import { Language } from '../../../i18n';

interface RegistrationCardProps {
  reg: any;
  lang: Language;
  submittingPaper: boolean;
  getStatusText: (status: RegistrationStatus) => string;
  onPaperFilesSelected: (compId: string, fileList: FileList | null) => void;
  onSubmitClick: (compId: string) => void;
  onPayClick: (compId: string) => void;
  onDeleteSavedFile: (compId: string, fileIndex: number, fileName: string) => void;
  onViewPaper: (fileUrl: string) => void;
}

const RegistrationCard: React.FC<RegistrationCardProps> = ({
  reg,
  lang,
  submittingPaper,
  getStatusText,
  onPaperFilesSelected,
  onSubmitClick,
  onPayClick,
  onDeleteSavedFile,
  onViewPaper,
}) => {
  const deadline = reg.competition?.deadline;
  const isPastDeadline = deadline ? new Date(deadline) < new Date() : false;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
      {/* 标题和状态 */}
      <div className="flex justify-between items-start md:items-center mb-6 gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1">
            {reg.competition?.title || (lang === 'zh' ? '竞赛' : 'Competition')}
          </h3>
          {deadline && (
            <div className="flex items-center gap-2 text-xs">
              <i className="fas fa-clock text-gray-400"></i>
              <span className="text-gray-500">
                {lang === 'zh' ? '截止时间：' : 'Deadline: '}
                <span className={isPastDeadline ? 'text-red-500 font-semibold' : 'text-gray-700'}>
                  {new Date(deadline).toLocaleDateString('zh-CN')}
                </span>
                {isPastDeadline && (
                  <span className="ml-2 text-red-500 font-semibold">
                    ({lang === 'zh' ? '已截止' : 'Closed'})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 whitespace-nowrap">
          {getStatusText(reg.status)}
        </span>
      </div>

      {/* 进度步骤 */}
      <div className="flex justify-between gap-2 mb-8">
        <div className="text-center flex-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-1">
            <i className="fas fa-check text-[10px]"></i>
          </div>
          <div className="text-[10px]">{lang === 'zh' ? '报名' : 'Register'}</div>
        </div>
        <div className="text-center flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${reg.status !== RegistrationStatus.PENDING_SUBMISSION ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            <i className="fas fa-upload text-[10px]"></i>
          </div>
          <div className="text-[10px]">{lang === 'zh' ? '上传' : 'Upload'}</div>
        </div>
        <div className="text-center flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${reg.status === RegistrationStatus.SUBMITTED ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            <i className="fas fa-check text-[10px]"></i>
          </div>
          <div className="text-[10px]">{lang === 'zh' ? '完成' : 'Complete'}</div>
        </div>
      </div>

      {/* 操作区域 */}
      <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
        {/* 状态1：待提交（PENDING_SUBMISSION） */}
        {reg.status === RegistrationStatus.PENDING_SUBMISSION && (
          isPastDeadline ? (
            <div className="text-gray-400 px-6 py-2 text-sm text-center w-full border border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed">
              <i className="fas fa-lock mr-2"></i>
              {lang === 'zh' ? '报名已截止' : 'Registration Closed'}
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {reg.paperSubmission && reg.paperSubmission.submissionFileUrl ? (
                <>
                  {/* 已保存的文件区域 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-800 font-semibold">
                        <i className="fas fa-check-circle text-green-600 mr-2"></i>
                        {lang === 'zh' ? '已暂存的文件' : 'Saved Files'}
                        <span className="ml-2 text-xs font-normal text-gray-600">
                          ({reg.paperSubmission.submissionFiles?.length || 1} 个)
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2 mb-3">
                      {(reg.paperSubmission.submissionFiles || []).map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-100">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <i className="fas fa-file-alt text-green-600 text-xs"></i>
                            <span className="text-xs text-gray-700 truncate">{file.fileName}</span>
                            {file.size && (
                              <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)}KB)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => onViewPaper(file.fileUrl)}
                              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                              title={lang === 'zh' ? '查看' : 'View'}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => onDeleteSavedFile(reg.competitionId, index, file.fileName)}
                              disabled={submittingPaper}
                              className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 px-2 py-1"
                              title={lang === 'zh' ? '删除' : 'Delete'}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                      <i className="fas fa-info-circle mr-1"></i>
                      {lang === 'zh' ? '可以继续添加文件或删除已保存的文件（提交后可以修改）' : 'You can add more files or delete saved files (can be modified after submission)'}
                    </p>
                  </div>

                  {/* 继续添加文件按钮 */}
                  <label className="cursor-pointer bg-white border-2 border-blue-300 text-blue-600 px-6 py-2.5 rounded-lg text-sm font-bold w-full text-center hover:bg-blue-50 hover:border-blue-400 transition block">
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.zip"
                      onChange={(e) => { onPaperFilesSelected(reg.competitionId, e.target.files); e.target.value = ''; }}
                    />
                    <i className="fas fa-plus mr-2"></i>
                    {lang === 'zh' ? '继续添加文件' : 'Add More Files'}
                    <span className="block text-xs font-normal text-gray-500 mt-1">
                      {lang === 'zh' ? '选择后自动保存，可多次添加' : 'Auto-save after selection'}
                    </span>
                  </label>

                  {/* 确认提交按钮 */}
                  <button
                    onClick={() => onSubmitClick(reg.competitionId)}
                    disabled={submittingPaper}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 text-white px-6 py-4 rounded-xl text-base font-bold w-full transition shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    {submittingPaper
                      ? (lang === 'zh' ? '提交中...' : 'Submitting...')
                      : (lang === 'zh' ? '确认提交（需支付评审费）' : 'Confirm Submission (Payment Required)')
                    }
                  </button>
                </>
              ) : (
                <label className="cursor-pointer bg-white border border-blue-200 text-blue-600 px-6 py-2 rounded-lg text-sm font-bold w-full text-center hover:bg-blue-50 transition block">
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.zip"
                    disabled={submittingPaper}
                    onChange={(e) => { onPaperFilesSelected(reg.competitionId, e.target.files); e.target.value = ''; }}
                  />
                  <i className="fas fa-upload mr-2"></i>
                  {submittingPaper
                    ? (lang === 'zh' ? '上传中...' : 'Uploading...')
                    : (lang === 'zh' ? '上传论文文件' : 'Upload Files')
                  }
                  <span className="block text-xs font-normal text-gray-500 mt-0.5">
                    {lang === 'zh' ? '支持多个文件，选择后自动保存' : 'Multiple files, auto-save'}
                  </span>
                </label>
              )}
            </div>
          )
        )}

        {/* 状态2：待支付（PENDING_PAYMENT） */}
        {reg.status === RegistrationStatus.PENDING_PAYMENT && (
          isPastDeadline ? (
            <div className="text-gray-400 px-6 py-2 text-sm text-center w-full border border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed">
              <i className="fas fa-lock mr-2"></i>
              {lang === 'zh' ? '报名已截止，无法支付' : 'Registration Closed'}
            </div>
          ) : (
            <button
              onClick={() => onPayClick(reg.competitionId)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold w-full transition flex items-center justify-center gap-2"
            >
              <i className="fab fa-weixin"></i>
              {lang === 'zh' ? '微信支付' : 'WeChat Pay'}
            </button>
          )
        )}

        {/* 状态3：已提交（SUBMITTED） */}
        {reg.status === RegistrationStatus.SUBMITTED && (
          isPastDeadline ? (
            <div className="text-gray-400 px-6 py-2 text-sm text-center w-full border border-gray-200 rounded-lg bg-gray-50">
              <i className="fas fa-lock mr-2"></i>
              {lang === 'zh' ? '已过提交截止时间' : 'Submission Closed'}
            </div>
          ) : (
            <label className="cursor-pointer bg-white border border-blue-200 text-blue-600 px-6 py-2 rounded-lg text-sm font-bold w-full text-center hover:bg-blue-50 transition block">
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.zip"
                disabled={submittingPaper}
                onChange={(e) => { onPaperFilesSelected(reg.competitionId, e.target.files); e.target.value = ''; }}
              />
              <i className="fas fa-upload mr-2"></i>
              {submittingPaper
                ? (lang === 'zh' ? '上传中...' : 'Uploading...')
                : (lang === 'zh' ? '重新上传文件' : 'Re-upload Files')
              }
              <span className="block text-xs font-normal text-gray-500 mt-0.5">
                {lang === 'zh' ? '选择后自动保存并替换' : 'Auto-save and replace'}
              </span>
            </label>
          )
        )}
      </div>
    </div>
  );
};

export default RegistrationCard;
