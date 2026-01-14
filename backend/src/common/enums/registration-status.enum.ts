/**
 * 报名状态枚举
 */
export enum RegistrationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT', // 待支付
  PAID = 'PAID', // 已支付
  SUBMITTED = 'SUBMITTED', // 已提交论文
  UNDER_REVIEW = 'UNDER_REVIEW', // 评审中
  REVIEWED = 'REVIEWED', // 已评审
  AWARDED = 'AWARDED', // 已获奖
  REJECTED = 'REJECTED', // 已拒绝
}
