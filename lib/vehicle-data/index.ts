/**
 * Vehicle data utilities
 * Provides pre-mapped vehicle data for auto-filling forms
 */

import { tangVehicleData } from './tang-data';
import { songPlusVehicleData } from './song-plus-data';

// Use a flexible type that allows partial fields
export type VehicleFormData = Partial<typeof tangVehicleData> & Partial<typeof songPlusVehicleData>;

/**
 * Get Tang vehicle data
 */
export function getTangData() {
    return tangVehicleData;
}

/**
 * Get Song Plus vehicle data
 */
export function getSongPlusData() {
    return songPlusVehicleData;
}

/**
 * Available vehicle data presets
 */
export const availableVehicles = {
    tang: tangVehicleData,
    songPlus: songPlusVehicleData,
} as const;

export type AvailableVehicleKey = keyof typeof availableVehicles;

/**
 * Get vehicle data by key
 */
export function getVehicleData(key: AvailableVehicleKey) {
    return availableVehicles[key];
}
