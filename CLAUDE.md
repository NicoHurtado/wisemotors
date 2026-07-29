# WiseMotors — Contexto para Claude Code

> Handoff del 27-jul-2026. El plan estratégico completo está en `docs-plan-rediseno-2026.md`
> (léelo antes de decisiones de arquitectura). Este archivo es el estado operativo.

## Qué es esto

Marketplace de vehículos nuevos en Colombia (foco Medellín). Diferenciador: búsqueda en
lenguaje natural con IA para gente que NO sabe de carros. Modelo de negocio: leads a
WhatsApp (`WhatsAppLead`) para concesionarios. Stack: Next.js 14 App Router + TS +
Tailwind/Radix + Prisma 5 + PostgreSQL + OpenAI (gpt-4o-mini/4o) + Cloudinary + Vercel.

**Contexto de mercado que debe permear todo:** en Colombia un Mercedes es lujo pleno y un
Corolla es casi gama alta. Los umbrales, comparaciones y puntajes se calibran contra lo
que SE VENDE EN COLOMBIA, nunca contra el catálogo mundial.

## Decisión de arquitectura en curso (giro 360)

Se está migrando de "vehículo = formulario de ~200 campos" (JSON string en
`Vehicle.specifications`) a "vehículo = conjunto de hechos con fuente y confianza":

- `AttributeDefinition` (153 filas seed) — registro de atributos: aplicabilidad por tren
  motriz (`appliesTo`), dirección (`higher/lower_better`), dimensión de cobertura, rangos
  físicos de validación, disponibilidad en CO. **Agregar un campo = insertar una fila.**
- `VehicleAttribute` — un hecho por fila: `valueNum/Text/Bool` + `confidence` +
  `sourceTier` (1 fabricante CO, 2 prensa, 3 comunidad) + `sourceUrl` + verificación humana.
  Índice `(attributeKey, valueNum)` → filtrar por spec en SQL.
- Cobertura por vehículo (`coverageGlobal`, `coverageByDimension`): distingue *faltante*
  de *no aplicable* (un EV sin cilindraje NO está incompleto). Regla de producto: ningún
  puntaje se muestra con cobertura de dimensión < 0.6 (`MIN_DIMENSION_COVERAGE`).
- `specifications` (JSON) queda como respaldo de solo lectura. NO borrarla aún.

Archivos clave nuevos:
- `lib/attributes/registry.ts` — el registro (keys = paths reales del JSON, ej. `combustion.maxTorque`)
- `lib/attributes/coverage.ts` — cálculo de cobertura
- `lib/comparison/cohorts.ts` — cohortes + percentiles winsorizados (ver abajo)
- `scripts/migrate-attributes.ts` — migración idempotente JSON→filas (dry-run por defecto, `--write` para aplicar)
- `scripts/seed-colombia.ts` — bandas de precio H2-2026 + percepción de 30 marcas CO

## Motor de comparación (el "problema del Bugatti")

Nunca comparar contra el catálogo completo. `lib/comparison/cohorts.ts`:
- Cohorte = (tipo carrocería × banda de precio vigente × fuelType), relajación progresiva
  si < 8 miembros (banda adyacente → trenes afines → segmentos afines → solo segmento).
  Cada relajación se registra y `descriptionEs` se muestra al usuario.
- Puntaje = percentil winsorizado p5/p95 dentro de la cohorte, invertido si
  `lower_better`. Muestra < 3 → no se puntúa. Probado: outlier de 1500HP mueve un p32 a p30.
- `PriceBand` con vigencia (`validTo: null` = activa). Recalibrar cada semestre con
  `seed-colombia.ts`, jamás editar en caliente ni hardcodear.
- `BrandPerception` (brand_perception_co): prestigio / confiabilidad / repuestos como ejes
  INDEPENDIENTES, curados a mano. Es criterio editorial, no fórmula.

## Estado (actualizado 28-jul-2026)

**Hecho el 27-jul:** bugs de búsqueda (`sanitizeWhereClause`, doors/seats 500,
case-sensitive, url trending, paginación), schema Prisma +4 modelos, registro,
cobertura, migración, seeds, motor de cohortes.

**Hecho el 28-jul:**
- **Fase 0 seguridad COMPLETA en código:** `lib/api-auth.ts` (`requireUser`/`requireAdmin`,
  rol releído de BD por petición) aplicado a leads (GET/PUT/DELETE + export), escrituras de
  vehicles/dealers/trending/upload. `/api/test/create-vehicle` eliminada. `JWT_SECRET` sin
  fallback (lanza si falta). Contraseña admin fuera del bundle (estaba en `useAdmin.ts` Y
  `AdminQuickAccess.tsx`); admin = `User.role`. `lib/admin-fetch.ts` inyecta el Bearer en
  las 14 llamadas del panel. `scripts/set-admin.js` otorga el rol. `.env.example` creado.
- **Scoring determinístico (backlog #2) HECHO:** `lib/ai/deterministic.ts` — router de
  perfiles es-CO (regex+diccionario, 10 perfiles) × percentiles winsorizados sobre el set
  de candidatos (importa la matemática pura de `cohorts.ts`, sin BD). `results.ts` ordena
  antes del rerank; el LLM recibe `det_score` real y la instrucción de respetarlo; el
  fallback usa el score real (murió el fake 90-85-80). Tests: `scripts/verify-scoring.ts`
  (11 checks, npx tsx). Cuando `VehicleAttribute` tenga datos, cambiar la fuente, no la fórmula.
- **Sistema de movimiento (parte del #6):** tokens `--motion-*` + `--wise-glow` en
  `globals.css`, glow reactivo al cursor (`.card-glow`, rAF, solo opacity), cascada
  `card-enter` con stagger 40ms (prop `index` en `VehicleCard`, pasada desde las 4 grillas),
  `AnimatedNumber` (viewport + ease-out, usado en precio de la ficha),
  `prefers-reduced-motion` global.

**28-jul tarde — BD NUEVA + INGESTA CON IA (backlog #5) FUNCIONANDO:**
- La BD anterior se perdió; hay Neon nuevo (`ep-morning-snow-axszv58y`, us-east-2) ya
  configurado en `.env`/`.env.local` con `JWT_SECRET` generado. Schema aplicado, 156
  definiciones + bandas + percepción sembradas. Falta replicar env vars en Vercel.
- Cuenta admin: adminwise@wisemotors.co con contraseña temporal (la tiene el equipo
  del 28-jul) — CAMBIARLA. El rol vive en User.role.
- **Pipeline de ingesta** (`lib/ingest/`): identidad canónica → fuentes por tier
  (prensa CO con búsqueda WordPress + Wikipedia + dominios de fabricante en
  `sources.ts`) → fetch educado (robots.txt, cache, UA de navegador porque los WAF
  bloquean UAs "Bot" con 403) → extracción function-calling CONTRA EL REGISTRO con
  cita textual obligatoria → reconciliación por tier con conflictos >10% marcados →
  validación física → precio de fuente o ESTIMADO con razonamiento (decisión de
  producto 28-jul: estimar se permite, marcado + aprobación humana; nunca supera 0.6
  de confianza). UI en `/admin/ingest` (`IngestStudio.tsx`): aceptar/rechazar/editar
  campo por campo, ver fuente/cita/alternativas, publicar.
- Publicación (`/api/admin/ingest/publish`): crea Vehicle + VehicleAttribute
  (verifiedBy = revisor) + specifications JSON compatible + cobertura calculada.
  Rechaza duplicados exactos con 409.
- **Probado E2E por la UI real:** Corolla Cross 2025 ingestado (25 hechos, 5
  conflictos detectados — mezcla de versiones híbrida/gasolina —, precio $133M de
  Autos de Primera) → publicado → la búsqueda "una SUV para la familia que no gaste
  mucho" lo devuelve #1 con razones. Scoring determinístico + rerank funcionando.
- Pendiente de ingesta v2: fotos (Cloudinary), asociar concesionario, cola de
  auditoría, `maxDuration: 60` puede quedar corto en Vercel para 6 fuentes (~45s local).

## Backlog en orden (del plan, secciones 8-9)

1. **Fase 0 — SEGURIDAD (pospuesta por decisión del usuario, pero es LEGALMENTE urgente):**
   `GET /api/whatsapp-leads` es PÚBLICO (datos personales, Ley 1581); contraseña admin
   hardcodeada en `hooks/useAdmin.ts` (`'OlartePedroNico'` en el bundle); 14 de 15 rutas
   API sin auth server-side (el patrón correcto ya existe en `/api/favorites`);
   `JWT_SECRET` con fallback inseguro; `/api/upload` y `/api/test/create-vehicle` abiertos.
2. Scoring determinístico: `lib/ai/scoring.ts` devuelve `det_score: 0` — el ranking
   depende 100% del LLM. Sustituir por Σ(percentil_cohorte × peso_perfil × confianza)
   usando `scoreVehicleInCohort`. El LLM pasa a ser explicador (top 30 → razones), no ranking.
3. UI de comparación: barras divergentes contra la MEDIANA de la cohorte
   (`cohortMedian` ya viene en `AttributeScore`), estado "no comparable" de primera clase
   (nunca un guion ni un cero), advertencia si se comparan gamas distintas.
4. Índices Colombia (plan §4): Índice Altura (derrateo ~1%/100m atmosféricos, turbos casi
   inmunes, EVs inmunes — Bogotá 2640m = -26%), Índice Palmas, Índice Hueco, Costo Real
   de Tenencia 5 años (parámetros SIEMPRE en tabla con vigencia, verificar normativa).
5. Ingesta con IA (plan §5): identidad canónica → fuentes por tier → extracción con
   function calling CONTRA EL REGISTRO (el LLM no inventa campos) → reconciliación
   multi-fuente → validación física (`expectedMin/Max`) → publicar + cola de auditoría.
   Regla dura: precio COP y versiones solo de tier 1; NUNCA estimar un precio.
6. Rediseño visual (plan §7): tarjetas de catálogo con aspect-ratio fijo que muestran los
   3 atributos más relevantes A LA BÚSQUEDA del usuario (`cardEligible` en el registro);
   ficha = bento de empaquetado adaptativo (módulo sin datos NO existe, no deja hueco);
   View Transitions catálogo↔ficha; solo animar transform/opacity; dark editorial con
   morado `#881cb7` como luz, no como relleno.

## Convenciones y trampas del repo

- `AddVehicleForm.tsx` (63KB) y `EditVehicleForm.tsx` (77KB) son los formularios de 200
  campos: van a morir con la ingesta IA; no invertir esfuerzo en ellos.
- Tres taxonomías incoherentes conviven: `lib/constants.ts` (inglés), schema Zod
  (español: `Gasolina`, `Sedán`...), `lib/types.ts`. **La canónica es la del schema Zod /
  BD** — el registro nuevo (`FT` en `lib/attributes/registry.ts`) ya la usa. Unificar hacia ella.
- `getMarketStats()` en `lib/ai/features.ts` trae TODO el catálogo por búsqueda, sin
  caché — cuello de botella conocido.
- Sin tests. Cualquier trabajo en `lib/ai/` o `lib/attributes/` debería estrenar los primeros.
- Docs viejos engañosos: `BUSQUEDA_OBJETIVA_CAMPOS.md` describe código que ya no existe.
- Deploy Vercel `iad1`, funciones `maxDuration: 30s`. Env vars: `DATABASE_URL`,
  `JWT_SECRET`, `OPENAI_API_KEY`, `CLOUDINARY_*`, `NEXT_PUBLIC_APP_URL`.
- Stakeholder que da feedback: Olarte. Público objetivo: compradores NO expertos —
  el copy nunca asume conocimiento técnico.
