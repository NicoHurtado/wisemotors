# WiseMotors — Brief de diseño "Estudio" (sept-2026)

Reemplaza el look anterior (liquid glass + arena de videojuego). Se conserva el
morado de marca `#881cb7`; todo lo demás se rediseña.

## 1. Qué dicen las referencias

| Ref | Qué tomamos | Qué NO tomamos |
|---|---|---|
| **LaFerrari** (split rojo/negro) | Hero partido: un bloque de color de marca + negro. Palabra gigante condensada DETRÁS del carro, el carro la pisa. Fila de datos: etiqueta gris pequeña / valor blanco grande. CTA con corte en diagonal. | El rojo. |
| **Porsche "Presentation"** | Estudio: fondo gris claro con degradado de luz, piso con reflejo, carro recortado que se sale del cuadro. Tipografía grande y LIGERA (300). Un solo acento luminoso (sus rines azules → nuestro morado). Casi nada de interfaz. | El hebreo. |
| **Carzone** | Catálogo: tarjetas grandes gris claro, radio ~28px, carro al centro, nombre fuerte + combustible pequeño, precio + botón círculo ↗, fila de 3 datos con divisores verticales. Tarjeta activa inclinada, con tinte de color y el nombre del modelo gigante como marca de agua. Filtros: pastillas (llena = activa), histograma de precios con rango, checkboxes de marca. | El verde. |
| **Car Sell Center (Mercedes)** | Ficha: marca enorme en negrita + modelo en gris. Navegación en pastillas (activa en negro). Categorías verticales a la izquierda que cambian puntos de interés SOBRE el carro (hotspots con etiqueta en pastilla). Logo gigante tenue detrás. Tarjetas de dato con ícono en círculo y cifra enorme ("503 hp", "3.7 sec"). | Las sombras planas por defecto. |
| **Nexwash** | Editorial: titular grotesco apretado, en dos tonos (gris + negro: "Más que *un carro*"). Etiquetas pequeñas en monoespaciada mayúscula ("(DESDE 2024)"). Líneas de ticks tipo código de barras como divisores. Flechas ↗. Una tarjeta de acento (azul → morado) que se monta sobre la foto. Sección negra con muesca. | El tono "servicio de lavado". |

**Denominador común:** fotografía de carro como protagonista, fondos neutros
(papel gris frío o negro), UN acento saturado usado con disciplina, tipografía
grotesca apretada con cambios fuertes de peso, pastillas y botones redondos,
mucho aire, cero adornos de "juego".

## 2. Decisiones

- **Escena de uso:** gente que NO sabe de carros, mirando en celular o portátil
  de día → modo claro por defecto. Negro solo en momentos de "showroom" (hero de
  inicio, cabecera de la ficha, franja de cierre).
- **Color:**
  - papel `#f1f0f3` · tarjeta `#e8e7eb` · blanco `#fbfbfc`
  - tinta `#0e0c11` · texto 2 `#5f5b66` · línea `#d9d7de`
  - morado `#881cb7` (acento, luz) · morado profundo `#3b0d55` (bloques) · lila `#d8b4fe` (reflejos)
  - showroom `#0c0a0f`
  - Sin verde, sin azul. El morado nunca como degradado de texto.
- **Tipografía (self-hosted, fontsource):**
  - `Inter Tight` — todo: titulares 600–700 con tracking −0.035em, cuerpo 400, titulares ligeros 300 (estilo Porsche).
  - `Anton` — SOLO la palabra gigante detrás de un carro (LaFerrari).
  - `JetBrains Mono` — cifras, unidades y etiquetas-metadato en mayúscula (Nexwash).
- **Logo:** marca cuadrada redondeada morada con una "W" de dos trazos en V que
  se cruzan como una curva de carretera + palabra `wisemotors` en Inter Tight 700.
- **Carros:** foto recortada cuando existe; si no, render SVG de estudio por
  carrocería (sedán, hatchback, SUV, pickup) con pintura en degradado, vidrio con
  reflejo, rines con aro morado y sombra de piso. Nunca un ícono.
- **Componentes:** pastillas (nav, filtros, categorías), botón círculo ↗,
  tarjeta Carzone, fila de datos con divisores, líneas de ticks, hotspots,
  tarjetas de dato con cifra enorme, marca de agua tipográfica.

## 3. Movimiento (momentos, no efectos sueltos)

1. **Entrada del hero:** la palabra gigante sube letra por letra con máscara
   (clip-path), el carro entra de lado desenfocado → nítido (filter: blur) y se
   posa con una sombra que crece.
2. **Tarjetas del catálogo:** inclinación 3D que sigue al cursor + tinte morado
   + nombre del modelo gigante apareciendo detrás (Carzone).
3. **Ficha:** al cambiar de categoría, los hotspots se reubican con resorte;
   las cifras cuentan hacia arriba al entrar en pantalla.
4. **Comparador:** los dos carros se enfrentan en el piso del estudio; las
   barras divergen desde el centro dato por dato.
5. **Scroll:** titulares que se revelan con máscara; marquesina de marcas.
Todo respeta `prefers-reduced-motion` y parte de un estado ya visible.

## 4. Rúbrica del evaluador (1–10)

1. Fidelidad al lenguaje de las referencias (sección 1).
2. Jerarquía tipográfica y uso del espacio.
3. Disciplina de color (morado como acento, sin verde ni azul).
4. Protagonismo del carro (foto/render de calidad, nunca íconos).
5. Movimiento con intención.
6. Coherencia entre páginas (inicio, catálogo, ficha, comparador, login).
7. Calidad percibida vs sitios automotrices modernos (Porsche, Polestar, Rivian, Carzone).
8. Legibilidad para no expertos (copy claro, datos traducidos).

Criterio de salida: promedio ≥ 8.1.
