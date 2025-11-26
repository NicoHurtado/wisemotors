# Scripts de Utilidad

## create-sample-vehicle.js

Script para crear un vehículo de ejemplo con todos los campos llenos para pruebas.

### Uso

#### Opción 1: Usando npm script (recomendado)
```bash
npm run create-sample-vehicle
```

#### Opción 2: Con variables de entorno
```bash
DEALER_ID=tu-dealer-id npm run create-sample-vehicle
```

#### Opción 3: Ejecutar directamente
```bash
node scripts/create-sample-vehicle.js
```

### Variables de entorno

- `API_URL`: URL de la API (por defecto: `http://localhost:3000`)
- `DEALER_ID`: ID del concesionario (requerido si no hay concesionarios en la BD)

### Requisitos

1. El servidor debe estar ejecutándose (`npm run dev`)
2. Debe existir al menos un concesionario en la base de datos
3. Node.js 18+ (tiene fetch nativo) o instalar `node-fetch`

### Ejemplo de uso

```bash
# 1. Asegúrate de que el servidor esté corriendo
npm run dev

# 2. En otra terminal, ejecuta el script
npm run create-sample-vehicle

# O con un dealerId específico
DEALER_ID=clxxxxx npm run create-sample-vehicle
```

### Características

- ✅ Genera datos realistas para todos los campos
- ✅ Incluye todas las especificaciones (motor, transmisión, dimensiones, seguridad, etc.)
- ✅ Soporta diferentes tipos de vehículos (Eléctrico, Híbrido, Combustión)
- ✅ Obtiene automáticamente el dealerId si no está configurado
- ✅ Validación de datos antes de enviar
- ✅ Mensajes de error descriptivos

### Datos generados

El script genera un vehículo con:
- Identificación completa
- Motorización y transmisión
- Dimensiones y pesos
- Consumo y eficiencia
- Prestaciones
- Seguridad (Euro NCAP, Latin NCAP)
- ADAS
- Batería y carga (para EV/Híbridos)
- Chasis y frenos
- Iluminación
- Conectividad e infoentretenimiento
- Confort e interior
- Información comercial








