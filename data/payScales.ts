// Pay scale wage data based on scale letter and step number
// Updated for 2026 CAO (+4% increase from 2025)
export const payScaleWages: Record<string, Record<number, number>> = {
  A: {
    1: 14.71,
    2: 14.80,
    3: 15.39,
    4: 16.00,
    5: 16.64,
    6: 17.31,
  },
  B: {
    1: 14.98,
    2: 15.58,
    3: 16.20,
    4: 16.85,
    5: 17.52,
    6: 18.22,
  },
  C: {
    1: 15.63,
    2: 16.25,
    3: 16.90,
    4: 17.58,
    5: 18.28,
    6: 19.01,
  },
  D: {
    1: 16.64,
    2: 17.30,
    3: 17.99,
    4: 18.71,
    5: 19.46,
    6: 20.24,
  },
  E: {
    1: 17.45,
    2: 18.15,
    3: 18.87,
    4: 19.63,
    5: 20.41,
    6: 21.23,
    7: 22.08,
  },
  F: {
    1: 18.24,
    2: 18.97,
    3: 19.73,
    4: 20.51,
    5: 21.34,
    6: 22.19,
    7: 23.08,
    8: 24.00,
  },
  G: {
    1: 19.27,
    2: 20.04,
    3: 20.84,
    4: 21.67,
    5: 22.54,
    6: 23.44,
    7: 24.38,
    8: 25.35,
    9: 26.37,
  },
  H: {
    1: 20.30,
    2: 21.11,
    3: 21.96,
    4: 22.83,
    5: 23.75,
    6: 24.70,
    7: 25.68,
    8: 26.71,
    9: 27.78,
    10: 28.89,
  },
};

// Helper function to get hourly wage based on pay scale and step
export const getHourlyWage = (payScale: string, payScaleStep: number): number | null => {
  if (!payScale || !payScaleStep) return null;
  
  const scaleData = payScaleWages[payScale];
  if (!scaleData) return null;
  
  return scaleData[payScaleStep] || null;
};

// Helper function to get available steps for a pay scale
export const getAvailableSteps = (payScale: string): number[] => {
  if (!payScale) return [];
  
  const scaleData = payScaleWages[payScale];
  if (!scaleData) return [];
  
  return Object.keys(scaleData).map(Number).sort((a, b) => a - b);
}; 