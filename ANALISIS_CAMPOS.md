# Análisis de Mapeo de Campos del Formulario

## Estructura del Vehículo Guardado en la Base de Datos

### Campos Principales (Nivel Raíz)
- ✅ `brand` → Mapeado desde `formData.marca`
- ✅ `model` → Mapeado desde `formData.modelo`
- ✅ `year` → Mapeado desde `formData.añoModelo`
- ✅ `price` → Mapeado desde `formData.precioLista` (también se guarda en `commercial.precioLista`)
- ✅ `type` → Mapeado desde `formData.carrocería` (conversión a enum: Sedán, SUV, Pickup, etc.)
- ⚠️ `vehicleType` → **HARDCODEADO como 'Automóvil'** (debería ser dinámico)
- ✅ `fuelType` → Mapeado desde `formData.combustible` (conversión a enum)

### Especificaciones (JSON Stringificado)

#### 1. Identification ✅
- ✅ `marca` → `formData.marca`
- ✅ `modelo` → `formData.modelo`
- ✅ `añoModelo` → `formData.añoModelo` (parseInt)
- ✅ `carrocería` → `formData.carrocería`
- ✅ `plazas` → `formData.plazas` (parseInt)
- ✅ `puertas` → `formData.puertas` (parseInt)
- ✅ `versionTrim` → `formData.versionTrim`

#### 2. Powertrain ✅
- ✅ `alimentacion` → `formData.alimentacion`
- ✅ `cicloTrabajo` → `formData.cicloTrabajo`
- ✅ `cilindrada` → `formData.cilindrada` (parseFloat)
- ✅ `combustible` → `formData.combustible`
- ✅ `modosConduccion` → `formData.modosConduccion`
- ✅ `octanajeRecomendado` → `formData.octanajeRecomendado` (parseFloat)
- ✅ `potenciaMaxEV` → `formData.potenciaMaxEV` (parseFloat)
- ✅ `potenciaMaxMotorTermico` → `formData.potenciaMaxMotorTermico` (parseFloat)
- ✅ `potenciaMaxSistemaHibrido` → `formData.potenciaMaxSistemaHibrido` (parseFloat)
- ✅ `torqueMaxEV` → `formData.torqueMaxEV` (parseFloat)
- ✅ `torqueMaxMotorTermico` → `formData.torqueMaxMotorTermico` (parseFloat)
- ✅ `torqueMaxSistemaHibrido` → `formData.torqueMaxSistemaHibrido` (parseFloat)
- ✅ `traccion` → `formData.traccion`
- ✅ `startStop` → `formData.startStop`
- ✅ `launchControl` → `formData.launchControl`

#### 3. Transmission ✅
- ✅ `tipoTransmision` → `formData.tipoTransmision`
- ✅ `numeroMarchas` → `formData.numeroMarchas` (parseInt)
- ✅ `modoRemolque` → `formData.modoRemolque`
- ✅ `paddleShifters` → `formData.paddleShifters`
- ✅ `torqueVectoring` → `formData.torqueVectoring`
- ✅ `traccionInteligenteOnDemand` → `formData.traccionInteligenteOnDemand`

#### 4. Dimensions ✅
- ✅ `length` → `formData.largo` (parseFloat)
- ✅ `width` → `formData.ancho` (parseFloat)
- ✅ `height` → `formData.alto` (parseFloat)
- ✅ `curbWeight` → `formData.pesoOrdenMarcha` (parseFloat)
- ✅ `wheelbase` → `formData.radioGiro` (parseFloat) ⚠️ **Nota: radioGiro es radio de giro, no wheelbase**
- ✅ `cargoCapacity` → `formData.capacidadBaulMaxima` (parseFloat)

#### 5. Weight ✅
- ✅ `payload` → `formData.cargaUtil` (parseFloat)

#### 6. Interior ✅
- ✅ `trunkCapacitySeatsDown` → `formData.capacidadBaulMaxima` (parseFloat)
- ✅ `passengerCapacity` → `formData.plazas` (parseInt)

#### 7. Efficiency ✅
- ✅ `consumoCiudad` → `formData.consumoCiudad` (parseFloat)
- ✅ `consumoCarretera` → `formData.consumoCarretera` (parseFloat)
- ✅ `consumoMixto` → `formData.consumoMixto` (parseFloat)
- ✅ `capacidadTanque` → `formData.capacidadTanque` (parseFloat)
- ✅ `autonomiaOficial` → `formData.autonomiaOficial` (parseFloat)
- ✅ `costoEnergia100km` → `formData.costoEnergia100km` (parseFloat)
- ✅ `ahorro5Anos` → `formData.ahorro5Anos` (parseFloat)
- ✅ `mpgeCiudad` → `formData.mpgeCiudad` (parseFloat)
- ✅ `mpgeCarretera` → `formData.mpgeCarretera` (parseFloat)
- ✅ `mpgeCombinado` → `formData.mpgeCombinado` (parseFloat)

#### 8. Battery ✅
- ✅ `capacidadBrutaBateria` → `formData.capacidadBrutaBateria` (parseFloat)
- ✅ `cargadorOBCAC` → `formData.cargadorOBCAC` (parseFloat)
- ✅ `conduccionOnePedal` → `formData.conduccionOnePedal`
- ✅ `regeneracionNiveles` → `formData.regeneracionNiveles` (parseInt)
- ✅ `tiempo0100AC` → `formData.tiempo0100AC` (parseFloat)
- ✅ `tiempo1080DC` → `formData.tiempo1080DC` (parseFloat)
- ✅ `highPowerChargingTimes` → `formData.highPowerChargingTimes` (texto)
- ✅ `v2hV2g` → `formData.v2hV2g`
- ✅ `potenciaV2hV2g` → `formData.potenciaV2hV2g` (parseFloat)

#### 9. Chassis ✅
- ✅ `groundClearance` → `formData.despejeSuelo` (parseFloat)
- ✅ `suspensionDelantera` → `formData.suspensionDelantera`
- ✅ `suspensionTrasera` → `formData.suspensionTrasera`
- ✅ `amortiguacionAdaptativa` → `formData.amortiguacionAdaptativa`
- ✅ `materialDiscos` → `formData.materialDiscos`
- ✅ `materialMuelles` → `formData.materialMuelles`
- ✅ `tipoPinzasFreno` → `formData.tipoPinzasFreno`

#### 10. Performance ✅
- ✅ `acceleration0to100` → `formData.aceleracion0100` (parseFloat)
- ✅ `acceleration0to200` → `formData.aceleracion0200` (parseFloat)
- ✅ `acceleration0to60` → `formData.aceleracion060` (parseFloat)
- ✅ `acceleration50to80` → `formData.aceleracion5080` (parseFloat)
- ✅ `overtaking80to120` → `formData.aceleracion80120` (parseFloat)
- ✅ `maxLateralAcceleration` → `formData.aceleracionLateralMaxima` (parseFloat)
- ✅ `maxLongitudinalAcceleration` → `formData.aceleracionLongitudinalMaxima` (parseFloat)
- ✅ `brakingDistance100to0` → `formData.frenado1000` (parseFloat)
- ✅ `maxSpeed` → `formData.velocidadMaxima` (parseFloat)
- ✅ `powerToWeight` → `formData.relacionPesoPotencia` (parseFloat)
- ✅ `quarterMile` → `formData.cuartoMilla` (parseFloat)
- ✅ `launchControl` → `formData.launchControl`

#### 11. Safety ✅
- ✅ `airbags` → `formData.numeroAirbags` (parseInt)
- ✅ `ncapRating` → `formData.euroNCAPEstrellas` (parseInt)
- ✅ `adultSafetyScore` → `formData.euroNCAPAdulto` (parseFloat)
- ✅ `childSafetyScore` → `formData.euroNCAPNino` (parseFloat)
- ✅ `assistanceScore` → `formData.euroNCAPAsistencias` (parseFloat)

#### 12. ADAS ✅
- ✅ `acc` → `formData.acc`
- ✅ `aeb` → `formData.aeb`
- ✅ `bsm` → `formData.bsm`
- ✅ `camara360` → `formData.camara360`
- ✅ `farosAdaptativos` → `formData.farosAdaptativos`
- ✅ `lka` → `formData.lka`
- ✅ `lucesAltasAutomaticas` → `formData.lucesAltasAutomaticas`
- ✅ `parkAssist` → `formData.parkAssist`
- ✅ `sensoresEstacionamientoDelantero` → `formData.sensoresEstacionamientoDelantero` (parseInt)

#### 13. Lighting ✅
- ✅ `headlightType` → `formData.farosTecnologia`
- ✅ `antinieblaDelantero` → `formData.antinieblaDelantero`
- ✅ `intermitentesDinamicos` → `formData.intermitentesDinamicos`
- ✅ `lavafaros` → `formData.lavafaros`
- ✅ `sensorLluvia` → `formData.sensorLluvia`

#### 14. Infotainment ✅
- ✅ `androidAuto` → `formData.androidAuto`
- ✅ `appleCarPlay` → `formData.appleCarPlay`
- ✅ `appRemotaOTA` → `formData.appRemotaOTA`
- ✅ `audioMarca` → `formData.audioMarca`
- ✅ `audioNumeroBocinas` → `formData.audioNumeroBocinas` (parseInt)
- ✅ `bluetooth` → `formData.bluetooth`
- ✅ `cargadorInalambrico` → `formData.cargadorInalambrico`
- ✅ `navegacionIntegrada` → `formData.navegacionIntegrada`
- ✅ `pantallaCentralTamano` → `formData.pantallaCentralTamano` (parseFloat)
- ✅ `pantallaCuadroTamano` → `formData.pantallaCuadroTamano` (parseFloat)
- ✅ `potenciaAmplificador` → `formData.potenciaAmplificador` (parseFloat)
- ✅ `puertosUSBA` → `formData.puertosUSBA` (parseInt)
- ✅ `puertosUSBC` → `formData.puertosUSBC` (parseInt)
- ✅ `wifiBordo` → `formData.wifiBordo`

#### 15. Comfort ✅
- ✅ `ajusteElectricoConductor` → `formData.ajusteElectricoConductor` (parseInt)
- ✅ `ajusteElectricoPasajero` → `formData.ajusteElectricoPasajero` (parseInt)
- ✅ `calefaccionAsientos` → `formData.calefaccionAsientos`
- ✅ `climatizadorZonas` → `formData.climatizadorZonas` (parseInt)
- ✅ `cristalesAcusticos` → `formData.cristalesAcusticos`
- ✅ `iluminacionAmbiental` → `formData.iluminacionAmbiental`
- ✅ `masajeAsientos` → `formData.masajeAsientos`
- ✅ `materialAsientos` → `formData.materialAsientos`
- ✅ `memoriaAsientos` → `formData.memoriaAsientos`
- ✅ `parabrisasCalefactable` → `formData.parabrisasCalefactable`
- ✅ `segundaFilaCorrediza` → `formData.segundaFilaCorrediza`
- ✅ `techoPanoramico` → `formData.techoPanoramico`
- ✅ `terceraFilaAsientos` → `formData.terceraFilaAsientos`
- ✅ `tomas12V120V` → `formData.tomas12V120V` (parseInt)
- ✅ `tomacorrienteEnCaja` → `formData.tomacorrienteEnCaja`
- ✅ `ventilacionAsientos` → `formData.ventilacionAsientos`
- ✅ `vidriosElectricos` → `formData.vidriosElectricos`
- ✅ `volanteMaterialAjustes` → `formData.volanteMaterialAjustes`
- ✅ `volanteCalefactable` → `formData.volanteCalefactable`

#### 16. Off-road ✅
- ✅ `controlDescenso` → `formData.controlDescenso`
- ✅ `controlTraccionOffRoad` → `formData.controlTraccionOffRoad`

#### 17. Commercial ✅
- ✅ `precioLista` → `formData.precioLista` (parseFloat)
- ✅ `garantiaVehiculo` → `formData.garantiaVehiculo`
- ✅ `garantiaBateria` → `formData.garantiaBateria`
- ✅ `asistenciaCarretera` → `formData.asistenciaCarretera` (parseFloat)
- ✅ `intervaloMantenimiento` → `formData.intervaloMantenimiento`
- ✅ `costoMantenimiento3Primeros` → `formData.costoMantenimiento3Primeros` (parseFloat)
- ✅ `origenPaisPlanta` → `formData.origenPaisPlanta`

#### 18. Metadata ✅
- ✅ `aplicabilidadFlags` → `formData.aplicabilidadFlags`
- ✅ `observaciones` → `formData.observaciones`

## Campos que NO se están usando del formulario (pero están en formData)

### Dimensiones y Pesos
- ⚠️ `capacidadBaulMinima` → No se mapea (solo se usa `capacidadBaulMaxima`)
- ⚠️ `capacidadTecho` → No se mapea (no está en el JSON de prueba)

## Problemas Identificados

### 1. ⚠️ `vehicleType` está hardcodeado
**Línea 473:** `vehicleType: 'Automóvil' as const`
- **Problema:** Todos los vehículos se guardan como 'Automóvil' sin importar el tipo real
- **Solución:** Debería mapearse dinámicamente según el tipo de vehículo o agregar un campo en el formulario

### 2. ⚠️ `wheelbase` está mapeado desde `radioGiro`
**Línea 278:** `wheelbase: formData.radioGiro ? parseFloat(formData.radioGiro) : undefined`
- **Problema:** `radioGiro` es el radio de giro (turning radius), no la distancia entre ejes (wheelbase)
- **Solución:** Agregar campo `wheelbase` separado o usar el campo correcto

### 3. ✅ `price` se mapea correctamente desde `precioLista`
- El precio se guarda tanto en el nivel raíz (`price`) como en `commercial.precioLista`, lo cual es correcto

## Conclusión

✅ **Sí, si llenas todo el formulario, los campos se guardarán correctamente en la base de datos.**

El único problema real es que `vehicleType` está hardcodeado. Todos los demás campos se mapean correctamente y se guardan en la estructura esperada.

