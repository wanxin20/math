/**
 * 支付状态枚举
 */
export enum PaymentStatus {
  PENDING = 'pending', // 待支付
  SUCCESS = 'success', // 支付成功
  FAILED = 'failed', // 支付失败
  REFUNDED = 'refunded', // 已退款
}
