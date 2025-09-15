export type VehicleCard = {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuel: 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'PHEV' | 'EV';
  imageUrl: string | null;
  category?: string; // "Deportivo", "SUV", etc.
  status?: 'NUEVO' | 'USADO';
  images?: Array<{
    id?: string;
    url: string;
    type: string;
    order: number;
    isThumbnail?: boolean;
  }>;
};

export type VehicleDetail = VehicleCard & {
  power: number;
  engine: number;
  acceleration: number;
  cityConsumption: number;
  rating: number;
  slogan: string;
  reviewVideoUrl?: string;
  dealerships: Array<{
    id: string;
    name: string;
    location: string;
  }>;
  specifications: {
    general: {
      brand: string;
      model: string;
      year: number;
    };
    performance: {
      power: number;
      torque: number;
      acceleration: number;
    };
    engine: {
      displacement: number;
      turbo: boolean;
      transmission: string;
    };
    consumption: {
      city: number;
      highway: number;
    };
    dimensions: {
      length: number;
      width: number;
      height: number;
      weight: number;
      wheelbase: number;
    };
    capacities: {
      passengers: number;
    };
    safety: {
      airbags: number;
      ncapStars: number;
      stabilityControl: boolean;
      tractionControl: boolean;
    };
    comfort: {
      airConditioning: boolean;
      climateControl: boolean;
      heatedSeats: boolean;
      ventilatedSeats: boolean;
    };
    technology: {
      bluetooth: boolean;
      touchscreen: boolean;
      navigation: boolean;
      smartphoneIntegration: boolean;
    };
    features: {
      laneAssistant: boolean;
      cameras360: boolean;
    };
  };
  wisemetrics: {
    drivingFun: number;
    technology: number;
    environmentalImpact: number;
    reliability: number;
    qualityPriceRatio: number;
    comfort: number;
    usability: number;
    efficiency: number;
    prestige: number;
    userRating: number;
    interiorQuality: number;
  };
  categories: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  similarVehicles: VehicleCard[];
};

export type SearchParams = {
  q?: string;
  fuel?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  year?: string;
};

export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};
