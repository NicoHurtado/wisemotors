# Búsqueda Objetiva - Campos Soportados

## ¿Por qué "híbrido" funciona?

El campo `fuelType` funciona porque:
1. Es una **columna directa** en la tabla `Vehicle` de la base de datos
2. Se filtra **directamente en SQL** usando Prisma: `WHERE fuelType IN ('Híbrido', 'Híbrido Enchufable')`
3. La normalización mapea "híbrido" → ["Híbrido", "Híbrido Enchufable"]
4. Es **rápido y eficiente** porque usa índices de la base de datos

## Campos que Funcionan en Búsqueda Objetiva

### ✅ Campos Directos (Filtrados en SQL - RÁPIDOS)

Estos campos están en la tabla `Vehicle` y se filtran directamente en la consulta SQL:

| Campo | Tipo | Ejemplo | Estado |
|-------|------|---------|--------|
| `brand` | String | "Toyota", "Mazda" | ✅ Funciona |
| `type` | String | "SUV", "Pickup", "Sedán" | ✅ Funciona |
| `fuelType` | String | "Gasolina", "Diesel", "Eléctrico", "Híbrido", "Híbrido Enchufable" | ✅ Funciona |
| `price` | Number | Rango: min 30M, max 50M | ✅ Funciona |
| `year` | Number | Rango: min 2020, max 2024 | ✅ Funciona |

**Código:** `wisemotors/lib/ai/results.ts` - función `buildObjectiveWhereClause()`

### ✅ Campos en Specifications (Filtrados en Memoria - MÁS LENTOS)

Estos campos están dentro del JSON `specifications` y se filtran después de obtener los vehículos:

#### Performance
- `performance.acceleration0to100` - Aceleración 0-100 km/h (segundos)
- `performance.acceleration0to200` - Aceleración 0-200 km/h (segundos)
- `performance.maxSpeed` - Velocidad máxima (km/h)
- `performance.quarterMile` - Cuarto de milla (segundos)
- `performance.powerToWeight` - Potencia/peso
- `performance.launchControl` - Control de lanzamiento (boolean)

#### Motor/Combustión
- `combustion.maxPower` - Potencia máxima (HP)
- `combustion.maxTorque` - Torque máximo (Nm)
- `combustion.displacement` - Cilindraje (cc)
- `combustion.turbo` - Turbo (boolean)
- `combustion.fuelTankCapacity` - Capacidad tanque (litros)
- `combustion.cityConsumption` - Consumo ciudad (L/100km)
- `combustion.highwayConsumption` - Consumo carretera (L/100km)

#### Híbrido/Eléctrico
- `hybrid.maxPower` - Potencia máxima híbrida
- `hybrid.maxTorque` - Torque máximo híbrido
- `electric.batteryCapacity` - Capacidad batería (kWh)
- `electric.electricRange` - Autonomía eléctrica (km)
- `phev.electricRange` - Autonomía PHEV (km)

#### Dimensiones
- `dimensions.length` - Largo (mm)
- `dimensions.width` - Ancho (mm)
- `dimensions.height` - Altura (mm)
- `dimensions.curbWeight` - Peso en vacío (kg)
- `dimensions.wheelbase` - Distancia entre ejes (mm)
- `dimensions.cargoCapacity` - Capacidad de carga (litros)

#### Seguridad
- `safety.airbags` - Número de airbags
- `safety.ncapRating` - Calificación NCAP
- `safety.stabilityControl` - Control de estabilidad (boolean)
- `safety.tractionControl` - Control de tracción (boolean)
- `safety.autonomousEmergencyBraking` - Frenado de emergencia (boolean)

#### Confort
- `comfort.airConditioning` - Aire acondicionado (boolean)
- `comfort.automaticClimateControl` - Control climático automático (boolean)
- `comfort.heatedSeats` - Asientos calefaccionados (boolean)
- `comfort.ventilatedSeats` - Asientos ventilados (boolean)
- `comfort.massageSeats` - Asientos con masaje (boolean)

#### Tecnología
- `technology.bluetooth` - Bluetooth (boolean)
- `technology.touchscreen` - Pantalla táctil (boolean)
- `technology.navigation` - Navegación (boolean)
- `technology.smartphoneIntegration` - Integración smartphone (boolean)
- `technology.wirelessCharger` - Cargador inalámbrico (boolean)

#### Chasis
- `chassis.groundClearance` - Altura libre (mm)
- `chassis.brakingDistance100to0` - Distancia frenado 100-0 (metros)
- `chassis.maxLateralAcceleration` - Aceleración lateral máxima (g)
- `chassis.suspensionSetup` - Configuración suspensión

#### Interior
- `interior.trunkCapacitySeatsDown` - Capacidad maletero asientos abajo (litros)
- `interior.seatRows` - Filas de asientos
- `interior.passengerCapacity` - Capacidad de pasajeros

#### Peso/Carga
- `weight.payload` - Carga útil (kg)
- `weight.cargoBoxVolume` - Volumen caja de carga (litros)
- `weight.towingCapacity` - Capacidad remolque (kg)

#### Iluminación
- `lighting.headlightType` - Tipo de faros
- `lighting.automaticHighBeam` - Luz alta automática (boolean)

#### Asistencia
- `assistance.brakeAssist` - Asistente de frenado (boolean)
- `assistance.reverseCamera` - Cámara reversa (boolean)
- `assistance.hillStartAssist` - Asistente arranque en pendiente (boolean)
- `assistance.parkingSensors` - Sensores de estacionamiento (boolean)
- `assistance.cameras360` - Cámaras 360° (boolean)

**Código:** `wisemotors/lib/ai/results.ts` - función `evaluateTechnicalFilter()`

### ❌ Campos NO Implementados (Aunque Existen en el Schema)

Estos campos están definidos en el schema de `CategorizedIntent` pero **NO se filtran**:

| Campo | Tipo | Estado | Nota |
|-------|------|--------|------|
| `door_count` | Number | ❌ No implementado | Está en el schema pero no se usa |
| `seat_count` | Number | ❌ No implementado | Está en el schema pero no se usa |
| `transmissions` | Array[String] | ❌ No implementado | Está en el schema pero no se usa |
| `features` | Array[String] | ❌ No implementado | Está en el schema pero no se usa |

**Ubicación del TODO:** `wisemotors/lib/ai/results.ts` línea 828:
```typescript
// TODO: Add support for doors, seats, features when database schema supports it
```

## Flujo de Ejecución

### Paso 1: Filtros SQL (Rápidos)
```typescript
// 1. Normaliza valores de la IA a valores de la BD
normalizedFuelTypes = await normalizeFuelTypes(["híbrido"])
// Resultado: ["Híbrido", "Híbrido Enchufable"]

// 2. Crea WHERE clause de Prisma
where.fuelType = { in: ["Híbrido", "Híbrido Enchufable"] }
where.brand = { in: ["Toyota"] }
where.price = { gte: 30000000, lte: 50000000 }

// 3. Ejecuta consulta SQL directa
vehicles = await prisma.vehicle.findMany({ where })
// SQL: SELECT * FROM vehicles 
//      WHERE fuelType IN ('Híbrido', 'Híbrido Enchufable') 
//      AND brand = 'Toyota' 
//      AND price >= 30000000 AND price <= 50000000
```

### Paso 2: Filtros Técnicos (En Memoria)
```typescript
// 4. Para cada vehículo obtenido, parsea el JSON de specifications
for (vehicle of vehicles) {
  specs = JSON.parse(vehicle.specifications)
  
  // 5. Evalúa filtros técnicos
  if (specs.combustion?.maxPower > 300) {
    // Incluir vehículo
  }
}
```

## Operadores Soportados para Campos Técnicos

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `equals` | Igual a | `turbo = true` |
| `greater_than` | Mayor que | `maxPower > 300` |
| `less_than` | Menor que | `acceleration0to100 < 5` |
| `greater_equal` | Mayor o igual | `year >= 2020` |
| `less_equal` | Menor o igual | `price <= 50000000` |
| `contains` | Contiene (strings) | `headlightType contains "LED"` |

## Ejemplos de Búsquedas Objetivas

### ✅ Funcionan (Campos Directos)
- "quiero un carro híbrido" → `fuelType: ["Híbrido", "Híbrido Enchufable"]`
- "quiero un Toyota" → `brand: ["Toyota"]`
- "quiero un SUV" → `type: ["SUV"]`
- "quiero un carro menos de 50 millones" → `price: { max: 50000000 }`
- "quiero un carro del 2020 en adelante" → `year: { min: 2020 }`

### ✅ Funcionan (Campos Técnicos)
- "quiero un carro 0-100 en menos de 5 segundos" → `performance.acceleration0to100 < 5`
- "quiero un carro con turbo" → `combustion.turbo = true`
- "quiero un carro más de 300 HP" → `combustion.maxPower > 300`
- "quiero un carro tanque mayor a 50 litros" → `combustion.fuelTankCapacity > 50`
- "quiero un carro peso menor a 1500 kg" → `dimensions.curbWeight < 1500`

### ❌ NO Funcionan (No Implementados)
- "quiero un carro 4 puertas" → `door_count: 4` (no implementado)
- "quiero un carro 7 asientos" → `seat_count: 7` (no implementado)
- "quiero un carro manual" → `transmissions: ["Manual"]` (no implementado)
- "quiero un carro con techo solar" → `features: ["techo solar"]` (no implementado)

## Mejoras Futuras

Para implementar los campos faltantes:

1. **door_count y seat_count**: Están en `specifications.interior` pero no se mapean a filtros directos
2. **transmissions**: Están en `specifications.combustion.transmissionType` pero no se filtran
3. **features**: No hay un campo estructurado en el schema actual

## Referencias

- Schema de la BD: `wisemotors/prisma/schema.prisma`
- Schema de especificaciones: `wisemotors/lib/schemas/vehicle.ts`
- Función de normalización: `wisemotors/lib/ai/results.ts` - `normalizeFuelTypes()`
- Función de filtrado: `wisemotors/lib/ai/results.ts` - `buildObjectiveWhereClause()`
- Función de evaluación técnica: `wisemotors/lib/ai/results.ts` - `evaluateTechnicalFilter()`
