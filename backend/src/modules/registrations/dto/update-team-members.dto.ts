import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TeamMemberDto } from './team-member.dto';

export class UpdateTeamMembersDto {
  @ApiProperty({ description: '竞赛组成员列表（覆盖式更新）', type: [TeamMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  members: TeamMemberDto[];
}
