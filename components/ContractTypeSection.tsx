'use client';

import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Grid,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { Controller, Control, UseFormWatch } from 'react-hook-form';
import { CONTRACT_TYPE_OPTIONS, ContractTypeValue } from '@/constants/contractTypes';

interface ContractTypeSectionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: Control<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watch: UseFormWatch<any>;
    errors?: Record<string, any>;
    companyOptions?: { id: string; name: string }[];
}

/**
 * Reusable contract-type selector + conditional type-specific fields.
 * All strings come from the drivers.create.contractType translation namespace.
 */
export default function ContractTypeSection({
    control,
    watch,
    errors = {},
}: ContractTypeSectionProps) {
    const t = useTranslations('drivers.create.contractType');
    const contractType: ContractTypeValue = watch('ContractType') ?? 'CAO';

    return (
        <Box>
            {/* ── Contract Type Dropdown ──────────────────────────────────── */}
            <Controller
                name="ContractType"
                control={control}
                defaultValue="CAO"
                render={({ field }) => (
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>{t('label')}</InputLabel>
                        <Select {...field} label={t('label')}>
                            {CONTRACT_TYPE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={500}>
                                            {t(`options.${opt.value}.label`)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {t(`options.${opt.value}.description`)}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            />

            {/* ── ZZP fields ──────────────────────────────────────────────── */}
            {contractType === 'ZZP' && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'success.light', borderRadius: 2, bgcolor: 'success.50' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip label="ZZP" color="success" size="small" />
                        <Typography variant="subtitle2">{t('zzp.sectionTitle')}</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Controller name="ZzpBtwNumber" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('zzp.btwNumber')} fullWidth size="small"
                                        placeholder={t('zzp.btwPlaceholder')}
                                        error={!!errors.ZzpBtwNumber} helperText={errors.ZzpBtwNumber?.message} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="ZzpKvkNumber" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('zzp.kvkNumber')} fullWidth size="small"
                                        placeholder={t('zzp.kvkPlaceholder')}
                                        error={!!errors.ZzpKvkNumber} helperText={errors.ZzpKvkNumber?.message} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="ZzpHourlyRateExclBtw" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('zzp.hourlyRateExclBtw')} fullWidth size="small"
                                        type="number" inputProps={{ min: 0, step: 0.01 }}
                                        error={!!errors.ZzpHourlyRateExclBtw} helperText={errors.ZzpHourlyRateExclBtw?.message} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="ZzpBtwPercentage" control={control} defaultValue={21}
                                render={({ field }) => (
                                    <TextField {...field} label={t('zzp.btwPercentage')} fullWidth size="small"
                                        type="number" inputProps={{ min: 0, max: 100, step: 1 }} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="ZzpMediationFeePerWeek" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('zzp.mediationFee')} fullWidth size="small"
                                        type="number" inputProps={{ min: 0, step: 0.01 }} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="ZzpContractNumber" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('zzp.contractNumber')} fullWidth size="small"
                                        placeholder={t('zzp.contractNrPlaceholder')} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="ZzpLocation" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('zzp.location')} fullWidth size="small"
                                        placeholder={t('zzp.locationPlaceholder')} />
                                )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="ZzpWorkDescription" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('zzp.workDescription')} fullWidth size="small"
                                        placeholder={t('zzp.workDescPlaceholder')} />
                                )} />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* ── Inleen fields ────────────────────────────────────────────── */}
            {contractType === 'Inleen' && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'warning.light', borderRadius: 2, bgcolor: 'warning.50' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip label="Inleen" color="warning" size="small" />
                        <Typography variant="subtitle2">{t('inleen.sectionTitle')}</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Controller name="InleenLendingCompanyId" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('inleen.lendingCompany')} fullWidth size="small"
                                        placeholder={t('inleen.lendingPlaceholder')}
                                        error={!!errors.InleenLendingCompanyId}
                                        helperText={errors.InleenLendingCompanyId?.message || t('inleen.lendingHelper')} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="InleenBorrowingCompanyId" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('inleen.borrowingCompany')} fullWidth size="small"
                                        placeholder={t('inleen.borrowingPlaceholder')}
                                        helperText={t('inleen.borrowingHelper')} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="InleenHourlyRate" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('inleen.hourlyRate')} fullWidth size="small"
                                        type="number" inputProps={{ min: 0, step: 0.01 }}
                                        error={!!errors.InleenHourlyRate} helperText={errors.InleenHourlyRate?.message} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="InleenStartDate" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('inleen.startDate')} fullWidth size="small"
                                        type="date" InputLabelProps={{ shrink: true }} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="InleenEndDate" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('inleen.endDate')} fullWidth size="small"
                                        type="date" InputLabelProps={{ shrink: true }} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="InleenWorkDescription" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('inleen.workDescription')} fullWidth size="small" />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="InleenLocation" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('inleen.location')} fullWidth size="small" />
                                )} />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* ── BriefLoonschaal fields ───────────────────────────────────── */}
            {contractType === 'BriefLoonschaal' && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'info.light', borderRadius: 2, bgcolor: 'info.50' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip label="Brief Loonschaal" color="info" size="small" />
                        <Typography variant="subtitle2">{t('brief.sectionTitle')}</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={5}>
                            <Controller name="BriefMonthlySalary" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('brief.monthlySalary')} fullWidth size="small"
                                        type="number" inputProps={{ min: 0, step: 0.01 }}
                                        error={!!errors.BriefMonthlySalary}
                                        helperText={errors.BriefMonthlySalary?.message || t('brief.salaryHelper')} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller name="BriefGrade" control={control} defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label={t('brief.grade')} fullWidth size="small"
                                        placeholder={t('brief.gradePlaceholder')} />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Controller name="BriefExpectedMonthlyHours" control={control} defaultValue={173.33}
                                render={({ field }) => (
                                    <TextField {...field} label={t('brief.expectedHours')} fullWidth size="small"
                                        type="number" inputProps={{ min: 0, step: 0.01 }}
                                        helperText={t('brief.hoursHelper')} />
                                )} />
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
