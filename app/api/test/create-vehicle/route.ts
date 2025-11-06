import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Obtener o crear un dealer de prueba
    let dealer = await prisma.dealer.findFirst();
    
    if (!dealer) {
      dealer = await prisma.dealer.create({
        data: {
          name: 'Concesionario de Prueba',
          location: 'Bogotá',
          address: 'Calle 123 #45-67',
          phone: '+57 1 2345678',
          email: 'prueba@concesionario.com',
          status: 'Activo'
        }
      });
    }

    // Datos completos del vehículo de prueba - Toyota RAV4 Hybrid
    const vehicleData = {
      brand: 'Toyota',
      model: 'RAV4',
      year: 2024,
      price: 125000000,
      type: 'SUV',
      vehicleType: 'Todoterreno',
      fuelType: 'Híbrido',
      specifications: {
        identification: {
          marca: 'Toyota',
          modelo: 'RAV4',
          añoModelo: 2024,
          carrocería: 'SUV',
          plazas: 5,
          puertas: 5,
          versionTrim: 'XLE Hybrid'
        },
        powertrain: {
          alimentacion: 'Híbrido',
          cicloTrabajo: 'Atkinson',
          cilindrada: 2.5,
          combustible: 'Gasolina',
          modosConduccion: 'Eco, Normal, Sport, EV',
          octanajeRecomendado: 87,
          potenciaMaxMotorTermico: 131,
          potenciaMaxSistemaHibrido: 163,
          torqueMaxMotorTermico: 221,
          torqueMaxSistemaHibrido: 221,
          traccion: 'AWD',
          startStop: true,
          launchControl: false
        },
        transmission: {
          tipoTransmision: 'CVT',
          numeroMarchas: 0,
          modoRemolque: true,
          paddleShifters: false,
          torqueVectoring: true,
          traccionInteligenteOnDemand: true
        },
        dimensions: {
          length: 4600,
          width: 1855,
          height: 1690,
          curbWeight: 1680,
          wheelbase: 2690,
          cargoCapacity: 580
        },
        weight: {
          payload: 450
        },
        interior: {
          trunkCapacitySeatsDown: 580,
          passengerCapacity: 5
        },
        efficiency: {
          consumoCiudad: 5.3,
          consumoCarretera: 5.8,
          consumoMixto: 5.5,
          capacidadTanque: 55,
          costoEnergia100km: 25000,
          ahorro5Anos: 15000000
        },
        battery: {
          capacidadBrutaBateria: 1.6,
          regeneracionNiveles: 3,
          v2hV2g: false
        },
        chassis: {
          groundClearance: 195,
          suspensionDelantera: 'McPherson',
          suspensionTrasera: 'Multibrazo',
          amortiguacionAdaptativa: false,
          materialDiscos: 'Acero',
          materialMuelles: 'Acero',
          tipoPinzasFreno: 'Fijas, 2 pistones'
        },
        performance: {
          acceleration0to100: 8.1,
          acceleration0to60: 7.8,
          acceleration50to80: 5.2,
          overtaking80to120: 6.8,
          maxSpeed: 180,
          powerToWeight: 97,
          brakingDistance100to0: 38.5
        },
        safety: {
          airbags: 7,
          ncapRating: 5,
          adultSafetyScore: 93,
          childSafetyScore: 89,
          assistanceScore: 95
        },
        adas: {
          acc: true,
          aeb: true,
          bsm: true,
          camara360: true,
          farosAdaptativos: true,
          lka: true,
          lucesAltasAutomaticas: true,
          parkAssist: true,
          sensoresEstacionamientoDelantero: 4
        },
        lighting: {
          headlightType: 'LED',
          antinieblaDelantero: true,
          intermitentesDinamicos: false,
          lavafaros: false,
          sensorLluvia: true
        },
        infotainment: {
          androidAuto: 'Inalámbrico',
          appleCarPlay: 'Inalámbrico',
          appRemotaOTA: true,
          audioMarca: 'JBL',
          audioNumeroBocinas: 8,
          bluetooth: true,
          cargadorInalambrico: true,
          navegacionIntegrada: true,
          pantallaCentralTamano: 10.5,
          pantallaCuadroTamano: 7,
          potenciaAmplificador: 800,
          puertosUSBA: 2,
          puertosUSBC: 2,
          wifiBordo: true
        },
        comfort: {
          ajusteElectricoConductor: 8,
          ajusteElectricoPasajero: 4,
          calefaccionAsientos: true,
          climatizadorZonas: 2,
          cristalesAcusticos: false,
          iluminacionAmbiental: true,
          masajeAsientos: false,
          materialAsientos: 'Tela premium',
          memoriaAsientos: true,
          parabrisasCalefactable: false,
          segundaFilaCorrediza: true,
          techoPanoramico: true,
          terceraFilaAsientos: false,
          tomas12V120V: 3,
          tomacorrienteEnCaja: false,
          ventilacionAsientos: true,
          vidriosElectricos: true,
          volanteMaterialAjustes: 'Cuero, ajuste altura y profundidad',
          volanteCalefactable: true
        },
        offRoad: {
          controlDescenso: true,
          controlTraccionOffRoad: true
        },
        commercial: {
          precioLista: 125000000,
          garantiaVehiculo: '3 años; 100000 km',
          garantiaBateria: '8 años; 160000 km',
          asistenciaCarretera: 3,
          intervaloMantenimiento: '15000 km; 12 meses',
          costoMantenimiento3Primeros: 4500000,
          origenPaisPlanta: 'Japón / Toyota Motor Corporation'
        },
        metadata: {
          aplicabilidadFlags: 'HEV/PHEV, SUV, 4x4',
          observaciones: 'Vehículo de prueba con datos completos para visualización'
        }
      },
      dealerIds: [dealer.id],
      coverImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db9?w=800&h=600&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'
      ],
      thumbnailIndex: 0
    };

    // Crear vehículo usando la misma lógica que la API
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el vehículo
      const vehicle = await tx.vehicle.create({
        data: {
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year,
          price: vehicleData.price,
          type: vehicleData.type,
          vehicleType: vehicleData.vehicleType,
          fuelType: vehicleData.fuelType,
          specifications: JSON.stringify(vehicleData.specifications)
        }
      });

      // 2. Crear las relaciones con concesionarios
      await tx.vehicleDealer.create({
        data: {
          vehicleId: vehicle.id,
          dealerId: dealer.id
        }
      });

      // 3. Crear las imágenes
      const imagesToCreate = [
        {
          vehicleId: vehicle.id,
          url: vehicleData.coverImage,
          type: 'cover',
          order: 0
        },
        ...vehicleData.galleryImages.map((url, index) => ({
          vehicleId: vehicle.id,
          url,
          type: 'gallery' as const,
          order: index + 1,
          isThumbnail: vehicleData.thumbnailIndex === index
        }))
      ];

      await tx.vehicleImage.createMany({
        data: imagesToCreate
      });

      return vehicle;
    });

    const createdVehicle = await prisma.vehicle.findUnique({
      where: { id: result.id },
      include: {
        images: true,
        vehicleDealers: {
          include: {
            dealer: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      vehicle: createdVehicle,
      message: 'Vehículo de prueba creado exitosamente',
      url: `/vehicles/${createdVehicle?.id}`
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creando vehículo de prueba:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear vehículo de prueba', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

