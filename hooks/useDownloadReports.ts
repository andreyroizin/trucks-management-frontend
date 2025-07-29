import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { saveAs } from 'file-saver';

// Download week report
const downloadWeekReport = async ({ 
    driverId, 
    year, 
    weekNumber 
}: { 
    driverId: string; 
    year: number; 
    weekNumber: number; 
}) => {
    const response = await api.get(`/reports/driver/${driverId}/week/${year}/${weekNumber}/pdf`, {
        responseType: 'blob'
    });
    
    const blob = response.data;
    const filename = `Driver_Week_${year}_W${String(weekNumber).padStart(2, '0')}_Report.pdf`;
    saveAs(blob, filename);
};

// Download period report
const downloadPeriodReport = async ({ 
    driverId, 
    year, 
    periodNumber 
}: { 
    driverId: string; 
    year: number; 
    periodNumber: number; 
}) => {
    const response = await api.get(`/reports/driver/${driverId}/period/${year}/${periodNumber}/pdf`, {
        responseType: 'blob'
    });
    
    const blob = response.data;
    const filename = `Driver_Period_${year}_P${String(periodNumber).padStart(2, '0')}_Report.pdf`;
    saveAs(blob, filename);
};

export const useDownloadWeekReport = () => {
    return useMutation({
        mutationFn: downloadWeekReport,
        onError: (error: any) => {
            console.error('Failed to download week report:', error);
            const message = error?.response?.status === 404 
                ? 'Report not available - week may not be signed yet'
                : 'Failed to download report';
            alert(message);
        }
    });
};

export const useDownloadPeriodReport = () => {
    return useMutation({
        mutationFn: downloadPeriodReport,
        onError: (error: any) => {
            console.error('Failed to download period report:', error);
            const message = error?.response?.status === 404 
                ? 'Report not available - not all weeks in period are signed'
                : 'Failed to download report';
            alert(message);
        }
    });
}; 