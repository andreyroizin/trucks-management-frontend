import { Driver, Truck } from '@/hooks/useDriversAndTrucks';

/**
 * Utility functions for auto-selection of drivers and trucks based on their assignments
 */

export type DriverTruckMaps = {
    driverToTruck: Map<string, Truck>;
    truckToDriver: Map<string, Driver>;
};

/**
 * Creates lookup maps for driver-truck relationships
 * Based on backend confirmation: Car.driverId directly matches Driver.id
 */
export const createDriverTruckMaps = (drivers: Driver[], trucks: Truck[]): DriverTruckMaps => {
    const driverToTruck = new Map<string, Truck>();
    const truckToDriver = new Map<string, Driver>();

    // Create truck-to-driver mapping using Car.driverId
    trucks.forEach(truck => {
        if (truck.driverId) {
            const driver = drivers.find(d => d.id === truck.driverId);
            if (driver) {
                truckToDriver.set(truck.id, driver);
            }
        }
    });

    // Create driver-to-truck mapping
    // Method 1: Use Driver.carId if available (future backend enhancement)
    drivers.forEach(driver => {
        if (driver.carId) {
            const assignedTruck = trucks.find(truck => truck.id === driver.carId);
            if (assignedTruck) {
                driverToTruck.set(driver.id, assignedTruck);
            }
        }
    });
    
    // Method 2: Fallback - reverse lookup from trucks (current implementation)
    // This ensures we have the mapping even if Driver.carId is not available yet
    trucks.forEach(truck => {
        if (truck.driverId && !driverToTruck.has(truck.driverId)) {
            const driver = drivers.find(d => d.id === truck.driverId);
            if (driver) {
                driverToTruck.set(driver.id, truck);
            }
        }
    });

    return { driverToTruck, truckToDriver };
};

/**
 * Gets the truck assigned to a specific driver
 */
export const getDriverAssignedTruck = (driverId: string, maps: DriverTruckMaps): Truck | null => {
    return maps.driverToTruck.get(driverId) || null;
};

/**
 * Gets the driver assigned to a specific truck
 */
export const getTruckAssignedDriver = (truckId: string, maps: DriverTruckMaps): Driver | null => {
    return maps.truckToDriver.get(truckId) || null;
};

/**
 * Validates if a driver-truck combination is valid based on their assignments
 */
export const validateDriverTruckAssignment = (
    driverId: string | null,
    truckId: string | null,
    maps: DriverTruckMaps
): {
    valid: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
} => {
    if (!driverId || !truckId) {
        return { valid: true, message: 'Partial assignment', type: 'success' };
    }

    const driverAssignedTruck = maps.driverToTruck.get(driverId);
    const truckAssignedDriver = maps.truckToDriver.get(truckId);

    // Perfect match - driver and truck are assigned to each other
    if (driverAssignedTruck?.id === truckId && truckAssignedDriver?.id === driverId) {
        return {
            valid: true,
            message: 'Driver and truck are assigned to each other',
            type: 'success'
        };
    }

    // Driver is assigned to a different truck
    if (driverAssignedTruck && driverAssignedTruck.id !== truckId) {
        return {
            valid: false,
            message: `Warning: Driver is currently assigned to truck ${driverAssignedTruck.licensePlate}`,
            type: 'warning'
        };
    }

    // Truck is assigned to a different driver
    if (truckAssignedDriver && truckAssignedDriver.id !== driverId) {
        return {
            valid: false,
            message: `Warning: Truck is currently assigned to ${truckAssignedDriver.fullName}`,
            type: 'warning'
        };
    }

    // No conflicts, but no direct assignment either
    return {
        valid: true,
        message: 'No assignment conflicts detected',
        type: 'success'
    };
};

/**
 * Determines if auto-selection should occur for a ride assignment
 */
export const shouldAutoSelect = (
    currentDriverId: string | null,
    currentTruckId: string | null,
    selectedDriverId: string | null,
    selectedTruckId: string | null
): {
    autoSelectTruck: boolean;
    autoSelectDriver: boolean;
} => {
    return {
        // Auto-select truck if driver is being assigned and no truck is currently assigned
        autoSelectTruck: !!selectedDriverId && !currentTruckId,
        // Auto-select driver if truck is being assigned and no driver is currently assigned
        autoSelectDriver: !!selectedTruckId && !currentDriverId
    };
};
