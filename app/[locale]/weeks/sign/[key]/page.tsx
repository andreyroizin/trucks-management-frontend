'use client';

import React, {useState} from 'react';
import {Box, Button, CircularProgress, Typography,} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import {useParams, useRouter} from 'next/navigation';
import {useDriverWeekDetails} from '@/hooks/useDriverWeekDetails';
import {useSignDriverWeek} from '@/hooks/useSignDriverWeek';
import WeekSummary from "@/components/WeekSummary";
import { useTranslations } from 'next-intl';

export default function SignWorkWeekPage() {
    const router = useRouter();
    const params = useParams<{ key: string }>();
    const [yearStr, weekStr] = params.key.split('-');
    const year = parseInt(yearStr, 10);
    const weekNumber = parseInt(weekStr, 10);

    const t = useTranslations('weeks.driver.sign');

    const { data, isLoading, error } = useDriverWeekDetails(year, weekNumber);

    const [signError, setSignError] = useState<string | null>(null);
    const { mutateAsync, isPending: isSigning } = useSignDriverWeek();

    // ─── Loading / Error ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" mt={6}>
                <CircularProgress />
            </Box>
        );
    }

    if (!data || error) {
        return (
            <Typography color="error" mt={4} textAlign="center">
                {t('errorLoad')}
            </Typography>
        );
    }

    // ─── UI ───────────────────────────────────────────────────────────
    const handleSignClick = async () => {
        setSignError(null);
        
        if (!data?.weekApprovalId) {
            setSignError('Week approval ID not found');
            return;
        }
        
        try {
            await mutateAsync(data.weekApprovalId); // ✅ Use weekApprovalId instead of year/weekNumber
            router.push(`/weeks/sign/success/${year}-${weekNumber}`);
        } catch (err) {
            const message = t('errorSign');
            setSignError(message);
        }
    };
    return (
        <Box maxWidth="600px" mx="auto" py={4}>
            <Typography variant="h4" sx={{fontWeight: 500, marginBottom: 2}} gutterBottom>
                {t('title')}
            </Typography>

            <WeekSummary
                week={data.weekNumber}
                year={data.year}
                executions={data.executions}
                totalHours={data.totalHours}
                totalCompensation={data.totalCompensation}
                adminAllowedAt={data.adminAllowedAt}
            />

            {/* sign button only if status = 1 (ready to sign) */}
            {data.status === 1 && (
                <>
                    <Typography variant="body2" color="text.secondary" sx={{marginTop: 2, marginBottom: 2}}>
                        {t('warning')}
                    </Typography>

                    {signError && (
                        <Typography color="error" mt={2} mb={1} textAlign="center">
                            {signError}
                        </Typography>
                    )}
                    <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        size="large"
                        disabled={isSigning}
                        startIcon={isSigning ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                        onClick={handleSignClick}
                    >
                        {t('submit')}
                    </Button>
                </>
            )}
            {data.status === 2 && (
                <>
                    <Typography variant="body2" color="text.secondary" sx={{ marginTop: 2, marginBottom: 2 }}>
                        {t('alreadySigned')}
                    </Typography>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        size="large"
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                        onClick={() => router.push(`/weeks/signed/${year}-${weekNumber}`)}
                    >
                        {t('viewSigned')}
                    </Button>
                </>
            )}
        </Box>
    );
}