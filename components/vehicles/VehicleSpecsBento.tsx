'use client';

import React from 'react';
import {
    Zap,
    BatteryCharging,
    Gauge,
    Smartphone,
    ShieldCheck,
    Car,
    Monitor,
    Wifi,
    Bluetooth,
    Cast,
    CheckCircle2,
    Maximize,
    Wind,
    Thermometer,
    Music,
    Navigation,
    Usb,
    Sun,
    Umbrella,
    DollarSign,
    Award,
    CircleDollarSign,
    Info,
    Wrench,
    Ruler,
    Fuel,
    Settings,
    Lightbulb,
    Armchair,
    Mountain
} from 'lucide-react';

// --- COMPONENTES UI REUTILIZABLES ---

const Card = ({ children, className = '', title, icon: Icon, span = 'col-span-1' }: {
    children: React.ReactNode;
    className?: string;
    title?: string;
    icon?: React.ElementType;
    span?: string;
}) => (
    <div className={`bg-white/80 backdrop-blur-sm border border-wise/10 rounded-2xl p-6 flex flex-col hover:border-wise/30 hover:shadow-lg transition-all duration-300 group ${span} ${className}`}>
        {(title || Icon) && (
            <div className="flex items-center space-x-3 mb-6">
                {Icon && (
                    <div className="p-2 bg-wise/10 rounded-lg group-hover:bg-wise/20 transition-colors">
                        <Icon className="w-5 h-5 text-wise" />
                    </div>
                )}
                {title && <h3 className="text-lg font-semibold text-gray-900 tracking-wide">{title}</h3>}
            </div>
        )}
        {children}
    </div>
);

const BigStat = ({ value, label, sub, color = 'text-gray-900' }: {
    value: string | number;
    label: string;
    sub?: string;
    color?: string;
}) => (
    <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
            <span className={`text-4xl md:text-5xl font-bold tracking-tighter ${color}`}>{value}</span>
            {sub && <span className="text-xl text-gray-500 font-medium">{sub}</span>}
        </div>
        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-1">{label}</span>
    </div>
);

const DetailRow = ({ label, value, isBool = false }: {
    label: string;
    value: string | number;
    isBool?: boolean;
}) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 hover:bg-wise/5 px-2 rounded-lg transition-colors">
        <span className="text-gray-600 text-sm">{label}</span>
        <span className={`font-medium text-right ${isBool ? 'text-wise' : 'text-gray-900'}`}>
            {value}
        </span>
    </div>
);

const IconBadge = ({ icon: Icon, label, active = true }: {
    icon: React.ElementType;
    label: string;
    active?: boolean;
}) => (
    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl hover:bg-wise/10 hover:border-wise/20 border border-transparent transition-all cursor-default group">
        <Icon className={`w-6 h-6 mb-2 ${active ? 'text-wise' : 'text-gray-400'} group-hover:scale-110 transition-transform`} />
        <span className="text-[10px] uppercase text-center text-gray-600 leading-tight font-medium">{label}</span>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

interface VehicleSpecsBentoProps {
    vehicle: any;
}

export function VehicleSpecsBento({ vehicle }: VehicleSpecsBentoProps) {
    const specs = vehicle.specifications || {};
    const powertrain = specs.powertrain || {};
    const transmission = specs.transmission || {};
    const battery = specs.battery || {};
    const dimensions = specs.dimensions || {};
    const efficiency = specs.efficiency || {};
    const performance = specs.performance || {};
    const safety = specs.safety || {};
    const adas = specs.adas || {};
    const infotainment = specs.infotainment || {};
    const comfort = specs.comfort || {};
    const lighting = specs.lighting || {};
    const chassis = specs.chassis || {};
    const identification = specs.identification || {};
    const commercial = specs.commercial || {};
    const offRoad = specs.offRoad || {};

    // Detectar tipo de vehículo
    const fuelTypeRaw = vehicle.fuelType || powertrain.combustible || '';
    const fuelTypeLower = String(fuelTypeRaw || '').toLowerCase();
    const isElectric = fuelTypeLower.includes('eléctrico') || fuelTypeLower.includes('electric');
    const isHybrid = fuelTypeLower.includes('híbrido') || fuelTypeLower.includes('hybrid');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-wise/5 text-gray-900 p-4 md:p-8 lg:p-12 font-sans selection:bg-wise/20">

            {/* HEADER */}
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-wise/20 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-wise text-white text-xs font-bold px-3 py-1 rounded-full">
                            {identification.añoModelo || vehicle.year || new Date().getFullYear()}
                        </span>
                        <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
                            {identification.carrocería || vehicle.type || 'SUV'}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900">
                        Especificaciones <span className="text-transparent bg-clip-text bg-gradient-to-r from-wise to-wise-light">Técnicas</span>
                    </h1>
                    <p className="text-gray-600 mt-2 max-w-lg">
                        {vehicle.brand} {vehicle.model} - Ficha técnica completa
                    </p>
                </div>
                {commercial.precioLista && (
                    <div className="text-right">
                        <p className="text-gray-500 text-sm uppercase tracking-widest mb-1">Precio de Lista</p>
                        <div className="text-4xl md:text-5xl font-bold text-wise">
                            ${new Intl.NumberFormat('es-CO').format(commercial.precioLista)}
                        </div>
                        {commercial.origenPaisPlanta && (
                            <p className="text-wise-light text-xs font-medium mt-1">Origen: {commercial.origenPaisPlanta}</p>
                        )}
                    </div>
                )}
            </header>

            {/* GRID PRINCIPAL */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">

                {/* --- FILA 1: MECÁNICA CORE (4 Columnas: 2 + 1 + 1) --- */}

                {/* 1. MOTORIZACIÓN */}
                <Card span="col-span-1 lg:col-span-2" title={isElectric ? "Motorización Eléctrica" : isHybrid ? "Motorización Híbrida" : "Motorización"} icon={Zap}>
                    <div className="grid grid-cols-2 gap-8 h-full items-center">
                        {isElectric ? (
                            <>
                                <BigStat
                                    value={powertrain.potenciaMaxEV || 0}
                                    sub="HP"
                                    label="Potencia Máxima (EV)"
                                    color="text-wise"
                                />
                                <BigStat
                                    value={powertrain.torqueMaxEV || 0}
                                    sub="Nm"
                                    label="Torque Instantáneo"
                                    color="text-wise"
                                />
                            </>
                        ) : (
                            <>
                                <BigStat
                                    value={powertrain.potenciaMaxMotorTermico || powertrain.potenciaMaxSistemaHibrido || 0}
                                    sub="HP"
                                    label="Potencia Máxima"
                                    color="text-wise"
                                />
                                <BigStat
                                    value={powertrain.torqueMaxMotorTermico || powertrain.torqueMaxSistemaHibrido || 0}
                                    sub="Nm"
                                    label="Torque Máximo"
                                    color="text-wise"
                                />
                            </>
                        )}
                        <div className="col-span-2 grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                            <DetailRow label="Tracción" value={transmission.traccion || 'N/A'} />
                            {isElectric || isHybrid ? (
                                <DetailRow label="Batería" value={battery.capacidadBrutaBateria ? `${battery.capacidadBrutaBateria} kWh` : 'N/A'} />
                            ) : (
                                <DetailRow label="Cilindrada" value={powertrain.cilindrada ? `${powertrain.cilindrada} L` : 'N/A'} />
                            )}
                        </div>
                    </div>
                </Card>

                {/* 2. PRESTACIONES */}
                {(performance.acceleration0to100 || performance.maxSpeed) && (
                    <Card title="Performance" icon={Gauge}>
                        {performance.acceleration0to100 && (
                            <BigStat
                                value={performance.acceleration0to100}
                                sub="s"
                                label="0-100 km/h"
                                color="text-wise-light"
                            />
                        )}
                        <div className="mt-6 space-y-2">
                            {performance.maxSpeed && <DetailRow label="Vel. Máxima" value={`${performance.maxSpeed} km/h`} />}
                            {performance.quarterMile && <DetailRow label="1/4 de milla" value={`${performance.quarterMile} s`} />}
                            {performance.acceleration50to80 && <DetailRow label="50-80 km/h" value={`${performance.acceleration50to80} s`} />}
                            {performance.overtaking80to120 && <DetailRow label="80-120 km/h" value={`${performance.overtaking80to120} s`} />}
                        </div>
                    </Card>
                )}

                {/* 3. TELEMETRÍA */}
                {(performance.maxLateralAcceleration || performance.maxLongitudinalAcceleration || performance.brakingDistance100to0) && (
                    <Card title="Telemetría" icon={Info}>
                        <div className="grid grid-cols-2 gap-2">
                            {performance.maxLateralAcceleration && (
                                <div className="bg-gray-100 p-2 rounded-lg text-center">
                                    <span className="block text-xl font-bold text-wise">{performance.maxLateralAcceleration} g</span>
                                    <span className="text-[10px] text-gray-500">Acel. Lateral</span>
                                </div>
                            )}
                            {performance.maxLongitudinalAcceleration && (
                                <div className="bg-gray-100 p-2 rounded-lg text-center">
                                    <span className="block text-xl font-bold text-wise">{performance.maxLongitudinalAcceleration} g</span>
                                    <span className="text-[10px] text-gray-500">Acel. Long.</span>
                                </div>
                            )}
                            {performance.brakingDistance100to0 && (
                                <div className="bg-gray-100 p-2 rounded-lg text-center col-span-2">
                                    <span className="block text-xl font-bold text-gray-900">{performance.brakingDistance100to0} m</span>
                                    <span className="text-[10px] text-gray-500">Frenado 160-0 km/h</span>
                                </div>
                            )}
                        </div>
                        {performance.powerToWeight && (
                            <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                                <span className="text-xs text-gray-600">Peso/Potencia: </span>
                                <span className="text-xs font-bold text-gray-900">{performance.powerToWeight} HP/ton</span>
                            </div>
                        )}
                    </Card>
                )}

                {/* --- FILA 2: EFICIENCIA Y FÍSICO (4 Columnas: 2 + 2) --- */}

                {/* 4. EFICIENCIA */}
                {(isElectric || isHybrid) && battery.capacidadBrutaBateria && (
                    <Card span="col-span-1 lg:col-span-2" title="Eficiencia y Energía" icon={BatteryCharging}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Círculo de Autonomía */}
                            <div className="flex flex-col items-center justify-center relative">
                                <div className="w-32 h-32 rounded-full border-4 border-gray-200 flex items-center justify-center relative">
                                    <div className="absolute inset-0 rounded-full border-4 border-wise border-t-transparent"></div>
                                    <div className="text-center z-10">
                                        <span className="block text-2xl font-bold text-wise">{efficiency.autonomiaOficial || 'N/A'}</span>
                                        <span className="text-xs text-gray-500 uppercase">km WLTP</span>
                                    </div>
                                </div>
                            </div>

                            {/* Datos de Carga */}
                            <div className="col-span-2 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    {efficiency.consumoMixto && (
                                        <BigStat value={efficiency.consumoMixto} sub="kWh" label="Consumo / 100km" />
                                    )}
                                    {efficiency.mpgeCombinado && (
                                        <BigStat value={efficiency.mpgeCombinado} sub="KMGe" label="Combinado" />
                                    )}
                                </div>
                                {efficiency.costoEnergia100km && (
                                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center">
                                        <span className="text-emerald-700 text-sm font-medium">Costo Energético / 100km</span>
                                        <span className="text-emerald-600 font-bold">${new Intl.NumberFormat('es-CO').format(Number(efficiency.costoEnergia100km))} COP</span>
                                    </div>
                                )}
                                <div className="flex gap-2 text-xs text-gray-600 justify-between px-1">
                                    {battery.cargadorOBCAC && <span>Cargador: {battery.cargadorOBCAC} kW AC</span>}
                                    {battery.conduccionOnePedal && <span>One-Pedal: Sí</span>}
                                    {battery.regeneracionNiveles && <span>Regen: {battery.regeneracionNiveles} Niveles</span>}
                                </div>
                                {battery.tiempo1080DC && (
                                    <div className="mt-2 text-xs text-gray-600 text-center bg-wise/5 p-2 rounded-lg">
                                        <span className="font-semibold">Carga Rápida DC:</span> {battery.tiempo1080DC} min (10-80%)
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* 5. DIMENSIONES */}
                <Card span="col-span-1 lg:col-span-2" title="Dimensiones Físicas" icon={Maximize}>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="relative w-full md:w-1/2 h-40 bg-wise/5 rounded-xl border border-dashed border-wise/30 flex items-center justify-center overflow-hidden group-hover:border-wise/50 transition-colors">
                            <Car className="w-20 h-20 text-wise/30" strokeWidth={1} />
                            {dimensions.length && <span className="absolute top-2 text-[10px] text-gray-500">Largo: {dimensions.length} mm</span>}
                            {dimensions.wheelbase && <span className="absolute bottom-2 text-[10px] text-gray-500">Dist. Ejes: {dimensions.wheelbase} mm</span>}
                            {dimensions.height && <span className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-gray-500">Alto: {dimensions.height}</span>}
                        </div>
                        <div className="w-full md:w-1/2 space-y-1">
                            {dimensions.width && <DetailRow label="Ancho" value={`${dimensions.width} mm`} />}
                            {chassis.groundClearance && <DetailRow label="Despeje suelo" value={`${chassis.groundClearance} mm`} />}
                            {dimensions.curbWeight && <DetailRow label="Peso en marcha" value={`${dimensions.curbWeight} kg`} />}
                            {dimensions.cargoCapacity && <DetailRow label="Baúl (Max)" value={`${dimensions.cargoCapacity} L`} />}
                            {dimensions.cargoCapacityMin && <DetailRow label="Baúl (Min)" value={`${dimensions.cargoCapacityMin} L`} />}
                            {dimensions.roofCapacity && <DetailRow label="Techo/Barras" value={`${dimensions.roofCapacity} kg`} />}
                            {dimensions.payload && <DetailRow label="Carga útil" value={`${dimensions.payload} kg`} />}
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4 justify-center border-t border-gray-200 pt-4">
                        {identification.plazas && (
                            <div className="text-center">
                                <span className="block font-bold text-wise text-xl">{identification.plazas}</span>
                                <span className="text-[10px] text-gray-500 uppercase">Plazas</span>
                            </div>
                        )}
                        {identification.puertas && (
                            <div className="text-center">
                                <span className="block font-bold text-wise text-xl">{identification.puertas}</span>
                                <span className="text-[10px] text-gray-500 uppercase">Puertas</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* --- FILA 3: CHASIS + TECH + CONFORT (4 Columnas: 1 + 2 + 1) -> ¡SIN HUECOS! --- */}

                {/* 6. CHASIS */}
                {(chassis.suspensionDelantera || chassis.suspensionTrasera || offRoad.controlDescenso) && (
                    <Card title="Chasis & Dinámica" icon={Wrench}>
                        <div className="space-y-2 text-sm">
                            {(chassis.suspensionDelantera || chassis.suspensionTrasera) && (
                                <div className="p-2 bg-wise/5 rounded-lg mb-2">
                                    <p className="text-gray-500 text-xs uppercase">Suspensión</p>
                                    <p className="text-gray-900 font-medium">
                                        {chassis.suspensionDelantera || 'N/A'} / {chassis.suspensionTrasera || 'N/A'}
                                    </p>
                                </div>
                            )}
                            {chassis.materialDiscos && <DetailRow label="Frenos" value={chassis.materialDiscos} />}
                            {chassis.tipoPinzasFreno && <DetailRow label="Pinzas" value={chassis.tipoPinzasFreno} />}
                            {offRoad.controlDescenso && <DetailRow label="Control Descenso" value="Sí" isBool />}
                            {offRoad.controlTraccionOffRoad && <DetailRow label="Tracción Off-road" value="Sí" isBool />}
                        </div>
                    </Card>
                )}

                {/* 7. INFOENTRETENIMIENTO */}
                {(infotainment.pantallaCentralTamano || infotainment.androidAuto || infotainment.appleCarPlay) && (
                    <Card span="col-span-1 lg:col-span-2" title="Tecnología e Infoentretenimiento" icon={Monitor}>
                        <div className="flex gap-6 mb-6">
                            {infotainment.pantallaCentralTamano && (
                                <div>
                                    <span className="text-3xl font-bold text-wise">{infotainment.pantallaCentralTamano}"</span>
                                    <p className="text-xs text-gray-500">Pantalla Central</p>
                                </div>
                            )}
                            {infotainment.pantallaCuadroTamano && (
                                <div>
                                    <span className="text-3xl font-bold text-gray-600">{infotainment.pantallaCuadroTamano}"</span>
                                    <p className="text-xs text-gray-500">Cluster Digital</p>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                            {infotainment.appleCarPlay && (
                                <IconBadge
                                    icon={Smartphone}
                                    label={`CarPlay ${infotainment.appleCarPlay === 'Inalámbrico' ? '(Wifi)' : ''}`}
                                />
                            )}
                            {infotainment.androidAuto && (
                                <IconBadge
                                    icon={Smartphone}
                                    label={`Android ${infotainment.androidAuto === 'Inalámbrico' ? '(Wifi)' : ''}`}
                                />
                            )}
                            {infotainment.bluetooth && <IconBadge icon={Bluetooth} label="Bluetooth" />}
                            {infotainment.wifiBordo && <IconBadge icon={Wifi} label="Wi-Fi" />}
                            {infotainment.appRemotaOTA && <IconBadge icon={Cast} label="App / OTA" />}
                            {infotainment.navegacionIntegrada && <IconBadge icon={Navigation} label="GPS Nativo" />}
                            {infotainment.cargadorInalambrico && <IconBadge icon={Zap} label="Carga Qi" />}
                            {infotainment.audioMarca && (
                                <IconBadge
                                    icon={Music}
                                    label={`${infotainment.audioMarca} (${infotainment.audioNumeroBocinas || 0})`}
                                />
                            )}
                            {infotainment.puertosUSBA && (
                                <IconBadge icon={Usb} label={`${infotainment.puertosUSBA}x USB-A`} />
                            )}
                            {infotainment.puertosUSBC && (
                                <IconBadge icon={Usb} label={`${infotainment.puertosUSBC}x USB-C`} />
                            )}
                        </div>
                    </Card>
                )}

                {/* 8. CONFORT INTERIOR */}
                {(comfort.materialAsientos || comfort.techoPanoramico || comfort.climatizadorZonas) && (
                    <Card title="Suite Interior" icon={Award}>
                        <ul className="space-y-2">
                            {comfort.materialAsientos && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="w-4 h-4 text-wise" /> Asientos {comfort.materialAsientos}
                                </li>
                            )}
                            {comfort.volanteMaterialAjustes && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="w-4 h-4 text-wise" /> Volante {comfort.volanteMaterialAjustes}
                                </li>
                            )}
                            {comfort.techoPanoramico && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <Sun className="w-4 h-4 text-wise" /> Techo Panorámico
                                </li>
                            )}
                            {comfort.climatizadorZonas && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <Wind className="w-4 h-4 text-wise" /> Climatizador {comfort.climatizadorZonas} Zona{comfort.climatizadorZonas > 1 ? 's' : ''}
                                </li>
                            )}
                            {comfort.parabrisasCalefactable && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <Thermometer className="w-4 h-4 text-wise" /> Parabrisas Calefactable
                                </li>
                            )}
                            {comfort.iluminacionAmbiental && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <Award className="w-4 h-4 text-wise" /> Iluminación Ambiental
                                </li>
                            )}
                            {comfort.sensorLluvia && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <Umbrella className="w-4 h-4 text-wise" /> Sensor Lluvia
                                </li>
                            )}
                            {comfort.startStop && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="w-4 h-4 text-wise" /> Keyless Entry
                                </li>
                            )}
                            {comfort.vidriosElectricos && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="w-4 h-4 text-wise" /> Vidrios Automáticos
                                </li>
                            )}
                            {comfort.modosConduccion && (
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="w-4 h-4 text-wise" /> Modos: {comfort.modosConduccion}
                                </li>
                            )}
                        </ul>
                    </Card>
                )}

                {/* --- FILA 4: SEGURIDAD (4 Columnas: FULL WIDTH) --- */}

                {/* 9. SEGURIDAD ADAS - Ahora Full Width para cerrar el bloque */}
                {(safety.airbags || adas.acc || adas.aeb) && (
                    <Card span="col-span-1 lg:col-span-4" title="Seguridad Activa y Pasiva (ADAS)" icon={ShieldCheck}>
                        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 h-full items-start md:items-center">
                            {safety.airbags && (
                                <div className="flex-shrink-0 flex items-center gap-4 md:block md:text-center p-4 bg-red-50 rounded-2xl border border-red-100 min-w-[150px]">
                                    <span className="text-4xl md:text-5xl font-bold text-red-600 block">{safety.airbags}</span>
                                    <div>
                                        <span className="block text-sm text-red-800 font-bold uppercase tracking-wide">Airbags</span>
                                        <span className="text-xs text-red-600/70 block">Protección Total</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex-grow w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                                    {adas.acc && <DetailRow label="ACC (Crucero Adapt)" value="Sí" isBool />}
                                    {adas.aeb && <DetailRow label="AEB (Frenado Aut)" value="Sí" isBool />}
                                    {adas.bsm && <DetailRow label="BSM (Punto Ciego)" value="Sí" isBool />}
                                    {adas.lka && <DetailRow label="LKA (Asist. Carril)" value="Sí" isBool />}
                                    {adas.lucesAltasAutomaticas && <DetailRow label="Luces Altas Auto" value="Sí" isBool />}
                                    {adas.parkAssist && <DetailRow label="Parqueo Autónomo" value="Sí" isBool />}
                                    {adas.sensoresEstacionamientoDelantero && <DetailRow label="Sensores Delanteros" value="Sí" isBool />}
                                </div>
                            </div>
                        </div>
                        {lighting.headlightType && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-sm">
                                    <Lightbulb className="w-4 h-4 text-wise" />
                                    <span className="text-gray-600">Faros:</span>
                                    <span className="font-semibold text-gray-900">{lighting.headlightType}</span>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* --- FILA 5: COMERCIAL (4 Columnas: FULL WIDTH) --- */}

                {/* 10. TARJETA COMERCIAL FINAL */}
                {(commercial.garantiaVehiculo || commercial.garantiaBateria) && (
                    <Card
                        span="col-span-1 md:col-span-2 lg:col-span-4"
                        className="!bg-gradient-to-r !from-white !to-wise/5"
                        title="Respaldo y Garantía"
                        icon={CircleDollarSign}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {commercial.garantiaVehiculo && (
                                <div className="space-y-1">
                                    <p className="text-xs uppercase text-gray-500 font-bold">Garantía Vehículo</p>
                                    <p className="text-xl font-bold text-wise">{commercial.garantiaVehiculo}</p>
                                </div>
                            )}
                            {commercial.garantiaBateria && (
                                <div className="space-y-1">
                                    <p className="text-xs uppercase text-gray-500 font-bold">Garantía Batería</p>
                                    <p className="text-xl font-bold text-wise">{commercial.garantiaBateria}</p>
                                </div>
                            )}
                            {commercial.intervaloMantenimiento && (
                                <div className="space-y-1">
                                    <p className="text-xs uppercase text-gray-500 font-bold">Mantenimiento</p>
                                    <p className="text-xl font-bold text-gray-900">{commercial.intervaloMantenimiento}</p>
                                </div>
                            )}
                            {commercial.costoMantenimiento3Primeros && (
                                <div className="bg-wise/10 p-4 rounded-xl border border-wise/20">
                                    <p className="text-xs uppercase text-wise font-bold mb-1">Costo Mantenimiento</p>
                                    <p className="text-sm text-gray-600 mb-1">Primeros 3 servicios:</p>
                                    <p className="text-2xl font-bold text-wise">
                                        ${new Intl.NumberFormat('es-CO').format(commercial.costoMantenimiento3Primeros)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                            {commercial.asistenciaCarretera && (
                                <span className="text-sm text-gray-600">
                                    Asistencia en carretera: {commercial.asistenciaCarretera} año{commercial.asistenciaCarretera > 1 ? 's' : ''}
                                </span>
                            )}
                            <button className="bg-wise text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-wise-dark transition-colors shadow-md hover:shadow-lg">
                                Cotizar Ahora
                            </button>
                        </div>
                    </Card>
                )}

            </div>
        </div>
    );
}