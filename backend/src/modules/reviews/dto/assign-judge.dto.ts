import { IsString, IsNotEmpty } from 'class-validator';

export class AssignJudgeDto {
  @IsString()
  @IsNotEmpty({ message: '评委用户ID不能为空' })
  judgeUserId: string;

  @IsString()
  @IsNotEmpty({ message: '竞赛ID不能为空' })
  competitionId: string;
}
