import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (!password || password.length < 6) {
      return false;
    }

    // 检查是否包含大写字母
    const hasUpperCase = /[A-Z]/.test(password);
    // 检查是否包含小写字母
    const hasLowerCase = /[a-z]/.test(password);
    // 检查是否包含特殊字符
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

    // 统计满足的条件数量
    const conditionsMet = [hasUpperCase, hasLowerCase, hasSpecialChar].filter(Boolean).length;

    // 至少满足其中两种
    return conditionsMet >= 2;
  }

  defaultMessage(): string {
    return '密码必须至少6位，且包含大写字母、小写字母、特殊字符中的至少两种';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
