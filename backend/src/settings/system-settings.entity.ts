import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/** Contenido persistido (contraseña SMTP va en smtp.password solo en almacenamiento). */
export interface SystemSettingsData {
  org: {
    nombre: string;
    area: string;
    email: string;
    ciudad: string;
    tel: string;
    web: string;
  };
  prefs: { lang: string; tz: string; datefmt: string };
  cats: string[];
  vtrigger: string;
  versionOpts: string[];
  notifOpts: string[];
  smtp: { host: string; port: string; user: string; password?: string };
}

@Entity('system_settings')
export class SystemSettings {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ name: 'data', type: 'simple-json' })
  data: SystemSettingsData;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
