# 论文退回功能 - REVISION_REQUIRED 状态说明

## 概述
新增 `REVISION_REQUIRED`（需要修改）状态，专门用于管理员退回论文的场景。用户在此状态下重新提交论文，无需再次支付评审费。

## 状态流程

### 首次提交流程
```
PENDING_SUBMISSION (待提交)
    ↓ 上传文件后点击"确认提交"
PENDING_PAYMENT (待支付)
    ↓ 支付成功
SUBMITTED (已提交)
```

### 论文退回流程
```
SUBMITTED (已提交)
    ↓ 管理员退回
REVISION_REQUIRED (需要修改) ⚠️ 已支付，无需再次支付
    ↓ 修改后重新提交
SUBMITTED (已提交) ✅ 无需再次支付
```

## 修改的文件

### 1. 后端修改

#### `backend/src/common/enums/registration-status.enum.ts`
- ✅ 添加 `REVISION_REQUIRED` 状态枚举

#### `backend/src/modules/registrations/registrations.service.ts`
- ✅ `rejectSubmission()`: 退回时状态改为 `REVISION_REQUIRED`
- ✅ `confirmSubmission()`: 支持 `REVISION_REQUIRED` 状态提交，自动跳过支付
- ✅ `exportByCompetitionId()`: Excel 导出时添加状态文本映射

#### `backend/src/modules/registrations/entities/user-registration.entity.ts`
- ✅ 更新状态字段注释，说明所有状态含义

#### `backend/migrations/add-revision-required-status.sql`
- ✅ 数据库迁移文件：更新 `user_registrations` 表的 `status` 字段枚举

### 2. 前端修改

#### `types.ts`
- ✅ 添加 `REVISION_REQUIRED` 状态到前端枚举

#### `pages/Dashboard/index.tsx`
- ✅ `getStatusText()`: 添加状态文本映射
  - 中文：需要修改
  - English: Revision Required

#### `pages/Dashboard/components/RegistrationCard.tsx`
- ✅ 退回提示：仅在 `REVISION_REQUIRED` 状态显示
- ✅ 操作按钮：处理 `REVISION_REQUIRED` 状态
- ✅ 提交按钮文字：显示"无需再次支付"
- ✅ 进度步骤：`REVISION_REQUIRED` 状态显示修改图标

#### `pages/Dashboard/hooks/usePaperSubmission.ts`
- ✅ 确认对话框：根据 `REVISION_REQUIRED` 状态显示不同提示
- ✅ 提交逻辑：支持 `skipPayment` 标志，跳过支付流程

## 数据库迁移

运行以下 SQL 更新数据库：

```bash
# 连接到数据库
mysql -h dbconn.sealosgzg.site -P 37159 -u root -p teacher_research_reform

# 执行迁移
source backend/migrations/add-revision-required-status.sql
```

或者手动执行：

```sql
ALTER TABLE user_registrations 
MODIFY COLUMN status ENUM(
  'PENDING_SUBMISSION',
  'PENDING_PAYMENT', 
  'PAID',
  'SUBMITTED', 
  'REVISION_REQUIRED',
  'UNDER_REVIEW', 
  'REVIEWED', 
  'AWARDED', 
  'REJECTED'
) DEFAULT 'PENDING_SUBMISSION' COMMENT '报名状态';
```

## 用户体验流程

### 场景：管理员退回论文

1. **用户提交论文并支付**
   - 状态：`SUBMITTED`
   - 显示：绿色的"已提交"标签

2. **管理员退回论文**
   - 管理员在后台点击"退回"，填写退回原因
   - 状态自动变为：`REVISION_REQUIRED`
   - 用户看到：
     - 🔴 红色退回提示框
     - 退回原因（管理员填写）
     - ✅ 绿色"已支付"状态卡片（显示支付时间）
     - 💡 蓝色提示："您已支付过评审费，无需再次缴费"

3. **用户修改并重新上传**
   - 状态：`REVISION_REQUIRED`
   - 可以删除、添加文件
   - 进度步骤显示"修改"图标（而不是"上传"）

4. **用户点击提交**
   - 确认对话框提示："您已支付过评审费，此次提交无需再次支付"
   - 点击确认后，直接提交成功
   - 状态变为：`SUBMITTED`
   - **不再进入支付流程**
   - 退回原因自动清除

## 状态显示

| 状态 | 中文 | 英文 | 说明 |
|------|------|------|------|
| `PENDING_SUBMISSION` | 待提交 | Pending Submission | 首次报名，还未上传文件 |
| `PENDING_PAYMENT` | 待支付 | Pending Payment | 已提交，等待支付 |
| `SUBMITTED` | 已提交 | Submitted | 已支付，已提交成功 |
| `REVISION_REQUIRED` | 需要修改 | Revision Required | ⚠️ 已支付，被退回，需修改 |
| `UNDER_REVIEW` | 评审中 | Under Review | 正在评审 |
| `REVIEWED` | 已评审 | Reviewed | 评审完成 |
| `AWARDED` | 已获奖 | Awarded | 已获奖 |
| `REJECTED` | 已拒绝 | Rejected | 已拒绝 |

## 关键逻辑

### 后端判断逻辑

```typescript
// confirmSubmission 方法
if (hasSuccessfulPayment || registration.status === RegistrationStatus.REVISION_REQUIRED) {
  // 已支付或从退回状态提交 -> 直接进入 SUBMITTED，跳过支付
  registration.status = RegistrationStatus.SUBMITTED;
  registration.rejectionReason = null; // 清除退回原因
  return { ...registration, skipPayment: true };
} else {
  // 首次提交 -> 进入 PENDING_PAYMENT，需要支付
  registration.status = RegistrationStatus.PENDING_PAYMENT;
  return { ...registration, skipPayment: false };
}
```

### 前端判断逻辑

```typescript
// 是否显示退回提示
reg.status === RegistrationStatus.REVISION_REQUIRED

// 提交按钮文字
reg.status === RegistrationStatus.REVISION_REQUIRED
  ? '确认重新提交（无需再次支付）'
  : '确认提交（需支付评审费）'

// 是否跳过支付流程
if (response.data?.skipPayment) {
  // 显示成功提示，不进入支付流程
} else {
  // 进入发票和支付流程
}
```

## 优势

### 之前的问题
- ❌ 退回后状态变回 `PENDING_SUBMISSION`，与首次提交混淆
- ❌ 无法清晰区分"首次提交"和"退回后重新提交"
- ❌ 需要复杂的判断逻辑（检查支付状态、退回原因等）

### 现在的优势
- ✅ 状态清晰：`REVISION_REQUIRED` 专门表示"退回待修改"
- ✅ 语义明确：一看就知道论文被退回了
- ✅ 逻辑简单：只需判断 `status === REVISION_REQUIRED`
- ✅ 用户体验好：明确知道自己的状态和无需再次支付
- ✅ 易于维护：状态流程清晰，不容易出错

## 测试步骤

1. **首次提交流程测试**
   ```
   1. 报名竞赛
   2. 上传文件
   3. 确认提交 -> 应该进入支付流程
   4. 支付成功 -> 状态变为 SUBMITTED
   ```

2. **退回重新提交流程测试**
   ```
   1. 管理员退回论文（状态 -> REVISION_REQUIRED）
   2. 用户看到退回提示和支付状态
   3. 修改文件
   4. 确认提交 -> 应该直接提交成功，不进入支付流程
   5. 状态变为 SUBMITTED，退回原因被清除
   ```

3. **多次退回测试**
   ```
   1. 第一次退回 -> REVISION_REQUIRED
   2. 重新提交 -> SUBMITTED
   3. 第二次退回 -> REVISION_REQUIRED（退回原因更新）
   4. 再次提交 -> SUBMITTED（仍然无需支付）
   ```

## 注意事项

1. **数据库迁移**: 必须先执行数据库迁移，添加 `REVISION_REQUIRED` 状态
2. **已有数据**: 如果有正在进行中的退回数据（旧的逻辑中状态为 `PENDING_SUBMISSION` 但已支付），需要手动更新状态
3. **兼容性**: 新旧状态共存时不会有问题，因为旧数据不会有 `REVISION_REQUIRED` 状态
