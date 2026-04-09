import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@/common/enums/user-role.enum';

@Injectable()
export class JudgeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未授权访问');
    }

    if (user.role !== UserRole.JUDGE && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('仅评委或管理员可访问');
    }

    return true;
  }
}
