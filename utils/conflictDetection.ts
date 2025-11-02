import { WeeklyRidesData, WeeklyRide } from '@/hooks/useWeeklyRides';
import { WeeklyAvailabilityData, getAvailabilityHours } from '@/hooks/useWeeklyAvailability';

export type ConflictType = 'driver' | 'truck';

export type ConflictWarning = {
    type: ConflictType;
    resourceId: string;
    resourceName: string;
    currentHours: number;
    newHours: number;
    totalHours: number;
    availableHours: number; // Custom availability hours
    date: string;
    dayName: string;
};

/**
 * Calculate total hours for a driver on a specific date
 */
export const calculateDriverHoursForDate = (
    ridesData: WeeklyRidesData,
    driverId: string,
    targetDate: string,
    excludeRideId?: string
): number => {
    let totalHours = 0;

    const targetDay = ridesData.days.find(day => day.date === targetDate);
    if (!targetDay) return totalHours;

    for (const client of targetDay.clients) {
        for (const ride of client.rides) {
            if (excludeRideId && ride.id === excludeRideId) continue;

            // Check primary driver
            if (ride.assignedDriver?.id === driverId) {
                totalHours += ride.assignedDriver.plannedHours;
            }

            // Check second driver
            if (ride.secondDriver?.id === driverId) {
                totalHours += ride.secondDriver.plannedHours;
            }
        }
    }

    return totalHours;
};

/**
 * Calculate total hours for a truck on a specific date
 */
export const calculateTruckHoursForDate = (
    ridesData: WeeklyRidesData,
    truckId: string,
    targetDate: string,
    excludeRideId?: string
): number => {
    let totalHours = 0;

    const targetDay = ridesData.days.find(day => day.date === targetDate);
    if (!targetDay) return totalHours;

    for (const client of targetDay.clients) {
        for (const ride of client.rides) {
            if (excludeRideId && ride.id === excludeRideId) continue;

            if (ride.assignedTruck?.id === truckId) {
                totalHours += ride.plannedHours;
            }
        }
    }

    return totalHours;
};

/**
 * Get the date for a specific ride
 */
export const getRideDateAndDay = (ridesData: WeeklyRidesData, rideId: string): { date: string; dayName: string } | null => {
    for (const day of ridesData.days) {
        for (const client of day.clients) {
            for (const ride of client.rides) {
                if (ride.id === rideId) {
                    return { date: day.date, dayName: day.dayName };
                }
            }
        }
    }
    return null;
};

/**
 * Check for driver assignment conflicts
 */
export const checkDriverConflict = (
    ridesData: WeeklyRidesData,
    rideId: string,
    driverId: string,
    newDriverHours: number,
    driverName: string,
    availabilityData?: WeeklyAvailabilityData
): ConflictWarning | null => {
    const rideDateInfo = getRideDateAndDay(ridesData, rideId);
    if (!rideDateInfo) return null;

    const currentHours = calculateDriverHoursForDate(ridesData, driverId, rideDateInfo.date, rideId);
    const totalHours = currentHours + newDriverHours;
    
    // Get custom availability hours or default to 8
    const availableHours = getAvailabilityHours(driverId, rideDateInfo.date, availabilityData, 'driver');

    if (totalHours > availableHours) {
        return {
            type: 'driver',
            resourceId: driverId,
            resourceName: driverName,
            currentHours,
            newHours: newDriverHours,
            totalHours,
            availableHours,
            date: rideDateInfo.date,
            dayName: rideDateInfo.dayName
        };
    }

    return null;
};

/**
 * Check for truck assignment conflicts
 */
export const checkTruckConflict = (
    ridesData: WeeklyRidesData,
    rideId: string,
    truckId: string,
    newTruckHours: number,
    truckLicensePlate: string,
    availabilityData?: WeeklyAvailabilityData
): ConflictWarning | null => {
    const rideDateInfo = getRideDateAndDay(ridesData, rideId);
    if (!rideDateInfo) return null;

    const currentHours = calculateTruckHoursForDate(ridesData, truckId, rideDateInfo.date, rideId);
    const totalHours = currentHours + newTruckHours;
    
    // Get custom availability hours or default to 8
    const availableHours = getAvailabilityHours(truckId, rideDateInfo.date, availabilityData, 'truck');

    if (totalHours > availableHours) {
        return {
            type: 'truck',
            resourceId: truckId,
            resourceName: truckLicensePlate,
            currentHours,
            newHours: newTruckHours,
            totalHours,
            availableHours,
            date: rideDateInfo.date,
            dayName: rideDateInfo.dayName
        };
    }

    return null;
};

/**
 * Check for driver hours update conflicts
 */
export const checkDriverHoursConflict = (
    ridesData: WeeklyRidesData,
    rideId: string,
    driverId: string,
    newHours: number,
    driverName: string,
    availabilityData?: WeeklyAvailabilityData
): ConflictWarning | null => {
    const rideDateInfo = getRideDateAndDay(ridesData, rideId);
    if (!rideDateInfo) return null;

    // Get current hours excluding this specific driver assignment in this ride
    let currentHours = calculateDriverHoursForDate(ridesData, driverId, rideDateInfo.date, rideId);
    
    // Add the new hours for this assignment
    const totalHours = currentHours + newHours;
    
    // Get custom availability hours or default to 8
    const availableHours = getAvailabilityHours(driverId, rideDateInfo.date, availabilityData, 'driver');

    if (totalHours > availableHours) {
        return {
            type: 'driver',
            resourceId: driverId,
            resourceName: driverName,
            currentHours,
            newHours: newHours,
            totalHours,
            availableHours,
            date: rideDateInfo.date,
            dayName: rideDateInfo.dayName
        };
    }

    return null;
};
