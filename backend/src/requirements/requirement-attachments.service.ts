import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { extname, join } from 'path';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import { randomBytes } from 'crypto';
import { RequirementAttachment } from './requirement-attachment.entity';
import { Requirement } from './requirement.entity';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Injectable()
export class RequirementAttachmentsService {
  constructor(
    @InjectRepository(RequirementAttachment)
    private attRepo: Repository<RequirementAttachment>,
    @InjectRepository(Requirement) private reqRepo: Repository<Requirement>,
    private config: ConfigService,
    private auditService: AuditService,
  ) {}

  uploadRoot(): string {
    return this.config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
  }

  private async ensureRequirement(id: number): Promise<Requirement> {
    const r = await this.reqRepo.findOne({ where: { id, deleted: false } });
    if (!r) throw new NotFoundException('Requisito no encontrado');
    return r;
  }

  async list(requirementId: number) {
    await this.ensureRequirement(requirementId);
    return this.attRepo.find({
      where: { requirement: { id: requirementId } },
      relations: ['subidoPor'],
      order: { creadoEn: 'DESC' },
    });
  }

  /** Guarda archivo subido en memoria (Multer `memoryStorage`). */
  async saveFromUpload(
    requirementId: number,
    file: Express.Multer.File,
    user: User,
  ): Promise<RequirementAttachment> {
    const buf = file?.buffer;
    if (!buf?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    const mime = file.mimetype;
    if (!ALLOWED_MIMES.has(mime)) {
      throw new BadRequestException(
        'Solo se permiten PDF o Word (.pdf, .doc, .docx)',
      );
    }

    const req = await this.ensureRequirement(requirementId);
    const root = this.uploadRoot();
    const sub = join('requirements', String(requirementId));
    const dir = join(root, sub);
    mkdirSync(dir, { recursive: true });
    const ext =
      extname(file.originalname) ||
      (mime === 'application/pdf' ? '.pdf' : '.docx');
    const safeName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    const full = join(dir, safeName);
    const rel = join(sub, safeName).replace(/\\/g, '/');
    await writeFile(full, buf);

    const row = this.attRepo.create({
      requirement: req,
      nombreOriginal: file.originalname.slice(0, 255),
      rutaAlmacenamiento: rel,
      mimeType: mime,
      tamanoBytes: file.size,
      subidoPor: user,
    });
    const saved = await this.attRepo.save(row);
    await this.auditService.log(
      'ADJUNTO_REQUISITO',
      'requirements',
      requirementId,
      `Adjunto: ${saved.nombreOriginal}`,
      user,
    );
    return saved;
  }

  resolveAbsolutePath(stored: string): string {
    return join(this.uploadRoot(), stored);
  }

  async getDownloadStream(requirementId: number, attachmentId: number) {
    await this.ensureRequirement(requirementId);
    const att = await this.attRepo.findOne({
      where: { id: attachmentId, requirement: { id: requirementId } },
    });
    if (!att) throw new NotFoundException('Adjunto no encontrado');
    const full = this.resolveAbsolutePath(att.rutaAlmacenamiento);
    if (!existsSync(full)) throw new NotFoundException('Archivo no encontrado en disco');
    return { stream: createReadStream(full), attachment: att };
  }

  async remove(requirementId: number, attachmentId: number, user: User) {
    await this.ensureRequirement(requirementId);
    const att = await this.attRepo.findOne({
      where: { id: attachmentId, requirement: { id: requirementId } },
    });
    if (!att) throw new NotFoundException('Adjunto no encontrado');
    const full = this.resolveAbsolutePath(att.rutaAlmacenamiento);
    try {
      if (existsSync(full)) unlinkSync(full);
    } catch {
      /* ignore */
    }
    await this.attRepo.remove(att);
    await this.auditService.log(
      'ELIMINAR_ADJUNTO_REQUISITO',
      'requirements',
      requirementId,
      `Eliminado adjunto: ${att.nombreOriginal}`,
      user,
    );
  }
}
