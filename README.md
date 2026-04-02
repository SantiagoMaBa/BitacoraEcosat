# Bitacora Ecosat

Base frontend del MVP para la plataforma de bitacora inteligente descrita en el PRD.

## Lo que ya incluye

- Dashboard principal con resumen operativo.
- Flujo de captura mobile-first en dos pasos.
- Panel de supervisor con filtros y pendientes.
- Vista de acta de servicio lista para PDF.
- Integracion visual con logos y paleta Ecosat.

## Stack

- Next.js
- React
- TypeScript
- CSS global con tokens visuales de marca

## Ejecutar

```bash
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

### Probar en celular (misma red WiFi)

```bash
npm run dev:lan
```

Luego abre desde tu celular `http://IP_DE_TU_MAC:3000/login`.

## OpenAI (opcional)

- Coloca `OPENAI_API_KEY` en `./.env.local` (no se commitea) o exportala en tu terminal.
- La key solo se usa en server actions/routes, no se expone al frontend.
- Modelo recomendado para estructurar reportes: `OPENAI_MODEL="gpt-4o"` (fallback `OPENAI_MODEL_FALLBACK="gpt-4o-mini"`).

## Deploy (Vercel + Supabase)

1. Crea un proyecto en Supabase:
- Database: copia el connection string para `DATABASE_URL` (usa el pooler si está disponible).
- Direct connection: copia el connection string para `DIRECT_URL` (sin pooler) para migraciones.
- Storage: crea un bucket `evidences` (puede ser público para MVP).

2. En Vercel (Project Settings -> Environment Variables) agrega:
- `DATABASE_URL`, `DIRECT_URL`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_EVIDENCE_BUCKET`
- `OPENAI_API_KEY` (y opcional `OPENAI_MODEL`, `OPENAI_MODEL_FALLBACK`, `OPENAI_TEMPERATURE`, `OPENAI_MAX_TOKENS`)
- `DEMO_AUTH_SECRET`

3. Deploy:
- Vercel ejecuta `vercel-build` que corre `prisma migrate deploy` y luego `next build`.

4. Seed inicial (una vez):
- Ejecuta `npm run db:seed` local apuntando a la BD de Supabase (con `DATABASE_URL`/`DIRECT_URL` en tu `.env.local`), o crea clientes/usuarios desde `/admin`.

## Siguiente fase recomendada

1. Conectar autenticacion y roles reales.
2. Crear API para usuarios, clientes, sucursales y reportes.
3. Integrar speech-to-text y parser IA.
4. Agregar almacenamiento de evidencias y firma digital real.
