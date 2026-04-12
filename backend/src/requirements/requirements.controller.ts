import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { RequirementsService } from './requirements.service';
import { RequirementAttachmentsService } from './requirement-attachments.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/user.entity';

const ATTACHMENT_UPLOAD = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
};

@ApiTags('Requirements')
@ApiBearerAuth()
@Controller('requirements')
export class RequirementsController {
  constructor(
    private service: RequirementsService,
    private attachments: RequirementAttachmentsService,
  ) {}

  @Get()
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Listar requisitos con filtros opcionales' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'prioridad', required: false })
  @ApiQuery({ name: 'tipo', required: false })
  findAll(
    @Query('projectId') projectId?: string,
    @Query('estado') estado?: string,
    @Query('prioridad') prioridad?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.service.findAll({
      projectId: projectId ? +projectId : undefined,
      estado,
      prioridad,
      tipo,
    });
  }

  @Get(':id/comments')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Comentarios del requisito (orden cronológico)' })
  listComments(@Param('id', ParseIntPipe) id: number) {
    return this.service.listComments(id);
  }

  @Post(':id/comments')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Añadir comentario' })
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.addComment(id, dto, user);
  }

  @Get(':id/attachments')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Listar adjuntos (PDF / Word)' })
  listAttachments(@Param('id', ParseIntPipe) id: number) {
    return this.attachments.list(id);
  }

  @Post(':id/attachments')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @UseInterceptors(FileInterceptor('file', ATTACHMENT_UPLOAD))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Subir adjunto PDF o Word' })
  uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.attachments.saveFromUpload(id, file, user);
  }

  @Get(':id/attachments/:attachmentId/download')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Descargar adjunto' })
  async downloadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    const { stream, attachment } =
      await this.attachments.getDownloadStream(id, attachmentId);
    const name = attachment.nombreOriginal.replace(/"/g, '');
    return new StreamableFile(stream, {
      type: attachment.mimeType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    });
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Eliminar adjunto' })
  removeAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() user: User,
  ) {
    return this.attachments.remove(id, attachmentId, user);
  }

  @Get(':id')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Obtener requisito con historial, validaciones y comentarios' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Crear requisito' })
  create(@Body() dto: CreateRequirementDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Actualizar requisito' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequirementDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Eliminar requisito (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }
}
