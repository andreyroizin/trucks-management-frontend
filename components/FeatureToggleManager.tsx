'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Switch,
    Typography,
    alpha,
    TablePagination,
    Alert,
} from '@mui/material';
import FoundationIcon from '@mui/icons-material/FoundationRounded';
import CalendarTodayIcon from '@mui/icons-material/CalendarTodayRounded';
import AccountBalanceIcon from '@mui/icons-material/AccountBalanceRounded';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import LockIcon from '@mui/icons-material/LockRounded';
import EmailIcon from '@mui/icons-material/EmailRounded';
import BusinessIcon from '@mui/icons-material/BusinessRounded';
import { DebouncedSearchInput } from '@/components/DebouncedSearchInput';
import { FEATURE_MODULES, type FeatureModuleId } from '@/utils/constants/featureModules';
import { useCustomerAdmins, type CustomerAdmin } from '@/hooks/useCustomerAdmins';
import { useAdminModules, useToggleAdminModule, type AdminModuleDto } from '@/hooks/useFeatureModules';

// ── Icon map ────────────────────────────────
const MODULE_ICONS: Record<string, React.ReactNode> = {
    Foundation: <FoundationIcon />,
    CalendarToday: <CalendarTodayIcon />,
    AccountBalance: <AccountBalanceIcon />,
    People: <PeopleIcon />,
};

// ── Module colours ──────────────────────────
const MODULE_COLORS: Record<FeatureModuleId, string> = {
    base: '#607D8B',
    planning: '#1976D2',
    finance: '#2E7D32',
    hr: '#9C27B0',
};

// Map API module names to our local IDs
const MODULE_NAME_TO_ID: Record<string, FeatureModuleId> = {
    Base: 'base',
    Planning: 'planning',
    Finance: 'finance',
    HR: 'hr',
};

const MODULE_ID_TO_NAME: Record<FeatureModuleId, string> = {
    base: 'Base',
    planning: 'Planning',
    finance: 'Finance',
    hr: 'HR',
};

// ── Per-admin card with its own module data ──
function AdminToggleCard({ admin }: { admin: CustomerAdmin }) {
    const t = useTranslations();
    const { data: modules, isLoading: modulesLoading } = useAdminModules(admin.id);
    const { mutate: toggleModule, isPending } = useToggleAdminModule();

    const getInitials = (first: string, last: string) =>
        `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();

    const isModuleEnabled = (moduleId: FeatureModuleId): boolean => {
        if (!modules) return false;
        const apiName = MODULE_ID_TO_NAME[moduleId];
        const mod = modules.find((m) => m.module === apiName);
        return mod?.isEnabled ?? false;
    };

    const enabledCount = modules
        ? modules.filter((m) => m.isEnabled).length
        : 0;

    const handleToggle = (moduleId: FeatureModuleId) => {
        const apiName = MODULE_ID_TO_NAME[moduleId];
        const currentlyEnabled = isModuleEnabled(moduleId);
        toggleModule({
            adminUserId: admin.id,
            module: apiName,
            isEnabled: !currentlyEnabled,
        });
    };

    const companies = admin.contactPersonInfo?.associatedCompanies ?? [];

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 4 },
            }}
        >
            {/* ── Admin header ── */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300', fontSize: 14, fontWeight: 600 }}>
                    {getInitials(admin.firstName, admin.lastName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {admin.firstName} {admin.lastName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {admin.email}
                        </Typography>
                    </Box>
                </Box>
                {!modulesLoading && (
                    <Chip
                        size="small"
                        label={`${enabledCount}/${FEATURE_MODULES.length} ${t('moduleToggles.active')}`}
                        color="default"
                        sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                    />
                )}
            </Box>

            {/* ── Companies ── */}
            {companies.length > 0 && (
                <Box
                    sx={{
                        px: 3,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                    }}
                >
                    <BusinessIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {companies.slice(0, 3).map((company) => (
                            <Chip
                                key={company.id}
                                label={company.name}
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                        ))}
                        {companies.length > 3 && (
                            <Chip
                                label={`+${companies.length - 3}`}
                                size="small"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                        )}
                    </Box>
                </Box>
            )}

            {/* ── Module toggles ── */}
            <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
                {modulesLoading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    FEATURE_MODULES.map((mod) => {
                        const enabled = isModuleEnabled(mod.id);
                        const color = MODULE_COLORS[mod.id];

                        return (
                            <Box
                                key={mod.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    py: 1.25,
                                    px: 1.5,
                                    mb: 1,
                                    borderRadius: 2,
                                    bgcolor: enabled ? alpha(color, 0.06) : 'transparent',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: enabled ? alpha(color, 0.12) : 'grey.100',
                                        color: enabled ? color : 'grey.400',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {MODULE_ICONS[mod.icon] ?? <FoundationIcon />}
                                </Box>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        sx={{ color: enabled ? 'text.primary' : 'text.disabled' }}
                                    >
                                        {t(mod.labelKey)}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: enabled ? 'text.secondary' : 'text.disabled' }}
                                    >
                                        {t(mod.descriptionKey)}
                                    </Typography>
                                </Box>

                                {mod.alwaysOn ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 1 }}>
                                        <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                        <Typography variant="caption" color="text.disabled" fontWeight={500}>
                                            {t('moduleToggles.alwaysIncluded')}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Switch
                                        checked={enabled}
                                        disabled={isPending}
                                        onChange={() => handleToggle(mod.id)}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': { color },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: color,
                                            },
                                        }}
                                    />
                                )}
                            </Box>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}

// ── Main component ──────────────────────────
export default function FeatureToggleManager() {
    const t = useTranslations();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);

    const {
        data: adminsData,
        isLoading,
        isError,
    } = useCustomerAdmins(page, pageSize, search);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return <Alert severity="error" sx={{ mt: 2 }}>{t('moduleToggles.loadError')}</Alert>;
    }

    const admins = adminsData?.data ?? [];

    return (
        <Box>
            <DebouncedSearchInput
                value={search}
                onDebouncedChange={(v) => {
                    setSearch(v);
                    setPage(1);
                }}
                placeholder={t('moduleToggles.searchPlaceholder')}
                size="small"
                sx={{ mb: 3, maxWidth: 320 }}
            />

            <Grid container spacing={3}>
                {admins.map((admin) => (
                    <Grid item xs={12} md={6} key={admin.id}>
                        <AdminToggleCard admin={admin} />
                    </Grid>
                ))}

                {admins.length === 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                            <Typography variant="h6">{t('moduleToggles.noResults')}</Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            <TablePagination
                component="div"
                count={adminsData?.totalCount ?? 0}
                page={page - 1}
                onPageChange={(_, newPage) => setPage(newPage + 1)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(e) => {
                    setPage(1);
                    setPageSize(parseInt(e.target.value, 10));
                }}
                rowsPerPageOptions={[6, 9, 12]}
                sx={{ mt: 3 }}
            />
        </Box>
    );
}
