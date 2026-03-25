'use client';

import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Grid,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
} from '@mui/material';
import { Controller, Control, UseFormWatch } from 'react-hook-form';
import { CONTRACT_TYPE_OPTIONS, ContractTypeValue } from '@/constants/contractTypes';

interface ContractTypeSectionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: Control<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watch: UseFormWatch<any>;
    errors?: Record<string, any>;
    // Optional company options for Inleen company selectors
    companyOptions?: { id: string; name: string }[];
}

/**
 * Reusable contract-type selector + conditional type-specific fields.
 * Renders inside a form; uses react-hook-form Controller for each field.
 */
export default function ContractTypeSection({
    control,
    watch,
    errors = {},
    companyOptions = [],
}: ContractTypeSectionProps) {
    const contractType: ContractTypeValue = watch('ContractType') ?? 'CAO';

    return (
        <Box>
            {/* ── Contract Type Selector ──────────────────────────────────── */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Contract Type
            </Typography>

            <Controller
                name="ContractType"
                control={control}
                defaultValue="CAO"
                render={({ field }) => (
                    <ToggleButtonGroup
                        value={field.value}
                        exclusive
                        onChange={(_, val) => { if (val) field.onChange(val); }}
                        sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}
                    >
                        {CONTRACT_TYPE_OPTIONS.map((opt) => (
                            <ToggleButton
                                key={opt.value}
                                value={opt.value}
                                sx={{
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: field.value === opt.value ? 700 : 400,
                                }}
                            >
                                <Box>
                                    <Typography variant="body2" fontWeight="inherit">
                                        {opt.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {opt.description}
                                    </Typography>
                                </Box>
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                )}
            />

            {/* ── ZZP fields ──────────────────────────────────────────────── */}
            {contractType === 'ZZP' && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'success.light', borderRadius: 2, bgcolor: 'success.50' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip label="ZZP" color="success" size="small" />
                        <Typography variant="subtitle2">ZZP Gegevens</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="ZzpBtwNumber"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="BTW-nummer *"
                                        fullWidth
                                        size="small"
                                        placeholder="NL123456789B01"
                                        error={!!errors.ZzpBtwNumber}
                                        helperText={errors.ZzpBtwNumber?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="ZzpKvkNumber"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="KvK-nummer *"
                                        fullWidth
                                        size="small"
                                        placeholder="12345678"
                                        error={!!errors.ZzpKvkNumber}
                                        helperText={errors.ZzpKvkNumber?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="ZzpHourlyRateExclBtw"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Uurtarief excl. BTW (€) *"
                                        fullWidth
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, step: 0.01 }}
                                        error={!!errors.ZzpHourlyRateExclBtw}
                                        helperText={errors.ZzpHourlyRateExclBtw?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="ZzpBtwPercentage"
                                control={control}
                                defaultValue={21}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="BTW % (standaard 21)"
                                        fullWidth
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, max: 100, step: 1 }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="ZzpMediationFeePerWeek"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Bemiddelingsvergoeding/week (€)"
                                        fullWidth
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, step: 0.01 }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="ZzpContractNumber"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Contractnummer"
                                        fullWidth
                                        size="small"
                                        placeholder="20260201-01"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="ZzpLocation"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Locatie"
                                        fullWidth
                                        size="small"
                                        placeholder="Nederland"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="ZzpWorkDescription"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Omschrijving werkzaamheden"
                                        fullWidth
                                        size="small"
                                        placeholder="Vervoer van goederen over de weg"
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* ── Inleen fields ────────────────────────────────────────────── */}
            {contractType === 'Inleen' && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'warning.light', borderRadius: 2, bgcolor: 'warning.50' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip label="Inleen" color="warning" size="small" />
                        <Typography variant="subtitle2">Inleen Gegevens</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="InleenLendingCompanyId"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Uitlener (bedrijf-ID) *"
                                        fullWidth
                                        size="small"
                                        placeholder="UUID van uitleenbedrijf"
                                        error={!!errors.InleenLendingCompanyId}
                                        helperText={errors.InleenLendingCompanyId?.message || 'Bedrijf dat de chauffeur uitleent'}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="InleenBorrowingCompanyId"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Inlener (bedrijf-ID)"
                                        fullWidth
                                        size="small"
                                        placeholder="UUID van inlenend bedrijf"
                                        helperText="Bedrijf dat de chauffeur inleent (optioneel)"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="InleenHourlyRate"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Inleentarief/uur (€) *"
                                        fullWidth
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, step: 0.01 }}
                                        error={!!errors.InleenHourlyRate}
                                        helperText={errors.InleenHourlyRate?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="InleenStartDate"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Inleen startdatum"
                                        fullWidth
                                        size="small"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="InleenEndDate"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Inleen einddatum"
                                        fullWidth
                                        size="small"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="InleenWorkDescription"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Omschrijving werkzaamheden"
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="InleenLocation"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Locatie"
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* ── BriefLoonschaal fields ───────────────────────────────────── */}
            {contractType === 'BriefLoonschaal' && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'info.light', borderRadius: 2, bgcolor: 'info.50' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip label="Brief Loonschaal" color="info" size="small" />
                        <Typography variant="subtitle2">Loonschaal Gegevens</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={5}>
                            <Controller
                                name="BriefMonthlySalary"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Bruto maandsalaris (€) *"
                                        fullWidth
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, step: 0.01 }}
                                        error={!!errors.BriefMonthlySalary}
                                        helperText={errors.BriefMonthlySalary?.message || 'Vast maandsalaris conform arbeidsbrief'}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="BriefGrade"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Loonschaal (optioneel)"
                                        fullWidth
                                        size="small"
                                        placeholder="Bijv. Schaal 5"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Controller
                                name="BriefExpectedMonthlyHours"
                                control={control}
                                defaultValue={173.33}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Verwachte uren/maand"
                                        fullWidth
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, step: 0.01 }}
                                        helperText="Standaard: 173,33 (40h/week)"
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
