/**
 * 报名状态枚举
 */
export enum RegistrationStatus {
  PENDING_SUBMISSION = 'PENDING_SUBMISSION', // 待提交（可上传文件暂存）
  PENDING_PAYMENT = 'PENDING_PAYMENT', // 待支付（点击提交后）
  SUBMITTED = 'SUBMITTED', // 已提交（支付成功）
  UNDER_REVIEW = 'UNDER_REVIEW', // 评审中
  REVIEWED = 'REVIEWED', // 已评审
  AWARDED = 'AWARDED', // 已获奖
  REJECTED = 'REJECTED', // 已拒绝
}
