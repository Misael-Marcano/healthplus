import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/** Requiere SQL Server según `.env`. Sin BD: `npm run test:e2e` omite esta suite. */
const e2eDb = process.env.E2E_INTEGRATION === '1';

const adminLogin = {
  email: 'admin@healthplus.com',
  password: 'Admin@1234',
};

const stakeholderLogin = {
  email: 'stakeholder@healthplus.com',
  password: 'Stake@1234',
};

const gerenciaLogin = {
  email: 'gerencia@healthplus.com',
  password: 'Gerencia@1234',
};

const consultaLogin = {
  email: 'consulta@healthplus.com',
  password: 'Consulta@1234',
};

(e2eDb ? describe : describe.skip)('HealthPlus API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 90_000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Público y auth', () => {
    it('GET /api — salud pública', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            status: 'ok',
            service: 'healthplus-api',
          });
        });
    });

    it('POST /api/auth/login — credenciales inválidas', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'noexiste@healthplus.com', password: 'wrongpassword1' })
        .expect(401);
    });

    it('POST /api/auth/login — validación (contraseña corta)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'a@b.com', password: '12345' })
        .expect(400);
    });

    it('GET /api/reports/dashboard sin token — 401', () => {
      return request(app.getHttpServer()).get('/api/reports/dashboard').expect(401);
    });

    it('GET /api/requirements/1/attachments sin token — 401', () => {
      return request(app.getHttpServer())
        .get('/api/requirements/1/attachments')
        .expect(401);
    });

    it('GET /api/settings sin token — 401', () => {
      return request(app.getHttpServer()).get('/api/settings').expect(401);
    });

    it('GET /api/notifications/inbox sin token — 401', () => {
      return request(app.getHttpServer()).get('/api/notifications/inbox').expect(401);
    });
  });

  describe('Token administrador (seed)', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(adminLogin);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      token = res.body.accessToken as string;
    });

    const auth = () => ({ Authorization: `Bearer ${token}` });

    it('GET /api/reports/dashboard — 200', () => {
      return request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set(auth())
        .expect(200);
    });

    it('GET /api/requirement-statuses — 200 (lista)', () => {
      return request(app.getHttpServer())
        .get('/api/requirement-statuses')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/users — 200 (solo administrador)', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/validation/pending — 200', () => {
      return request(app.getHttpServer())
        .get('/api/validation/pending')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/settings — 200 (configuración pública, cualquier usuario autenticado)', () => {
      return request(app.getHttpServer())
        .get('/api/settings')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(typeof res.body).toBe('object');
        });
    });

    it('GET /api/audit — 200 (solo administrador)', () => {
      return request(app.getHttpServer())
        .get('/api/audit')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/notifications/inbox — 200 (bandeja unificada)', () => {
      return request(app.getHttpServer())
        .get('/api/notifications/inbox')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('unreadCount');
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(typeof res.body.unreadCount).toBe('number');
        });
    });

    it('POST /api/notifications/mark-read — 204', () => {
      return request(app.getHttpServer())
        .post('/api/notifications/mark-read')
        .set(auth())
        .send({ items: [] })
        .expect(204);
    });

    it('GET /api/validation/mine — 200 (asignadas al usuario)', () => {
      return request(app.getHttpServer())
        .get('/api/validation/mine')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/validation/pending-requirement-ids — 200', () => {
      return request(app.getHttpServer())
        .get('/api/validation/pending-requirement-ids')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('ids');
          expect(Array.isArray(res.body.ids)).toBe(true);
        });
    });

    it('GET /api/requirements/999999999/attachments — 404 (requisito inexistente)', () => {
      return request(app.getHttpServer())
        .get('/api/requirements/999999999/attachments')
        .set(auth())
        .expect(404);
    });

    it('POST /api/requirements/:id/attachments — 201 (multipart PDF)', async () => {
      const projectsRes = await request(app.getHttpServer())
        .get('/api/projects')
        .set(auth());
      expect(projectsRes.status).toBe(200);
      let projectId: number;
      const list = projectsRes.body as { id: number }[];
      if (Array.isArray(list) && list.length > 0) {
        projectId = list[0].id;
      } else {
        const pr = await request(app.getHttpServer())
          .post('/api/projects')
          .set(auth())
          .send({
            nombre: `E2E-adjuntos-${Date.now()}`,
            descripcion: 'Proyecto para prueba e2e de adjuntos',
          });
        expect([200, 201]).toContain(pr.status);
        projectId = (pr.body as { id: number }).id;
      }

      const cr = await request(app.getHttpServer())
        .post('/api/requirements')
        .set(auth())
        .send({
          titulo: 'Requisito E2E adjunto',
          descripcion:
            'Descripción mínima de al menos diez caracteres para el requisito de prueba.',
          projectId,
          tipo: 'funcional',
          prioridad: 'media',
        });
      expect([200, 201]).toContain(cr.status);
      const reqId = (cr.body as { id: number }).id;

      const pdfPath = join(tmpdir(), `hp-e2e-${Date.now()}.pdf`);
      const minimalPdf = Buffer.from(
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n100\n%%EOF',
        'utf8',
      );
      writeFileSync(pdfPath, minimalPdf);
      try {
        const up = await request(app.getHttpServer())
          .post(`/api/requirements/${reqId}/attachments`)
          .set(auth())
          .attach('file', pdfPath);
        expect([200, 201]).toContain(up.status);
        expect(up.body).toHaveProperty('id');
        expect(up.body.mimeType).toBe('application/pdf');
        expect(up.body.nombreOriginal).toMatch(/\.pdf$/i);
      } finally {
        try {
          unlinkSync(pdfPath);
        } catch {
          /* ignore */
        }
      }
    });

    it('POST /api/requirements/:id/attachments — 400 (tipo de archivo no permitido)', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/requirements')
        .set(auth());
      expect(list.status).toBe(200);
      let reqId: number;
      const reqs = list.body as { id: number }[];
      if (Array.isArray(reqs) && reqs.length > 0) {
        reqId = reqs[0].id;
      } else {
        const projectsRes = await request(app.getHttpServer())
          .get('/api/projects')
          .set(auth());
        expect(projectsRes.status).toBe(200);
        const pr = await request(app.getHttpServer())
          .post('/api/projects')
          .set(auth())
          .send({
            nombre: `E2E-mime-${Date.now()}`,
            descripcion: 'Proyecto para prueba MIME',
          });
        expect([200, 201]).toContain(pr.status);
        const projectId = (pr.body as { id: number }).id;
        const cr = await request(app.getHttpServer())
          .post('/api/requirements')
          .set(auth())
          .send({
            titulo: 'Requisito E2E MIME',
            descripcion:
              'Descripción mínima de al menos diez caracteres para prueba MIME.',
            projectId,
            tipo: 'funcional',
            prioridad: 'media',
          });
        expect([200, 201]).toContain(cr.status);
        reqId = (cr.body as { id: number }).id;
      }

      const txtPath = join(tmpdir(), `hp-e2e-invalid-${Date.now()}.txt`);
      writeFileSync(txtPath, 'contenido no permitido para adjuntos');
      try {
        const up = await request(app.getHttpServer())
          .post(`/api/requirements/${reqId}/attachments`)
          .set(auth())
          .attach('file', txtPath);
        expect(up.status).toBe(400);
      } finally {
        try {
          unlinkSync(txtPath);
        } catch {
          /* ignore */
        }
      }
    });
  });

  describe('Token stakeholder (seed) — permisos', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(stakeholderLogin);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      token = res.body.accessToken as string;
    });

    const auth = () => ({ Authorization: `Bearer ${token}` });

    it('GET /api/users — 403 (no administrador)', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set(auth())
        .expect(403);
    });

    it('GET /api/validation/pending — 200', () => {
      return request(app.getHttpServer())
        .get('/api/validation/pending')
        .set(auth())
        .expect(200);
    });

    it('GET /api/requirement-statuses — 403 (solo administrador / analista)', () => {
      return request(app.getHttpServer())
        .get('/api/requirement-statuses')
        .set(auth())
        .expect(403);
    });

    it('GET /api/requirements/1/attachments — 403 (solo administrador / analista)', () => {
      return request(app.getHttpServer())
        .get('/api/requirements/1/attachments')
        .set(auth())
        .expect(403);
    });

    it('GET /api/audit — 403 (solo administrador)', () => {
      return request(app.getHttpServer())
        .get('/api/audit')
        .set(auth())
        .expect(403);
    });

    it('GET /api/notifications/inbox — 200 (stakeholder)', () => {
      return request(app.getHttpServer())
        .get('/api/notifications/inbox')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('unreadCount');
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(typeof res.body.unreadCount).toBe('number');
        });
    });

    it('GET /api/validation/mine — 200 (stakeholder)', () => {
      return request(app.getHttpServer())
        .get('/api/validation/mine')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/validation/pending-requirement-ids — 403 (solo admin/analista)', () => {
      return request(app.getHttpServer())
        .get('/api/validation/pending-requirement-ids')
        .set(auth())
        .expect(403);
    });
  });

  describe('Token gerencia (seed) — reportes sí, requisitos no', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(gerenciaLogin);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      token = res.body.accessToken as string;
    });

    const auth = () => ({ Authorization: `Bearer ${token}` });

    it('GET /api/reports/dashboard — 200', () => {
      return request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set(auth())
        .expect(200);
    });

    it('GET /api/reports/requirements-detail — 200', () => {
      return request(app.getHttpServer())
        .get('/api/reports/requirements-detail')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/requirements — 403 (solo administrador / analista)', () => {
      return request(app.getHttpServer())
        .get('/api/requirements')
        .set(auth())
        .expect(403);
    });

    it('GET /api/users — 403', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set(auth())
        .expect(403);
    });
  });

  describe('Token consulta (seed) — reportes sí, requisitos no', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(consultaLogin);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      token = res.body.accessToken as string;
    });

    const auth = () => ({ Authorization: `Bearer ${token}` });

    it('GET /api/reports/dashboard — 200', () => {
      return request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set(auth())
        .expect(200);
    });

    it('GET /api/reports/requirements-detail — 200', () => {
      return request(app.getHttpServer())
        .get('/api/reports/requirements-detail')
        .set(auth())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/requirements — 403', () => {
      return request(app.getHttpServer())
        .get('/api/requirements')
        .set(auth())
        .expect(403);
    });

    it('GET /api/requirements/1/attachments — 403', () => {
      return request(app.getHttpServer())
        .get('/api/requirements/1/attachments')
        .set(auth())
        .expect(403);
    });
  });
});
