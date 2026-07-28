# WiseMotors — Plan de Rediseño 360°

**Versión 1.0 · 27 de julio de 2026**
Roles asumidos: diseñador de producto web · experto en mercado automotor colombiano · consultor de negocio
Base: código real en `main` (commit `fd29e20`) + datos de mercado Colombia H1-2026

---

## 0. Resumen ejecutivo

El proyecto no se estancó por falta de esfuerzo. Se estancó por **una decisión estructural tomada al principio**: modelar el vehículo como un formulario de ~200 campos fijos. Todo lo que les dio pereza —los campos que solo aplican a eléctricos, los que en Colombia nadie publica, las tarjetas que quedan largas o cortas, la comparación que no tiene sentido— es una consecuencia matemática de esa decisión, no una serie de problemas independientes.

**La tesis del rediseño es una sola:**

> Un vehículo no es un formulario con huecos. Es un **conjunto de hechos observados**, cada uno con fuente, fecha y nivel de confianza. La ficha, la comparación, el ranking y el diseño se **generan** desde los hechos que existen, en lugar de asumir un molde que casi ningún carro llena.

De ahí se desprende todo:

| Dolor actual | Causa raíz | Solución estructural |
|---|---|---|
| "Hay campos que solo tienen unos carros" | Formulario fijo | Registro de atributos con **cobertura** medida |
| "Hay campos que en Colombia no se encuentran" | Sin noción de disponibilidad regional | Atributos con **dominio de aplicabilidad** (CO / global) |
| "Hay campos solo eléctricos / solo gasolina" | Bloques `electric`, `combustion`, `hybrid`, `phev` paralelos | Atributos con **precondición de tren motriz** |
| "Los carros no se comparan uno a uno" | Comparación 1:1 global | **Cohortes** + comparación contra la mediana, no contra el rival |
| "Un Corolla no puede estar en 50% por culpa de un Bugatti" | Normalización min-max sobre catálogo completo | **Percentil dentro de cohorte**, winsorizado, calibrado a Colombia |
| "El diseño cambia según cuántos campos hay" | Layout dictado por el contenido | **Bento de empaquetado adaptativo** con slots de span fijo |
| "Subir un carro es un suplicio" | `AddVehicleForm` de 63 KB con 200 campos | **Ingesta por IA** con auditoría posterior |
| "Nos aburrimos" | Ninguna de las anteriores era arreglable de a una | Este documento |

El diferenciador comercial no va a ser el catálogo (Tucarro y Mercado Libre ganan en volumen y siempre van a ganar). Va a ser **el criterio**: índices propios que solo tienen sentido en Colombia —el Índice Hueco, el derrateo por altura de Bogotá, el costo real de tenencia en pesos, la realidad de conseguir un repuesto— más una voz editorial que opine. Eso no lo scrapea nadie y es lo que hace que un comprador que no sabe de carros confíe.

---

## 1. Diagnóstico honesto

### 1.1 Lo que sí está bien y hay que conservar

No es un rebuild desde cero, y eso es una buena noticia. Sobrevive:

- **La tesis de producto.** Búsqueda en lenguaje natural para gente que no sabe de carros. Sigue siendo correcta y sigue sin estar bien resuelta en Colombia.
- **El stack.** Next.js 14 + Prisma + PostgreSQL + Vercel es exactamente lo adecuado para esto. Cambiarlo sería quemar meses sin ganar nada.
- **WiseMetrics.** 20 puntajes curados a mano son el activo más valioso del repo. Hoy están mal aprovechados (alimentan un radar bonito y poco más), pero son la materia prima de todo el motor nuevo.
- **`wiseCategories`.** Etiquetas coloquiales ("pa subir rápido") inyectadas al prompt del reranker. Es curaduría humana dentro de la IA y es una idea buena que hay que industrializar, no botar.
- **El modelo de negocio.** Leads a WhatsApp con concesionario asociado. Simple, medible, y ya funciona.
- **La identidad.** El morado `#881cb7` funciona y da personalidad. Se conserva y se profundiza.

### 1.2 Lo que hay que apagar antes de tocar nada más

Esto no es parte del rediseño, es una precondición. Del análisis del código, **de 15 rutas API solo `/api/favorites` valida token**:

1. **`GET /api/whatsapp-leads` es público.** Devuelve nombre, email, teléfono y mensaje de todos los leads sin autenticación. Además del riesgo comercial evidente (un competidor descarga la base entera), es exposición de datos personales bajo la **Ley 1581 de 2012**. Esto es responsabilidad legal, no deuda técnica.
2. **Contraseña de admin hardcodeada en el bundle del cliente** (`hooks/useAdmin.ts`). Cualquiera con DevTools entra al panel.
3. **Los endpoints de escritura no validan nada en el servidor.** `AdminGuard` es un componente de React; un `curl` crea vehículos, reescribe el trending y modifica leads.
4. **`JWT_SECRET` con fallback `'your-secret-key'`**. Si falta la variable en producción, la app arranca igual y cualquiera firma tokens válidos.
5. **`POST /api/upload` sin auth** y **`/api/test/create-vehicle`** expuesto en producción.

Nada de lo demás importa si esto sigue así. Va en Fase 0, semana 1.

### 1.3 Los tres bugs que están saboteando el producto en silencio

Vale la pena nombrarlos porque explican parte del desánimo — la IA parecía peor de lo que era:

- **Los filtros de features nunca se aplican.** `buildObjectiveWhereClause()` construye un `where.AND` para buscar "4x4", "Turbo", "Sunroof" dentro del JSON, pero ni `processObjectiveQuery` ni `processHybridQuery` copian `AND` al `where` final. Buscar "camioneta 4x4" devuelve **todas** las camionetas. El filtro se descarta sin error.
- **`doors`, `seats` y `transmission` no son columnas de Prisma.** Si el LLM extrae `door_count`, llega a `findMany` y lanza excepción → 500 en la búsqueda. Uno se ignora en silencio, el otro rompe.
- **El ranking depende 100% del LLM.** `scoring.ts` devuelve `det_score: 0`. No hay reproducibilidad: la misma consulta puede dar órdenes distintos, y no hay forma de explicar por qué un carro quedó de primero.

El tercero es el grave. **Un motor de recomendación que no puede explicarse a sí mismo no genera confianza y no se puede mejorar.**

---

## 2. Nueva arquitectura de datos: del formulario al registro

### 2.1 El Registro de Atributos (`attribute_definitions`)

Hoy, agregar un campo significa tocar `lib/schemas/vehicle.ts` + `AddVehicleForm` (63 KB) + `EditVehicleForm` (77 KB) + `VehicleSpecsBento` (34 KB). Cuatro archivos gigantes. Por eso duele.

Después: **agregar un campo es insertar una fila en una tabla.**

```
attribute_definitions
├─ key                  'motor.par_maximo'          (canónico, namespaced)
├─ label_es             'Torque'
├─ unit                 'Nm'
├─ data_type            numeric | enum | boolean | text | range
├─ applies_to           { powertrain: ['ICE','HEV','PHEV'], body: '*' }
├─ direction            higher_better | lower_better | neutral
├─ display_group        'Motor y desempeño'
├─ display_priority     0–100   (qué tan arriba va en la ficha)
├─ card_eligible        true    (¿puede salir en una tarjeta de catálogo?)
├─ co_availability      common | rare | never_published
├─ expected_range       { min: 60, max: 1200 }      (validación física)
├─ comparable           true    (¿tiene sentido enfrentarlo entre carros?)
└─ profile_weights      { performance: 0.8, family: 0.1, city: 0.2, … }
```

Con esto, los cuatro dolores originales dejan de ser dolores:

- **"Campos que solo tienen unos carros"** → se mide con `coverage` y se decide con reglas, no a ojo.
- **"Campos que en Colombia no se encuentran"** → `co_availability: never_published`. El scraper no los busca, la ficha no los pide, y nadie se frustra buscándolos.
- **"Campos solo eléctricos"** → `applies_to.powertrain`. Un EV nunca muestra "cilindraje" y su ficha **no queda incompleta por no tenerlo** — es que no aplica. Esa distinción entre *ausente* y *no aplicable* es la que hoy no existe y la que rompe todo.
- **"Campos que no se pueden comparar"** → `comparable: false`. El color de los cinturones no entra al motor.

### 2.2 Los hechos (`vehicle_attributes`)

```
vehicle_attributes
├─ vehicle_id
├─ attribute_key
├─ value_num / value_text / value_bool
├─ confidence        0.0–1.0
├─ source_tier       1 | 2 | 3
├─ source_url
├─ extracted_at
├─ verified_by       null | user_id      ← auditoría humana
└─ verified_at
```

Fila por hecho. Índice compuesto `(attribute_key, value_num)` → **por fin se puede filtrar por spec en SQL**, que es exactamente lo que hoy es imposible y obliga a traer el catálogo entero y parsear JSON en memoria (el cuello de botella detrás de los commits de rendimiento).

Se mantienen las columnas planas en `Vehicle` (`brand`, `model`, `year`, `price`, `type`, `fuelType`) porque están indexadas y son el 80% de los filtros. Y se añade una **vista materializada** `vehicle_flat` con los ~40 atributos de mayor cobertura desnormalizados, refrescada por trigger. Lo mejor de los dos mundos: flexibilidad total para la cola larga, velocidad de columna para lo frecuente.

### 2.3 Migración

`specifications` (el JSON de 200 campos) no se bota. Se mapea:

1. Script que recorre los ~200 paths conocidos del JSON y siembra `attribute_definitions`.
2. Script que explota cada `Vehicle.specifications` en filas de `vehicle_attributes` con `confidence: 1.0, source_tier: 1, verified_by: <admin>` — lo que ya está curado a mano es la verdad de referencia.
3. `specifications` queda como columna de respaldo durante 2 sprints, en solo lectura. Luego se archiva.

Riesgo bajo, reversible, y no hay ventana de downtime.

### 2.4 Cobertura, la métrica que hoy no existe

Para cada vehículo se calcula y se guarda:

```
coverage_global    = hechos presentes / atributos aplicables
coverage_dimension = por cada dimensión (desempeño, seguridad, confort, tecnología, costo)
```

**Regla de oro del producto: ningún número se muestra sin su cobertura.** Si la cobertura de una dimensión está por debajo del 60%, no se muestra un puntaje — se muestra *"Datos insuficientes · ayúdanos a completarlo"*. Es más honesto, evita inventar, y convierte una debilidad en una invitación.

---

## 3. El motor de comparación: cohortes, no catálogo

### 3.1 El problema del Bugatti, formalmente

Normalizar min-max sobre el catálogo completo hace que **un solo outlier aplaste toda la escala**. Si el catálogo tiene un carro de 1.500 HP, un Corolla de 170 HP queda en 11%. Peor: en Colombia ese Bugatti **no existe**, así que la escala está distorsionada por un carro que ningún usuario va a comprar jamás.

Tres correcciones, en orden:

**a) Cohortes.** Nunca se compara contra el catálogo. Se compara contra el grupo relevante:

```
cohorte = f(segmento_carrocería, banda_precio, tren_motriz)
```

con **relajación progresiva** si la cohorte queda con menos de 8 miembros: primero se abre la banda de precio a la adyacente, luego se agrupan trenes motrices afines (HEV con ICE, PHEV con BEV), y por último se agrupa el segmento. Cada relajación se registra y **se le dice al usuario**: *"Comparado contra 14 SUV compactas de $100–160 M"*. La frase misma es un feature de confianza.

**b) Percentil, no min-max.** El puntaje de un carro en un atributo es su percentil dentro de la cohorte, con winsorización en p5/p95. Un outlier deja de aplastar la escala.

**c) Techo calibrado a Colombia.** La cohorte se construye **solo con vehículos efectivamente comercializados en Colombia** (`market_availability: CO`). El techo de "potencia" en la cohorte de SUV media no es un Lamborghini Urus: es lo que realmente se puede comprar aquí. Esto por sí solo resuelve el problema que plantearon.

### 3.2 Bandas de precio para Colombia 2026

Calibradas con datos reales del mercado, no inventadas. Referencias: los 10 modelos más vendidos del país cotizan entre **$75 M y $136 M** en versión base; el más barato del mercado es el FAW Bestune Xiaoma (~$47 M) y el Renault Kwid arranca en ~$56 M; el Tesla Model Y —líder absoluto de ventas enero-abril con 4.062 unidades— parte de **$119,99 M**.

| Banda | Rango (COP) | Referencia mental colombiana |
|---|---|---|
| **Entrada** | < $75 M | Kwid, Xiaoma, Onix base |
| **Popular** | $75 – 115 M | Picanto, Onix, K3, Duster |
| **Media** | $115 – 170 M | Model Y base, Corolla Cross, Sportage, Tucson |
| **Media-alta** | $170 – 250 M | RAV4 híbrida full, Corolla Cross HEV tope, CX-5 tope |
| **Premium** | $250 – 450 M | Prado, Mercedes GLA/Clase C, BMW Serie 3, X1 |
| **Lujo** | > $450 M | Clase E/S, X5, Range Rover, Porsche |

> Estas bandas deben recalibrarse **cada semestre** contra el catálogo real, no quedar hardcodeadas. Se guardan en una tabla `price_bands` con vigencia, no en `constants.ts`.

### 3.3 Prestigio, calibrado localmente

Este es el punto más fino de lo que plantearon: *"un Mercedes es un carro muy de lujo, un Corolla es casi gama alta"*. Eso **no se deriva del precio global**. Es percepción social local y hay que codificarla a mano.

Se crea `brand_perception_co`, curado por ustedes, con tres ejes independientes:

| Marca | Prestigio (0–100) | Confiabilidad percibida | Facilidad de repuestos CO |
|---|---|---|---|
| Mercedes-Benz | 95 | 65 | 35 |
| BMW | 92 | 62 | 38 |
| Toyota | 72 | 98 | 92 |
| Mazda | 68 | 88 | 85 |
| Kia | 58 | 82 | 95 |
| Renault | 45 | 70 | 98 |
| Chevrolet | 48 | 72 | 96 |
| BYD / marcas chinas | 42 | 65 | 55 |
| Tesla | 88 | 70 | 40 |

*(Valores ilustrativos — la tabla real la definen ustedes con el criterio editorial de la casa. Lo importante es que sea **una tabla curada y no una fórmula**, y que tenga tres ejes en vez de uno.)*

Que un Mercedes saque 95 en prestigio y 35 en repuestos es exactamente la clase de matiz que hace útil el producto en Colombia y que un marketplace genérico jamás va a mostrar.

### 3.4 Cómo se muestra una comparación

Tres reglas de diseño que resuelven el problema de raíz:

1. **Contra la mediana, no contra el rival.** Barras divergentes desde el centro (la mediana de la cohorte). Cada carro se muestra como desviación. Dos carros con datos distintos se pueden poner lado a lado sin que la ausencia de un dato "gane" la comparación.
2. **"No comparable" es un estado de primera clase.** Si un carro tiene el dato y el otro no, la fila se marca visualmente como *no comparable*, con la fuente y el motivo. Nunca un guion, nunca un cero, nunca un espacio vacío. Un cero implícito es una mentira.
3. **Comparaciones de distinta gama se permiten, pero se advierten.** Si alguien enfrenta un Picanto contra un Prado, se muestra: *"Estos carros no compiten entre sí. Aquí va lo que sí es útil comparar: costo de tenencia, tamaño y consumo."* La app tiene criterio y lo dice. Eso genera más confianza que negarse.

---

## 4. Índices propios Colombia — el diferenciador real

Aquí es donde el producto deja de ser un catálogo y se vuelve WiseMotors. Cada índice se calcula desde atributos + tabla curada, y **cada uno se muestra con su explicación en una frase**.

### 4.1 Índice Altura (derrateo por altitud) — el más innovador

Un motor atmosférico pierde aproximadamente **1% de potencia por cada 100 m sobre el nivel del mar**. Un turbo compensa casi todo. Un eléctrico no pierde nada.

| Ciudad | Altitud | Pérdida aprox. motor atmosférico |
|---|---|---|
| Bogotá | 2.640 m | ~26% |
| Medellín | 1.495 m | ~15% |
| Cali | 1.018 m | ~10% |
| Barranquilla | 5 m | ~0% |

**Un Corolla atmosférico de 170 HP entrega ~126 HP en Bogotá. Un eléctrico de 170 HP entrega 170 HP.** Ese dato es brutal, es verdad, es relevantísimo para el comprador colombiano y **nadie en el mercado lo está mostrando**. Debería ser un módulo destacado de la ficha, con selector de ciudad.

Este solo módulo justifica una nota de prensa.

### 4.2 Índice Palmas (subida en pendiente y altura)

Potencia-a-peso **corregida por derrateo**, más torque disponible a bajas revoluciones, más comportamiento de la transmisión. Premia híbridos y eléctricos (torque instantáneo), penaliza atmosféricos pequeños sobrecargados. Nombrado con el referente que ya usan en los prompts.

### 4.3 Índice Hueco

Recorrido de suspensión + despeje al piso + **perfil de llanta** (una llanta perfil 40 en Medellín es una sentencia) + rigidez estructural. Un indicador de "¿este carro sobrevive a una vía colombiana?".

### 4.4 Costo Real de Tenencia (CRT) a 5 años, en pesos

El número que todo comprador quiere y nadie le da:

```
CRT = depreciación estimada
    + impuesto vehicular × 5      (por avalúo, tarifa según banda)
    + SOAT × 5
    + seguro todo riesgo × 5      (varía fuerte por marca y riesgo de hurto)
    + combustible/energía × km_año × 5
    + mantenimientos de tabla     (según cronograma oficial de la marca)
```

Aquí los eléctricos brillan por incentivos reales de la **Ley 1964 de 2019** (tarifa reducida de impuesto vehicular, descuento en SOAT, exención de pico y placa) y por el diferencial de precio kWh vs. galón. Un EV que cuesta más de entrada puede salir más barato a 5 años, y mostrarlo en pesos convence más que cualquier argumento ambiental.

> ⚠️ Los porcentajes y montos exactos de impuesto, SOAT y exenciones deben verificarse con la normativa vigente al momento de implementar y **actualizarse cada año**. El motor debe leerlos de una tabla de parámetros con vigencia, nunca hardcodeados.

### 4.5 Los demás índices de la familia

| Índice | Qué mide | Por qué importa en Colombia |
|---|---|---|
| **Repuestos** | Cobertura de red + tiempo de consecución + costo de un espejo | Un Mercedes varado 3 semanas esperando una pieza es la historia real |
| **Reventa** | Retención de valor a 3 años en el mercado local | Toyota y Mazda ganan; es un argumento de compra durísimo |
| **Trancón** | Consumo real en congestión, start-stop, modo eléctrico | Bogotá y Medellín son trancón, no autopista |
| **Pico y Placa** | Días de circulación según ciudad y tren motriz | Un EV exento vale días de vida recuperados |
| **Parqueadero** | Dimensiones vs. parqueaderos típicos de edificios | Una camioneta grande no cabe en muchos edificios de El Poblado |
| **Finca / Trocha** | 4x4, despeje, ángulos de ataque, reductora | Uso real de fin de semana en Antioquia |
| **Familiar** | Anclajes ISOFIX, espacio segunda fila, baúl con coche | El caso de uso que más leads convierte |

Cada índice se calcula **solo si tiene cobertura suficiente**. Si no, se muestra bloqueado con "faltan N datos". Nunca se rellena con supuestos.

### 4.6 La capa editorial — la opinión que pidieron

Datos hay en todas partes. **Criterio no.** Cada vehículo lleva:

- **El Veredicto Wise** — 3 frases con voz propia, firmadas. Sin diplomacia de agencia.
- **Para quién sí / Para quién no** — dos listas cortas. La segunda es la que genera confianza.
- **Lo que no te van a decir en el concesionario** — el campo que la gente va a compartir por WhatsApp.
- **El competidor incómodo** — "si estás mirando esto, mira también X, cuesta lo mismo y…".
- **`wiseCategories` industrializado** — hoy es texto libre. Se vuelve una taxonomía curada de ~40 etiquetas coloquiales con sinónimos, alimentando búsqueda y filtros. "Pa subir rápido", "aguanta hueco", "primer carro", "pa la finca", "no lo compres si vives en Bogotá".

Nada de esto lo genera la IA sola. La IA propone un borrador desde los datos; **una persona lo aprueba y lo firma**. Es lento a propósito: es el activo defendible.

---

## 5. Ingesta con IA: subir un carro en 3 minutos

Modo elegido: **automático con auditoría posterior.** Publica de una, marca lo dudoso, deja cola de revisión.

### 5.1 El flujo

```
Admin escribe: "Toyota Tahoe 2026"   (o pega una URL)
   │
   ├─ 1. RESOLUCIÓN DE IDENTIDAD
   │     Marca/modelo/año/versiones canónicas. Detecta duplicados y nombres
   │     comerciales distintos del mismo carro (Corolla Cross ≠ Corolla).
   │
   ├─ 2. DESCUBRIMIENTO DE FUENTES  (por tiers)
   │     T1 · Fabricante Colombia   toyota.com.co, kia.com.co, renault.com.co
   │     T2 · Fabricante global + prensa especializada CO
   │          (El Carro Colombiano, Autos de Primera, Motor, El Tiempo Motor)
   │     T3 · Blogs, foros, YouTube → solo para huecos, siempre baja confianza
   │
   ├─ 3. EXTRACCIÓN ESTRUCTURADA
   │     Function calling contra el Registro de Atributos. El LLM NO inventa
   │     campos: recibe el catálogo de atributos aplicables al tren motriz
   │     detectado y solo puede llenar esos. Devuelve valor + cita textual + URL.
   │
   ├─ 4. RECONCILIACIÓN MULTI-FUENTE
   │     Votación ponderada por tier. Discrepancia > 10% entre fuentes
   │     → confianza baja + bandera de conflicto (se guardan ambas versiones).
   │
   ├─ 5. VALIDACIÓN FÍSICA
   │     · Rango esperado por atributo (expected_range)
   │     · Coherencia cruzada: potencia vs cilindraje, autonomía vs kWh,
   │       peso vs segmento, 0-100 vs relación peso/potencia
   │     · Unidades: HP vs kW, Nm vs kgf·m, L/100km vs km/L
   │       ← esta es la fuente #1 de basura silenciosa en scraping automotor
   │
   ├─ 6. ESCRITURA
   │     Cada hecho con confidence, source_tier, source_url, extracted_at.
   │
   └─ 7. PUBLICACIÓN + COLA DE AUDITORÍA
         Sale al aire. Los campos de baja confianza salen marcados.
         La cola se prioriza por (impacto_en_ranking × baja_confianza).
```

### 5.2 Reglas duras, no negociables

- **El precio en COP y las versiones disponibles en Colombia solo se aceptan de T1.** Si no hay fuente T1, el precio queda vacío. **Nunca se estima un precio.** Un precio inventado es un lead perdido y una llamada furiosa de un concesionario.
- **Todo hecho de T3 sale visualmente marcado** en la ficha pública ("dato de la comunidad, sin verificar").
- **Badge de verificación:** *"Ficha verificada por WiseMotors"* solo cuando cobertura ≥ 80% y ningún hecho crítico está sin verificar. Es una promesa al usuario y una meta interna para el equipo.
- **Cumplimiento:** respetar `robots.txt`, no scrapear detrás de login o paywall, atribuir la fuente visiblemente, cachear agresivo para no golpear los sitios. Un scraper abusivo es una demanda esperando ocurrir.

### 5.3 Costos

Presupuesto por vehículo: ~15–25 llamadas LLM. Con modelos económicos para extracción y el modelo grande solo para reconciliación y redacción del borrador editorial, el costo por ficha completa debería quedar en el orden de **centavos de dólar**. Caché agresivo por `(modelo, año)` — la ingesta de la versión GLS y la GLX de un mismo carro comparte el 90% de las fuentes.

**Meta medible:** pasar de ~45 minutos de digitación manual por vehículo a **menos de 5 minutos de revisión**. Ese solo número es el que devuelve las ganas de trabajar en el proyecto.

---

## 6. Búsqueda IA v2

### 6.1 Arreglar lo roto

Con el Registro de Atributos, los bugs 7 y 8 desaparecen por construcción: el LLM ya no extrae claves arbitrarias, extrae **claves del registro**, que existen como filas indexadas. `where.doors` ya no puede reventar Prisma porque `doors` es un `attribute_key` válido con su índice.

### 6.2 Recuperación híbrida

```
consulta
  ├─ Router determinístico (regex + diccionario)   → marca, año, precio, ciudad
  ├─ LLM extractor                                  → intención, restricciones blandas, perfil
  │
  ├─ Recuperación A: SQL sobre columnas indexadas + vehicle_attributes
  ├─ Recuperación B: pgvector sobre el "perfil narrativo" del carro
  │                  (párrafo generado que describe el carro en lenguaje humano)
  │
  ├─ Fusión (RRF) → top 30
  ├─ SCORING DETERMINÍSTICO  ← esto es lo que hoy devuelve 0
  │     score = Σ (percentil_en_cohorte × peso_del_perfil × confianza_del_dato)
  │     Reproducible, explicable, auditable, gratis.
  └─ Rerank LLM sobre top 30 → ordena los primeros 12 y escribe las razones
```

El cambio de fondo: **el LLM deja de ser el ranking y pasa a ser el explicador.** El orden lo pone una fórmula que ustedes controlan y pueden depurar. El LLM aporta el matiz y las 3 razones en lenguaje natural. Si OpenAI se cae o se pone caro, el producto **sigue funcionando** con resultados correctos y sin explicaciones — degradación real, no la ficción actual del `createFallbackRecommendations` que inventa 90-85-80.

### 6.3 Aprendizaje del uso

Log de `consulta → resultados mostrados → clic → lead`. A los 3 meses hay señal suficiente para ajustar los pesos de perfil con datos reales en vez de intuición. Es la diferencia entre un motor que envejece bien y uno que hay que retocar a mano para siempre.

---

## 7. Diseño: el sistema que resuelve el problema de las tarjetas

### 7.1 Dirección visual

**"Editorial oscuro con acento eléctrico".** Fondo profundo casi-negro con temperatura púrpura, tipografía grande y confiada, el morado `#881cb7` usado como luz —bordes que brillan, gradientes de malla, glow detrás del carro— no como relleno de botones. Referencias de ambición: la ficha de producto de Tesla, la editorial de Polestar, la densidad informativa de Linear.

El objetivo emocional: **que abrir una ficha se sienta como abrir una revista de carros bien hecha, no como consultar una base de datos.**

### 7.2 La solución al problema del layout variable

Este era el dolor más concreto. La respuesta es dejar de dejar que el contenido dicte la forma:

**a) Tarjetas de catálogo: altura fija, contenido variable.**
Toda tarjeta tiene `aspect-ratio` fijo. La variabilidad no va en el tamaño — va en **qué** se muestra adentro. Y aquí está el truco bueno: la tarjeta muestra los **3 atributos más relevantes para la búsqueda que el usuario acaba de hacer**. Si buscó "pa subir a Palmas", la tarjeta muestra torque, peso e Índice Palmas. Si buscó "económico", muestra consumo, CRT a 5 años e impuesto. Nunca hay huecos porque siempre hay 3 datos que llenar, y la tarjeta se vuelve **contextual**, que es 10× mejor producto que una tarjeta fija.

**b) Ficha: Bento de empaquetado adaptativo.**
Los módulos declaran spans posibles (`1×1`, `2×1`, `2×2`, `3×1`) y una prioridad. Un algoritmo de empaquetado (greedy con backtracking corto) llena la grilla eligiendo el span de cada módulo según cobertura:

- Módulo con datos ricos → toma `2×2` con gráfica.
- Módulo con 2 datos → toma `1×1` compacto.
- Módulo sin datos → **no existe**, no deja hueco.

Resultado: **un carro con 40 datos y uno con 190 se ven ambos completos e intencionales.** La grilla nunca queda coja. Esto es lo que hace que dejar de llenar 200 campos deje de doler.

**c) Un módulo especial: "Completa esta ficha".**
Si la cobertura es baja, el hueco se llena con un módulo que invita al usuario a aportar el dato o al admin a verificarlo. La carencia se vuelve interacción.

### 7.3 Sistema de movimiento

Ya tienen `motion` (Framer Motion) instalado. Se formaliza:

| Token | Duración | Uso |
|---|---|---|
| `instant` | 120 ms | Hover, focus, feedback táctil |
| `quick` | 240 ms | Aparición de elementos, tooltips |
| `smooth` | 400 ms | Transiciones de sección |
| `hero` | 700 ms | Entrada de la ficha, revelaciones |

Piezas concretas:

- **View Transitions API** entre catálogo y ficha: la tarjeta **se expande** en la ficha, la imagen del carro no parpadea. Es el momento "wow" más barato de implementar y el de mayor impacto percibido.
- **Búsqueda del hero**: al enviar, el input se eleva y los resultados entran en cascada (stagger de 40 ms). Que se sienta que la IA *pensó*, no que la página recargó.
- **Contadores animados** en cada spec numérico al entrar en viewport.
- **Radar y barras que se dibujan** progresivamente en comparación.
- **Scroll-driven animations** con CSS nativo (`animation-timeline: view()`) — cero JavaScript, cero costo de rendimiento.
- **Glow reactivo al cursor** en las tarjetas premium.

**Presupuesto de rendimiento, no negociable:** solo se animan `transform` y `opacity` (nunca `width`, `height`, `top`). LCP < 2,5 s en 4G. `prefers-reduced-motion` respetado en todo. Una animación que cuesta medio segundo de carga es una animación que resta.

### 7.4 Accesibilidad y realidad colombiana

Contraste AA mínimo, navegación por teclado completa, y **probar en gama media Android sobre 4G**, no solo en el MacBook. Buena parte del tráfico de compradores de carro en Colombia va a llegar por celular y por datos.

---

## 8. Roadmap — equipo de 3, ~20 semanas

**Roles:** **P** = Plataforma/datos · **F** = Frontend/diseño · **I** = IA/producto

### Fase 0 · Blindaje (Semanas 1–2) — **bloqueante**

| # | Tarea | Rol |
|---|---|---|
| 0.1 | Middleware de auth server-side en las 14 rutas desprotegidas | P |
| 0.2 | Migrar admin a `User.role`; borrar la contraseña del bundle | P |
| 0.3 | `JWT_SECRET` obligatorio, la app falla al arrancar si no está | P |
| 0.4 | Eliminar `/api/test/create-vehicle`; auth en `/api/upload` | P |
| 0.5 | Corregir bugs 7, 8, 9 (filtros descartados, 500, case-sensitive) | I |
| 0.6 | Limpiar raíz del repo, `.env.example`, logs fuera de producción | P |

*Sale con:* la app deja de ser una responsabilidad legal y la búsqueda deja de mentir.

### Fase 1 · Cimientos de datos (Semanas 2–6)

| # | Tarea | Rol |
|---|---|---|
| 1.1 | Diseñar e implementar `attribute_definitions` (~250 atributos) | P + I |
| 1.2 | `vehicle_attributes` + índices + vista materializada `vehicle_flat` | P |
| 1.3 | Migración desde `specifications` con verificación humana | P |
| 1.4 | Unificar las 3 taxonomías incoherentes en una fuente de verdad | P |
| 1.5 | Cálculo de cobertura global y por dimensión | I |
| 1.6 | Caché de `getMarketStats()` (hoy trae el catálogo entero por búsqueda) | P |
| 1.7 | Tabla `price_bands` + `brand_perception_co` curada | I |
| 1.8 | **Primeros tests automatizados** — el repo no tiene ninguno | P |

*Sale con:* se puede filtrar por spec en SQL. Agregar un campo es una fila.

### Fase 2 · Ingesta con IA (Semanas 5–10)

| # | Tarea | Rol |
|---|---|---|
| 2.1 | Resolución de identidad canónica + registro de fuentes por tier | I |
| 2.2 | Extractor con function calling contra el registro | I |
| 2.3 | Reconciliación multi-fuente + validación física y de unidades | I |
| 2.4 | Publicación automática + cola de auditoría priorizada | P + F |
| 2.5 | Admin nuevo: de formulario de 200 campos a revisión de diffs | F |
| 2.6 | **Prueba de fuego: cargar 30 modelos 2026 y medir precisión** | I |

*Sale con:* un carro nuevo entra en < 5 min. El formulario de 77 KB muere.

### Fase 3 · Motor de comparación e índices (Semanas 7–13)

| # | Tarea | Rol |
|---|---|---|
| 3.1 | Cohortes + relajación progresiva + explicación al usuario | I |
| 3.2 | Percentiles winsorizados sustituyendo min-max global | I |
| 3.3 | Scoring determinístico (matar el `det_score: 0`) | I |
| 3.4 | Índice Altura + Índice Palmas + Índice Hueco | I |
| 3.5 | Costo Real de Tenencia a 5 años (tabla de parámetros con vigencia) | I + P |
| 3.6 | Índices Repuestos, Reventa, Trancón, Pico y Placa, Parqueadero | I |
| 3.7 | UI de comparación divergente + estado "no comparable" | F |

*Sale con:* la comparación por fin tiene sentido y es defendible frente a un experto.

### Fase 4 · Rediseño y animaciones (Semanas 9–16)

| # | Tarea | Rol |
|---|---|---|
| 4.1 | Design system: tokens, tipografía, dark mode expuesto | F |
| 4.2 | Sistema de movimiento + presupuesto de rendimiento | F |
| 4.3 | Tarjetas de catálogo contextuales (3 atributos según consulta) | F + I |
| 4.4 | **Bento de empaquetado adaptativo** para la ficha | F |
| 4.5 | View Transitions catálogo ↔ ficha | F |
| 4.6 | Home nuevo: hero, búsqueda animada, resultados en cascada | F |
| 4.7 | Auditoría móvil real: gama media Android sobre 4G | F |

*Sale con:* el producto se ve como lo que cobra, y el layout deja de romperse.

### Fase 5 · Búsqueda v2 y capa editorial (Semanas 14–20)

| # | Tarea | Rol |
|---|---|---|
| 5.1 | pgvector + perfiles narrativos + recuperación híbrida | I |
| 5.2 | Rerank LLM sobre top 30 con razones citando datos reales | I |
| 5.3 | `wiseCategories` como taxonomía curada con sinónimos | I |
| 5.4 | Veredicto Wise, Para quién sí/no, El competidor incómodo | I + F |
| 5.5 | Logging consulta→clic→lead y panel de calidad de búsqueda | P |
| 5.6 | Landing por índice (SEO: "mejores carros para Bogotá", "para huecos") | F |

*Sale con:* el motor es explicable, el producto tiene voz, y hay SEO defendible.

### Paralelización

Fase 0 es secuencial y bloquea todo. Después:

```
S1  S2  S3  S4  S5  S6  S7  S8  S9 S10 S11 S12 S13 S14 S15 S16 S17 S18 S19 S20
[F0 ]
    [———— Fase 1: datos (P) ————]
                [———— Fase 2: ingesta (I) ————]
                        [———— Fase 3: motor (I) ————]
                            [————— Fase 4: diseño (F) —————]
                                                    [—— Fase 5: búsqueda ——]
```

**F** puede arrancar el design system en la semana 3 sin esperar los datos, trabajando contra datos falsos. Es la mejor forma de que el equipo vea progreso visible temprano, que es justamente lo que faltó la vez pasada.

---

## 9. Métricas de éxito

No "quedó bonito". Números:

| Métrica | Hoy (estimado) | Meta a 20 semanas |
|---|---|---|
| Tiempo de alta de un vehículo | ~45 min | **< 5 min** |
| Cobertura media de atributos por ficha | ? (sin medir) | **> 75%** |
| Fichas con badge "Verificado" | 0 | **> 60% del catálogo** |
| Rutas API sin autenticación | 14 de 15 | **0** |
| Reproducibilidad del ranking | 0% (todo LLM) | **100% del orden base** |
| Leads WhatsApp / 100 visitas a ficha | *medir ya* | **+40%** |
| LCP móvil 4G | *medir ya* | **< 2,5 s** |
| Cobertura de tests | 0% | **> 40% en `lib/ai` y `lib/data`** |

Las dos que dicen *"medir ya"* hay que instrumentarlas en la semana 1. **No se puede mejorar un número que no existe**, y el resultado comercial del rediseño se va a juzgar por leads por visita, no por lo bonito que quedó.

---

## 10. Riesgos y cómo se mitigan

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| **La IA publica datos falsos y un concesionario se molesta** | Alta | Precio solo de T1; badge de verificación; cola de auditoría priorizada; botón "reportar dato" visible en cada ficha |
| **La migración de `specifications` pierde curaduría** | Media | Migración con doble escritura y `specifications` en solo lectura 2 sprints; script de diff que compara ambos mundos |
| **Alcance se desborda y vuelve el aburrimiento** | **Alta** | Fases con entregable visible cada 2–3 semanas; regla: nada nuevo entra sin sacar algo |
| **Costo de OpenAI se dispara con el scraping** | Media | Presupuesto por vehículo; caché por `(modelo, año)`; modelo económico para extracción; alerta de gasto diario |
| **Bloqueo de fuentes por scraping agresivo** | Media | `robots.txt`, rate limiting, caché, atribución visible, user-agent identificable |
| **Las animaciones matan el rendimiento móvil** | Media | Presupuesto de performance como criterio de aceptación de cada PR, no como revisión final |
| **Los índices propios quedan mal calibrados y pierden credibilidad** | Media | Validar los 3 primeros índices con 2–3 expertos automotrices reales antes de publicarlos |

---

## 11. La decisión que hay que tomar hoy

Todo lo anterior depende de una sola cosa: **aceptar que la ficha completa es un mito.**

Ningún carro va a tener 200 campos. Nunca. Ni con IA, ni con scraping, ni contratando gente. El plan entero está construido sobre la idea contraria: **un carro con 40 datos bien elegidos, bien comparados y bien explicados vale más que uno con 190 campos a medio llenar.** El diseño se adapta, la comparación reconoce lo que no sabe, y la ficha se ve completa porque nunca prometió más de lo que tiene.

Eso es lo que hace que el proyecto vuelva a ser divertido: dejar de perseguir una casilla vacía y empezar a construir criterio.

---

## Fuentes de mercado consultadas

- [Ventas de carros nuevos en Colombia en los primeros cinco meses de 2026 — Infobae](https://www.infobae.com/colombia/2026/06/03/el-mercado-de-carros-nuevos-en-colombia-subio-48-en-los-primeros-cinco-meses-de-2026-estas-son-las-marcas-mas-vendidas/)
- [Kia, Renault y Toyota, reyes del primer semestre 2026 — La República](https://www.larepublica.co/empresas/venta-de-carros-primer-semestre-2026-4426476)
- [Venta de vehículos eléctricos e híbridos: 69.082 unidades en el primer semestre 2026 — Autos de Primera](https://autosdeprimera.com/cifras-del-mercado/nacional/venta-de-vehiculos-electricos-e-hibridos-registraron-69-082-unidades-en-colombia-en-el-primer-semestre-de-2026/)
- [Híbridos y eléctricos superan el 40% de los vehículos nuevos matriculados en 2026 — Diario Financiero](https://www.df.cl/df-sud/hibridos-y-electricos-ya-representan-mas-del-40-de-los-vehiculos-nuevos)
- [Precios de los carros más vendidos en Colombia, abril 2026 — Infobae](https://www.infobae.com/colombia/2026/05/07/estos-son-los-precios-de-los-carros-mas-vendidos-en-colombia-durante-abril-de-2026-hay-modelos-desde-los-75-millones/)
- [Los 10 carros más baratos de Colombia en 2026 — El Carro Colombiano](https://www.elcarrocolombiano.com/resenas/10-carros-mas-baratos-colombia-2026-lista-precios/)
- [Los 75 carros más vendidos de Colombia en mayo de 2026 — El Carro Colombiano](https://www.elcarrocolombiano.com/industria/75-carros-mas-vendidos-colombia-mayo-2026-ranking/)

*Contexto técnico interno: `contexto-wisemotors.md`, commit `fd29e20`.*
