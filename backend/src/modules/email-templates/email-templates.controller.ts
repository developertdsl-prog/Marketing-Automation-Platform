import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { QueryEmailTemplateDto } from './dto/query-email-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('email-templates')
@UseGuards(JwtAuthGuard)
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createEmailTemplateDto: CreateEmailTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.emailTemplatesService.create(
      createEmailTemplateDto,
      user.organization.id,
    );
  }

  @Get()
  findAll(
    @Query() query: QueryEmailTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.emailTemplatesService.findAll(user.organization.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.emailTemplatesService.findOne(id, user.organization.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmailTemplateDto: UpdateEmailTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.emailTemplatesService.update(
      id,
      updateEmailTemplateDto,
      user.organization.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.emailTemplatesService.remove(id, user.organization.id);
  }
}
