import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JudgeGuard } from '@/common/guards/judge.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AssignJudgeDto } from './dto/assign-judge.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { UpdateScoringCriteriaDto } from './dto/update-scoring-criteria.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ==================== 评委端接口 ====================

  @Get('competitions')
  @UseGuards(JudgeGuard)
  getAssignedCompetitions(@CurrentUser('userId') userId: string) {
    return this.reviewsService.getAssignedCompetitions(userId);
  }

  @Get('competitions/:competitionId/submissions')
  @UseGuards(JudgeGuard)
  getSubmissions(
    @CurrentUser('userId') userId: string,
    @Param('competitionId') competitionId: string,
  ) {
    return this.reviewsService.getSubmissionsForJudge(userId, competitionId);
  }

  @Post('score')
  @UseGuards(JudgeGuard)
  submitScore(
    @CurrentUser('userId') userId: string,
    @Body() dto: SubmitScoreDto,
  ) {
    return this.reviewsService.submitScore(userId, dto);
  }

  // ==================== 管理员端接口 ====================

  @Get('admin/judges')
  @UseGuards(AdminGuard)
  getAllJudges() {
    return this.reviewsService.getAllJudges();
  }

  @Post('admin/assign')
  @UseGuards(AdminGuard)
  assignJudge(@Body() dto: AssignJudgeDto) {
    return this.reviewsService.assignJudge(dto);
  }

  @Delete('admin/assign/:id')
  @UseGuards(AdminGuard)
  removeAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.removeAssignment(id);
  }

  @Get('admin/competitions/:competitionId/judges')
  @UseGuards(AdminGuard)
  getJudgesForCompetition(@Param('competitionId') competitionId: string) {
    return this.reviewsService.getJudgesForCompetition(competitionId);
  }

  @Get('admin/competitions/:competitionId/scores')
  @UseGuards(AdminGuard)
  getScoresForCompetition(@Param('competitionId') competitionId: string) {
    return this.reviewsService.getScoresForCompetition(competitionId);
  }

  @Post('admin/competitions/:competitionId/criteria')
  @UseGuards(AdminGuard)
  updateScoringCriteria(
    @Param('competitionId') competitionId: string,
    @Body() dto: UpdateScoringCriteriaDto,
  ) {
    return this.reviewsService.updateScoringCriteria(competitionId, dto.criteria);
  }
}
