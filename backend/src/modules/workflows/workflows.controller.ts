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
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { QueryWorkflowDto } from './dto/query-workflow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createWorkflowDto: CreateWorkflowDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.create(
      createWorkflowDto,
      user.organization.id,
    );
  }

  @Get()
  findAll(
    @Query() query: QueryWorkflowDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.findAll(user.organization.id, query);
  }

  @Get('triggers')
  getTriggerTypes() {
    return this.workflowsService.getTriggerTypes();
  }

  @Get('actions')
  getActionTypes() {
    return this.workflowsService.getActionTypes();
  }

  @Get('conditions')
  getConditionTypes() {
    return this.workflowsService.getConditionTypes();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workflowsService.findOne(id, user.organization.id);
  }

  @Get(':id/executions')
  getExecutions(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.getExecutions(
      id,
      user.organization.id,
      page,
      limit,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.update(id, updateWorkflowDto, user.organization.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workflowsService.remove(id, user.organization.id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workflowsService.activate(id, user.organization.id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workflowsService.deactivate(id, user.organization.id);
  }
}
