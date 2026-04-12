import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/role.entity';
import { User } from '../users/user.entity';
import { RequirementStatusDef } from '../requirements/requirement-status-def.entity';
import { RequirementCategoryDef } from '../requirements/requirement-category-def.entity';
import { Requirement } from '../requirements/requirement.entity';
import { DEFAULT_PERMISOS_POR_ROL } from '../roles/role-permissions';

const ROLES = [
  { nombre: 'administrador', descripcion: 'Acceso total al sistema' },
  { nombre: 'analista', descripcion: 'Gestión de requisitos y proyectos' },
  { nombre: 'stakeholder', descripcion: 'Validación de requisitos' },
  { nombre: 'gerencia', descripcion: 'Consulta y reportes ejecutivos' },
  { nombre: 'consulta', descripcion: 'Solo lectura' },
];

/** Estados globales por defecto (slug estable para reglas y validación). */
const GLOBAL_STATUSES: { slug: string; nombre: string; orden: number }[] = [
  { slug: 'borrador', nombre: 'Borrador', orden: 0 },
  { slug: 'en_revision', nombre: 'En revisión', orden: 10 },
  { slug: 'en_proceso', nombre: 'En proceso', orden: 20 },
  { slug: 'completado', nombre: 'Completado', orden: 30 },
  { slug: 'validado', nombre: 'Validado', orden: 40 },
  { slug: 'aprobado', nombre: 'Aprobado', orden: 50 },
  { slug: 'implementado', nombre: 'Implementado', orden: 60 },
  { slug: 'cerrado', nombre: 'Cerrado', orden: 70 },
  { slug: 'rechazado', nombre: 'Rechazado', orden: 80 },
  { slug: 'cancelado', nombre: 'Cancelado', orden: 90 },
  { slug: 'requiere_ajuste', nombre: 'Requiere ajuste', orden: 100 },
];

function slugifyCategoria(nombre: string): string {
  const s = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return (s || 'categoria').slice(0, 64);
}

/** Categorías globales por defecto (mismas áreas que el catálogo legacy de UI). */
const GLOBAL_CATEGORIES: { slug: string; nombre: string; orden: number }[] = [
  { slug: 'citas', nombre: 'Citas', orden: 10 },
  { slug: 'expedientes', nombre: 'Expedientes', orden: 20 },
  { slug: 'facturacion', nombre: 'Facturación', orden: 30 },
  { slug: 'notificaciones', nombre: 'Notificaciones', orden: 40 },
  { slug: 'integracion', nombre: 'Integración', orden: 50 },
  { slug: 'rendimiento', nombre: 'Rendimiento', orden: 60 },
  { slug: 'administracion', nombre: 'Administración', orden: 70 },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role) private rolesRepo: Repository<Role>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(RequirementStatusDef)
    private statusRepo: Repository<RequirementStatusDef>,
    @InjectRepository(RequirementCategoryDef)
    private categoryRepo: Repository<RequirementCategoryDef>,
    @InjectRepository(Requirement) private reqRepo: Repository<Requirement>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.seedAdminUser();
    await this.seedStakeholderDemoUser();
    await this.seedGerenciaDemoUser();
    await this.seedConsultaDemoUser();
    await this.seedRequirementStatuses();
    await this.seedRequirementCategories();
  }

  private async seedRoles() {
    for (const r of ROLES) {
      const exists = await this.rolesRepo.findOne({ where: { nombre: r.nombre } });
      const defaults = DEFAULT_PERMISOS_POR_ROL[r.nombre];
      if (!exists) {
        await this.rolesRepo.save(
          this.rolesRepo.create({ ...r, permisos: defaults }),
        );
        this.logger.log(`Rol creado: ${r.nombre}`);
      } else if (!exists.permisos) {
        exists.permisos = defaults;
        await this.rolesRepo.save(exists);
        this.logger.log(`Permisos por defecto aplicados al rol: ${r.nombre}`);
      }
    }
  }

  private async seedAdminUser() {
    const adminEmail = 'admin@healthplus.com';
    const exists = await this.usersRepo.findOne({ where: { email: adminEmail } });
    if (exists) return;

    const adminRole = await this.rolesRepo.findOne({ where: { nombre: 'administrador' } });
    if (!adminRole) return;

    const password = await bcrypt.hash('Admin@1234', 12);
    await this.usersRepo.save(
      this.usersRepo.create({
        nombre: 'Administrador HealthPlus',
        email: adminEmail,
        password,
        activo: true,
        role: adminRole,
      }),
    );
    this.logger.log('Usuario admin creado: admin@healthplus.com / Admin@1234');
  }

  /** Usuario de rol stakeholder para demos y pruebas e2e (`E2E_INTEGRATION=1`). */
  private async seedStakeholderDemoUser() {
    const email = 'stakeholder@healthplus.com';
    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) return;

    const role = await this.rolesRepo.findOne({ where: { nombre: 'stakeholder' } });
    if (!role) return;

    const password = await bcrypt.hash('Stake@1234', 12);
    await this.usersRepo.save(
      this.usersRepo.create({
        nombre: 'Stakeholder demo',
        email,
        password,
        activo: true,
        role,
      }),
    );
    this.logger.log('Usuario stakeholder demo: stakeholder@healthplus.com / Stake@1234');
  }

  /** Rol gerencia: reportes ejecutivos; sin CRUD de requisitos (e2e / demos). */
  private async seedGerenciaDemoUser() {
    const email = 'gerencia@healthplus.com';
    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) return;

    const role = await this.rolesRepo.findOne({ where: { nombre: 'gerencia' } });
    if (!role) return;

    const password = await bcrypt.hash('Gerencia@1234', 12);
    await this.usersRepo.save(
      this.usersRepo.create({
        nombre: 'Gerencia demo',
        email,
        password,
        activo: true,
        role,
      }),
    );
    this.logger.log('Usuario gerencia demo: gerencia@healthplus.com / Gerencia@1234');
  }

  /** Rol consulta: solo reportes (misma matriz API que gerencia en reportes). */
  private async seedConsultaDemoUser() {
    const email = 'consulta@healthplus.com';
    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) return;

    const role = await this.rolesRepo.findOne({ where: { nombre: 'consulta' } });
    if (!role) return;

    const password = await bcrypt.hash('Consulta@1234', 12);
    await this.usersRepo.save(
      this.usersRepo.create({
        nombre: 'Consulta demo',
        email,
        password,
        activo: true,
        role,
      }),
    );
    this.logger.log('Usuario consulta demo: consulta@healthplus.com / Consulta@1234');
  }

  private async seedRequirementStatuses() {
    for (const g of GLOBAL_STATUSES) {
      const exists = await this.statusRepo.findOne({
        where: { slug: g.slug, project: IsNull() },
      });
      if (!exists) {
        await this.statusRepo.save(
          this.statusRepo.create({
            nombre: g.nombre,
            slug: g.slug,
            orden: g.orden,
            project: null,
            esSistema: true,
            activo: true,
            color: null,
          }),
        );
        this.logger.log(`Estado de requisito: ${g.slug}`);
      }
    }

    const sinDef = await this.reqRepo.find({
      where: { statusDef: IsNull(), deleted: false },
    });
    for (const r of sinDef) {
      const d = await this.statusRepo.findOne({
        where: { slug: r.estado, project: IsNull() },
      });
      if (d) {
        r.statusDef = d;
        await this.reqRepo.save(r);
      }
    }
  }

  private async seedRequirementCategories() {
    for (const g of GLOBAL_CATEGORIES) {
      const exists = await this.categoryRepo.findOne({
        where: { slug: g.slug, project: IsNull() },
      });
      if (!exists) {
        await this.categoryRepo.save(
          this.categoryRepo.create({
            nombre: g.nombre,
            slug: g.slug,
            orden: g.orden,
            project: null,
            esSistema: true,
            activo: true,
            color: null,
          }),
        );
        this.logger.log(`Categoría de requisito: ${g.slug}`);
      }
    }

    const sinDef = await this.reqRepo
      .createQueryBuilder('r')
      .where('r.deleted = :d', { d: false })
      .andWhere('r.category_def_id IS NULL')
      .andWhere('r.categoria IS NOT NULL')
      .andWhere("r.categoria <> ''")
      .getMany();
    for (const r of sinDef) {
      if (!r.categoria || !String(r.categoria).trim()) continue;
      const raw = String(r.categoria).trim();
      const slugTry = slugifyCategoria(raw);
      let d = await this.categoryRepo.findOne({
        where: { slug: slugTry, project: IsNull() },
      });
      if (!d) {
        d = await this.categoryRepo.findOne({
          where: { nombre: raw, project: IsNull() },
        });
      }
      if (!d) {
        const all = await this.categoryRepo.find({
          where: { project: IsNull() },
        });
        d =
          all.find(
            (c) => c.nombre.toLowerCase() === raw.toLowerCase(),
          ) ?? null;
      }
      if (d) {
        r.categoryDef = d;
        r.categoria = d.slug;
        await this.reqRepo.save(r);
      }
    }
  }
}
