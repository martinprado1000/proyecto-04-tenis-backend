import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Req,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, ResponseTeamDto } from './dto';
import { idMongoPipe } from 'src/common/pipes/idMongo.pipe';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';

@ApiTags('Admin / Equipos')
@Controller('admin/equipos')
@Auth(ValidRoles.SUPERADMIN, ValidRoles.ADMIN)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Teams list', type: [ResponseTeamDto] })
  async findAll(@Req() req: any) {
    return await this.teamsService.findAll(req.organizationId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Team found', type: ResponseTeamDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async findOne(@Param('id', idMongoPipe) id: string, @Req() req: any) {
    return await this.teamsService.findOne(id, req.organizationId);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Team created', type: ResponseTeamDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createTeamDto: CreateTeamDto, @Req() req: any) {
    if (req.organizationId) createTeamDto['organizationId'] = req.organizationId;
    return await this.teamsService.create(createTeamDto);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Team updated', type: ResponseTeamDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async update(
    @Param('id', idMongoPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Req() req: any,
  ) {
    if (req.organizationId) updateTeamDto['organizationId'] = req.organizationId;
    return await this.teamsService.update(id, updateTeamDto, req.organizationId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Team deleted' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async remove(@Param('id', idMongoPipe) id: string, @Req() req: any) {
    return await this.teamsService.delete(id, req.organizationId);
  }
}
