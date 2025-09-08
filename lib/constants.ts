export const VEHICLE_CATEGORIES = [
  { id: 'Automóvil', label: 'Automóvil', color: 'bg-blue-100 text-blue-800' },
  { id: 'Deportivo', label: 'Deportivo', color: 'bg-red-100 text-red-800' },
  { id: 'Todoterreno', label: 'Todoterreno', color: 'bg-green-100 text-green-800' },
  { id: 'Camioneta', label: 'Camioneta', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'SUV', label: 'SUV', color: 'bg-purple-100 text-purple-800' },
] as const;

export const ENGINE_TYPES = [
  { id: 'Gasolina', label: 'Gasolina', icon: '🔥' },
  { id: 'Diesel', label: 'Diesel', icon: '⛽' },
  { id: 'Eléctrico', label: 'Eléctrico', icon: '⚡' },
  { id: 'Híbrido', label: 'Híbrido', icon: '🔋' },
] as const;

export const FUEL_TYPES = [
  { id: 'GASOLINE', label: 'Gasolina', icon: '⛽' },
  { id: 'DIESEL', label: 'Diesel', icon: '⛽' },
  { id: 'HYBRID', label: 'HEV', icon: '🔋' },
  { id: 'PHEV', label: 'PHEV', icon: '🔌' },
  { id: 'EV', label: 'EV', icon: '⚡' },
] as const;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-low', label: 'Precio: Menor a Mayor' },
  { value: 'price-high', label: 'Precio: Mayor a Menor' },
  { value: 'year-new', label: 'Año: Más Nuevo' },
  { value: 'year-old', label: 'Año: Más Antiguo' },
  { value: 'brand', label: 'Marca: A-Z' },
] as const;

export const PRICE_RANGES = [
  { label: 'Menos de $50M', min: 0, max: 50000000 },
  { label: '$50M - $100M', min: 50000000, max: 100000000 },
  { label: '$100M - $200M', min: 100000000, max: 200000000 },
  { label: '$200M - $500M', min: 200000000, max: 500000000 },
  { label: 'Más de $500M', min: 500000000, max: Infinity },
];
