// Pay scale wage data based on scale letter and step number
export const payScaleWages: Record<string, Record<number, number>> = {
  A: {
    1: 14.06,
    2: 14.23,
    3: 14.80,
    4: 15.39,
    5: 16.00,
    6: 16.64,
  },
  B: {
    1: 14.40,
    2: 14.98,
    3: 15.58,
    4: 16.20,
    5: 16.85,
    6: 17.52,
  },
  C: {
    1: 15.03,
    2: 15.63,
    3: 16.25,
    4: 16.90,
    5: 17.58,
    6: 18.28,
  },
  D: {
    1: 16.00,
    2: 16.64,
    3: 17.30,
    4: 17.99,
    5: 18.71,
    6: 19.46,
  },
  E: {
    1: 16.78,
    2: 17.45,
    3: 18.15,
    4: 18.87,
    5: 19.63,
    6: 20.41,
    7: 21.23,
  },
  F: {
    1: 17.54,
    2: 18.24,
    3: 18.97,
    4: 19.73,
    5: 20.51,
    6: 21.34,
    7: 22.19,
    8: 23.08,
  },
  G: {
    1: 18.53,
    2: 19.27,
    3: 20.04,
    4: 20.84,
    5: 21.67,
    6: 22.54,
    7: 23.44,
    8: 24.38,
    9: 25.35,
  },
  H: {
    1: 19.52,
    2: 20.30,
    3: 21.11,
    4: 21.96,
    5: 22.83,
    6: 23.75,
    7: 24.70,
    8: 25.68,
    9: 26.71,
    10: 27.78,
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