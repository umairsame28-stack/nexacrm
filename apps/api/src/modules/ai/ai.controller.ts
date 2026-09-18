import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AIFacadeService } from './ai-facade.service';
import {
  SuggestReplyDto,
  SummarizeConversationDto,
  RewriteDto,
  CorrectGrammarDto,
  TranslateDto,
  QualifyLeadDto,
  SentimentAnalysisDto,
  SuggestTagsDto,
  GenerateFollowUpDto,
  AISearchDto,
  InsightsDto,
} from './dto/ai.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiWorkspaceAuth } from '../../common/decorators/api-workspace-auth.decorator';

@ApiTags('AI Assistant')
@ApiWorkspaceAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiFacade: AIFacadeService) {}

  @Post('suggest-reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suggest 3 reply options for the last message in a conversation' })
  suggestReply(@CurrentUser() user: AuthenticatedUser, @Body() dto: SuggestReplyDto) {
    return this.aiFacade.suggestReply(user.workspaceId, dto, user.id);
  }

  @Post('summarize-conversation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a bullet-point summary and sentiment of a conversation' })
  summarize(@CurrentUser() user: AuthenticatedUser, @Body() dto: SummarizeConversationDto) {
    return this.aiFacade.summarizeConversation(user.workspaceId, dto, user.id);
  }

  @Post('rewrite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rewrite a text with the specified tone' })
  rewrite(@CurrentUser() user: AuthenticatedUser, @Body() dto: RewriteDto) {
    return this.aiFacade.rewrite(user.workspaceId, dto, user.id);
  }

  @Post('correct-grammar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Correct grammar and spelling in a text' })
  correctGrammar(@CurrentUser() user: AuthenticatedUser, @Body() dto: CorrectGrammarDto) {
    return this.aiFacade.correctGrammar(user.workspaceId, dto, user.id);
  }

  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Translate a message to the target language' })
  translate(@CurrentUser() user: AuthenticatedUser, @Body() dto: TranslateDto) {
    return this.aiFacade.translate(user.workspaceId, dto, user.id);
  }

  @Post('qualify-lead')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI lead qualification (HOT / WARM / COLD) with reasoning' })
  qualifyLead(@CurrentUser() user: AuthenticatedUser, @Body() dto: QualifyLeadDto) {
    return this.aiFacade.qualifyLead(user.workspaceId, dto, user.id);
  }

  @Post('sentiment-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze customer sentiment for a conversation' })
  sentiment(@CurrentUser() user: AuthenticatedUser, @Body() dto: SentimentAnalysisDto) {
    return this.aiFacade.analyzeSentiment(user.workspaceId, dto, user.id);
  }

  @Post('suggest-tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suggest CRM tags for a contact based on their conversation' })
  suggestTags(@CurrentUser() user: AuthenticatedUser, @Body() dto: SuggestTagsDto) {
    return this.aiFacade.suggestTags(user.workspaceId, dto, user.id);
  }

  @Post('generate-followup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a follow-up message for a deal' })
  generateFollowUp(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateFollowUpDto) {
    return this.aiFacade.generateFollowUp(user.workspaceId, dto, user.id);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Semantic search across all CRM data' })
  search(@CurrentUser() user: AuthenticatedUser, @Body() dto: AISearchDto) {
    return this.aiFacade.search(user.workspaceId, dto, user.id);
  }

  @Post('insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI narrative insights from dashboard metrics' })
  insights(@CurrentUser() user: AuthenticatedUser, @Body() dto: InsightsDto) {
    return this.aiFacade.generateInsights(user.workspaceId, dto, user.id);
  }
}
