import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings, SystemSettingsData } from './system-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SINGLE_ID = 1;

const DEFAULTS: SystemSettingsData = {
  org: {
    nombre: 'HealthPlus Clínica Integral',
    area: 'Tecnología (TI)',
    email: 'ti@healthplus.com',
    ciudad: 'Santo Domingo, República Dominicana',
    tel: '+1 (809) 555-0000',
    web: 'https://healthplus.com.do',
  },
  prefs: { lang: 'es', tz: 'AST', datefmt: 'dd/mm/yyyy' },
  cats: [
    'Citas',
    'Expedientes',
    'Facturación',
    'Notificaciones',
    'Integración',
    'Rendimiento',
    'Administración',
  ],
  vtrigger: 'descripcion',
  versionOpts: ['req_motivo', 'notif_cambio', 'hist_completo', 'auto_version'],
  notifOpts: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'],
  smtp: { host: '', port: '587', user: '', password: '' },
};

export interface SettingsResponse extends Omit<SystemSettingsData, 'smtp'> {
  smtp: { host: string; port: string; user: string; password?: string };
  smtpPasswordSet: boolean;
  updatedAt: string;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSettings)
    private repo: Repository<SystemSettings>,
  ) {}

  private deepMerge<T extends Record<string, unknown>>(
    base: T,
    patch: Partial<T>,
  ): T {
    const out = { ...base } as T;
    for (const k of Object.keys(patch)) {
      const v = patch[k as keyof T];
      if (v === undefined) continue;
      const prev = base[k as keyof T];
      if (
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        prev !== null &&
        typeof prev === 'object' &&
        !Array.isArray(prev)
      ) {
        (out as Record<string, unknown>)[k] = this.deepMerge(
          prev as Record<string, unknown>,
          v as Record<string, unknown>,
        );
      } else {
        (out as Record<string, unknown>)[k] = v;
      }
    }
    return out;
  }

  async getOrCreate(): Promise<SystemSettings> {
    let row = await this.repo.findOne({ where: { id: SINGLE_ID } });
    if (!row) {
      row = this.repo.create({ id: SINGLE_ID, data: { ...DEFAULTS } });
      await this.repo.save(row);
    }
    return row;
  }

  toResponse(row: SystemSettings): SettingsResponse {
    const d = row.data;
    const pwd = d.smtp?.password;
    const smtpPasswordSet = !!(pwd && String(pwd).length > 0);
    const smtp = {
      host: d.smtp?.host ?? '',
      port: d.smtp?.port ?? '587',
      user: d.smtp?.user ?? '',
    };
    return {
      org: { ...d.org },
      prefs: { ...d.prefs },
      cats: [...(d.cats ?? [])],
      vtrigger: d.vtrigger ?? DEFAULTS.vtrigger,
      versionOpts: [...(d.versionOpts ?? [])],
      notifOpts: [...(d.notifOpts ?? [])],
      smtp,
      smtpPasswordSet,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getPublic(): Promise<SettingsResponse> {
    const row = await this.getOrCreate();
    return this.toResponse(row);
  }

  async update(dto: UpdateSettingsDto): Promise<SettingsResponse> {
    const row = await this.getOrCreate();
    let data = { ...row.data, smtp: { ...row.data.smtp } };

    const { smtp: smtpDto, ...rest } = dto;
    if (Object.keys(rest).length) {
      data = this.deepMerge(
        data as unknown as Record<string, unknown>,
        rest as unknown as Record<string, unknown>,
      ) as unknown as SystemSettingsData;
    }

    if (smtpDto) {
      if (smtpDto.host !== undefined) data.smtp.host = smtpDto.host;
      if (smtpDto.port !== undefined) data.smtp.port = smtpDto.port;
      if (smtpDto.user !== undefined) data.smtp.user = smtpDto.user;
      if (smtpDto.password !== undefined && smtpDto.password !== '') {
        data.smtp.password = smtpDto.password;
      }
    }

    row.data = data;
    await this.repo.save(row);
    return this.toResponse(row);
  }
}
