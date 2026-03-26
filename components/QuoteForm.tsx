'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useClients, Client } from '@/hooks/useClients';
import { useCompanies } from '@/hooks/useCompanies';
import { CreateQuoteLineItem, CreateQuoteRequest, QuoteDto } from '@/types/quote';
import AddIcon from '@mui/icons-material/AddRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import dayjs from 'dayjs';

const UNIT_OPTIONS = ['uur', 'rit', 'dag', 'stuk'];

type LineItemRow = CreateQuoteLineItem & { _key: string };

function emptyLine(sortOrder: number): LineItemRow {
    return {
        _key: `${Date.now()}-${sortOrder}`,
        description: '',
        quantity: 1,
        unitLabel: 'uur',
        unitPriceExclVat: 0,
        sortOrder,
    };
}

interface QuoteFormProps {
    initialData?: QuoteDto;
    onSubmit: (data: CreateQuoteRequest) => void;
    isSubmitting: boolean;
    submitLabel: string;
}

export default function QuoteForm({ initialData, onSubmit, isSubmitting, submitLabel }: QuoteFormProps) {
    const t = useTranslations();

    const { data: companiesData } = useCompanies(1, 1000);
    const { data: clientsData } = useClients(1, 1000);
    const companies = companiesData?.data ?? [];
    const clients = clientsData?.data ?? [];

    const [companyId, setCompanyId] = useState(initialData?.companyId ?? '');
    const [useExistingClient, setUseExistingClient] = useState(!!initialData?.clientId);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientName, setClientName] = useState(initialData?.clientName ?? '');
    const [clientEmail, setClientEmail] = useState(initialData?.clientEmail ?? '');
    const [clientAddress, setClientAddress] = useState(initialData?.clientAddress ?? '');
    const [clientPostcode, setClientPostcode] = useState(initialData?.clientPostcode ?? '');
    const [clientCity, setClientCity] = useState(initialData?.clientCity ?? '');
    const [clientCountry, setClientCountry] = useState(initialData?.clientCountry ?? '');
    const [clientKvk, setClientKvk] = useState(initialData?.clientKvk ?? '');
    const [clientBtw, setClientBtw] = useState(initialData?.clientBtw ?? '');

    const [subject, setSubject] = useState(initialData?.subject ?? '');
    const [notes, setNotes] = useState(initialData?.notes ?? '');
    const [vatPercentage, setVatPercentage] = useState(initialData?.vatPercentage ?? 21);
    const [validUntilDate, setValidUntilDate] = useState(
        initialData?.validUntilDate
            ? dayjs(initialData.validUntilDate).format('YYYY-MM-DD')
            : dayjs().add(30, 'day').format('YYYY-MM-DD')
    );

    const [lineItems, setLineItems] = useState<LineItemRow[]>(() => {
        if (initialData?.lineItems?.length) {
            return initialData.lineItems.map((li, idx) => ({
                _key: `init-${idx}`,
                description: li.description,
                quantity: li.quantity,
                unitLabel: li.unitLabel ?? 'uur',
                unitPriceExclVat: li.unitPriceExclVat,
                sortOrder: li.sortOrder,
            }));
        }
        return [emptyLine(0)];
    });

    useEffect(() => {
        if (initialData?.clientId && clients.length) {
            const match = clients.find((c) => c.id === initialData.clientId);
            if (match) {
                setSelectedClient(match);
                setUseExistingClient(true);
            }
        }
    }, [initialData?.clientId, clients]);

    const handleClientSelect = (_: any, client: Client | null) => {
        setSelectedClient(client);
        if (client) {
            setClientName(client.name);
            setClientEmail(client.email ?? '');
            setClientAddress(client.address ?? '');
            setClientPostcode(client.postcode ?? '');
            setClientCity(client.city ?? '');
            setClientCountry(client.country ?? '');
            setClientKvk(client.kvk ?? '');
            setClientBtw(client.btw ?? '');
        }
    };

    const handleLineItemChange = (index: number, field: keyof CreateQuoteLineItem, value: any) => {
        setLineItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const addLineItem = () => {
        setLineItems((prev) => [...prev, emptyLine(prev.length)]);
    };

    const removeLineItem = (index: number) => {
        setLineItems((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, sortOrder: i })));
    };

    const totals = useMemo(() => {
        const totalExclVat = lineItems.reduce(
            (sum, item) => sum + (item.quantity || 0) * (item.unitPriceExclVat || 0),
            0
        );
        const totalVat = totalExclVat * (vatPercentage / 100);
        const totalInclVat = totalExclVat + totalVat;
        return { totalExclVat, totalVat, totalInclVat };
    }, [lineItems, vatPercentage]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const request: CreateQuoteRequest = {
            companyId,
            clientId: useExistingClient ? selectedClient?.id : undefined,
            clientName,
            clientEmail: clientEmail || undefined,
            clientAddress: clientAddress || undefined,
            clientPostcode: clientPostcode || undefined,
            clientCity: clientCity || undefined,
            clientCountry: clientCountry || undefined,
            clientKvk: clientKvk || undefined,
            clientBtw: clientBtw || undefined,
            subject,
            notes: notes || undefined,
            vatPercentage,
            validUntilDate,
            lineItems: lineItems.map((li, idx) => ({
                description: li.description,
                quantity: li.quantity,
                unitLabel: li.unitLabel || undefined,
                unitPriceExclVat: li.unitPriceExclVat,
                sortOrder: idx,
            })),
        };
        onSubmit(request);
    };

    const formatCurrency = (v: number) => `€${v.toFixed(2)}`;

    return (
        <form onSubmit={handleSubmit}>
            {/* Company */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    {t('quotes.form.companySection')}
                </Typography>
                <TextField
                    select
                    fullWidth
                    required
                    label={t('quotes.form.company')}
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    size="small"
                >
                    {companies.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                </TextField>
            </Paper>

            {/* Client */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={500}>
                        {t('quotes.form.clientSection')}
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={useExistingClient}
                                onChange={(e) => {
                                    setUseExistingClient(e.target.checked);
                                    if (!e.target.checked) setSelectedClient(null);
                                }}
                            />
                        }
                        label={t('quotes.form.existingClient')}
                    />
                </Box>

                {useExistingClient ? (
                    <Autocomplete
                        options={clients}
                        value={selectedClient}
                        onChange={handleClientSelect}
                        getOptionLabel={(option) => option.name}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t('quotes.form.selectClient')}
                                size="small"
                                required
                            />
                        )}
                        sx={{ mb: 2 }}
                    />
                ) : (
                    <TextField
                        fullWidth
                        required
                        label={t('quotes.form.clientName')}
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        size="small"
                        sx={{ mb: 2 }}
                    />
                )}

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label={t('quotes.form.clientEmail')} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label={t('quotes.form.clientAddress')} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" label={t('quotes.form.clientPostcode')} value={clientPostcode} onChange={(e) => setClientPostcode(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" label={t('quotes.form.clientCity')} value={clientCity} onChange={(e) => setClientCity(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" label={t('quotes.form.clientCountry')} value={clientCountry} onChange={(e) => setClientCountry(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label={t('quotes.form.clientKvk')} value={clientKvk} onChange={(e) => setClientKvk(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label={t('quotes.form.clientBtw')} value={clientBtw} onChange={(e) => setClientBtw(e.target.value)} />
                    </Grid>
                </Grid>
            </Paper>

            {/* Quote Details */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    {t('quotes.form.detailsSection')}
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField fullWidth required size="small" label={t('quotes.form.subject')} value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label={t('quotes.form.validUntil')}
                            value={validUntilDate}
                            onChange={(e) => setValidUntilDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={t('quotes.form.vatPercentage')}
                            value={vatPercentage}
                            onChange={(e) => setVatPercentage(Number(e.target.value))}
                            inputProps={{ min: 0, max: 100, step: 0.5 }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            rows={3}
                            label={t('quotes.form.notes')}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Line Items */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={500}>
                        {t('quotes.form.lineItemsSection')}
                    </Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={addLineItem}>
                        {t('quotes.form.addLineItem')}
                    </Button>
                </Box>

                {lineItems.map((item, index) => (
                    <Box key={item._key} sx={{ mb: 2 }}>
                        <Grid container spacing={1.5} alignItems="center">
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    required
                                    label={t('quotes.form.lineDescription')}
                                    value={item.description}
                                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={6} sm={2}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    required
                                    label={t('quotes.form.lineQuantity')}
                                    value={item.quantity}
                                    onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                                    inputProps={{ min: 0, step: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={6} sm={2}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    select
                                    label={t('quotes.form.lineUnit')}
                                    value={item.unitLabel ?? 'uur'}
                                    onChange={(e) => handleLineItemChange(index, 'unitLabel', e.target.value)}
                                >
                                    {UNIT_OPTIONS.map((u) => (
                                        <MenuItem key={u} value={u}>
                                            {t(`quotes.units.${u}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={6} sm={2}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    required
                                    label={t('quotes.form.lineUnitPrice')}
                                    value={item.unitPriceExclVat}
                                    onChange={(e) => handleLineItemChange(index, 'unitPriceExclVat', Number(e.target.value))}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={4} sm={1.5}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                                    {formatCurrency((item.quantity || 0) * (item.unitPriceExclVat || 0))}
                                </Typography>
                            </Grid>
                            <Grid item xs={2} sm={0.5}>
                                {lineItems.length > 1 && (
                                    <Tooltip title={t('quotes.form.removeLineItem')}>
                                        <IconButton size="small" color="error" onClick={() => removeLineItem(index)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                {/* Totals */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Typography variant="body2">
                        {t('quotes.form.subtotal')}: {formatCurrency(totals.totalExclVat)}
                    </Typography>
                    <Typography variant="body2">
                        {t('quotes.form.vatAmount', { percentage: vatPercentage })}: {formatCurrency(totals.totalVat)}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                        {t('quotes.form.totalInclVat')}: {formatCurrency(totals.totalInclVat)}
                    </Typography>
                </Box>
            </Paper>

            {/* Submit */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting || !companyId || !clientName || !subject}
                >
                    {isSubmitting ? t('quotes.form.submitting') : submitLabel}
                </Button>
            </Box>
        </form>
    );
}
