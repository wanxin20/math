import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserRegistration } from '@/modules/registrations/entities/user-registration.entity';

@Entity('users')
export class User {
  @PrimaryColumn('varchar', { length: 36, comment: '用户唯一标识' })
  id: string;

  @Column({ length: 100, comment: '教师姓名' })
  name: string;

  @Column({ length: 150, unique: true, comment: '电子邮箱' })
  email: string;

  @Column({ name: 'password_hash', length: 255, comment: '密码哈希值', select: false })
  passwordHash: string;

  @Column({ length: 200, comment: '任教单位/学校' })
  institution: string;

  @Column({ length: 100, comment: '职称/职务' })
  title: string;

  @Column({ length: 20, comment: '手机号码' })
  phone: string;

  @Column({ name: 'avatar_url', length: 500, nullable: true, comment: '头像URL' })
  avatarUrl: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    comment: '账户状态',
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: '用户角色',
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', comment: '注册时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true, comment: '最后登录时间' })
  lastLoginAt: Date;

  // 关联关系
  @OneToMany(() => UserRegistration, (registration) => registration.user)
  registrations: UserRegistration[];
}
