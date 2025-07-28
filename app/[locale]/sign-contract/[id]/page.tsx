'use client';

import React, {Suspense, useEffect, useState, useRef} from 'react';
import {useParams, useSearchParams} from 'next/navigation';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    Button,
    TextField,
    Paper,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import dynamic from 'next/dynamic';
import type {SignatureCanvasProps, SignatureCanvas} from 'react-signature-canvas';

import {usePublicContractDetail} from '@/hooks/usePublicContractDetail';
import {useSignPublicContract} from '@/hooks/useSignPublicContract';
import {generateContractPdf} from "@/utils/pdf/generateContractPdf";
import { useTranslations } from 'next-intl';

// We must dynamically import SignatureCanvas in Next.js
const SignatureCanvasComponent = dynamic(
    () => import('react-signature-canvas'),
    {ssr: false, loading: () => <div>Loading...</div>}
) as unknown as React.ForwardRefExoticComponent<
    SignatureCanvasProps & React.RefAttributes<SignatureCanvas>
>;

function SignContractPageInner() {
    const params = useParams(); // { id }
    const searchParams = useSearchParams();
    const contractId = params?.id as string || '';
    const codeFromUrl = searchParams?.get('access') || '';
    const t = useTranslations('signContract');

    // If codeFromUrl is invalid or empty, user must type it. If it’s correct but leads to error => we also ask user again
    const [accessCode, setAccessCode] = useState(codeFromUrl);
    const [userCode, setUserCode] = useState('');
    const [usingUrlCode, setUsingUrlCode] = useState(!!codeFromUrl);
    const [manuallyAsked, setManuallyAsked] = useState(false);
    const signatureRef = useRef<SignatureCanvas | null>(null);
    const contractRef = useRef<HTMLDivElement>(null);
    // Attempt to fetch contract with code if usingUrlCode or if user pressed "View"
    const canFetch = (usingUrlCode && codeFromUrl) || (!usingUrlCode && accessCode);

    const {
        data: contractData,
        isLoading,
        isError,
        error
    } = usePublicContractDetail(contractId, canFetch ? accessCode : '');

    // If there's an error => let user type a code manually
    useEffect(() => {
        if (isError) {
            setManuallyAsked(true);
            setUsingUrlCode(false);
        }
    }, [isError]);

    const handleViewContract = () => {
        setAccessCode(userCode);
        setUsingUrlCode(false);
    };

    // Signing logic
    const {mutateAsync: signContract, isPending: signing} = useSignPublicContract();
    const [agree, setAgree] = useState(false);

    const handleSign = async () => {
        if (!signatureRef.current) {
            alert(t('signature.alerts.noSignaturePad'));
            return;
        }
        if (!agree) {
            alert(t('signature.alerts.mustAgree'));
            return;
        }
        // Ensure user has actually drawn something
        if (signatureRef.current.isEmpty()) {
            alert(t('signature.alerts.provideSignature'));
            return;
        }
        const signature = signatureRef.current.toDataURL();

        if (!contractRef.current) {
            alert(t('signature.alerts.contractNotRendered'));
            return;
        }

        const pdfBlob = await generateContractPdf(contractRef.current);

        try {
            await signContract({
                contractId,
                accessCode,
                signature,
                pdfFile: pdfBlob
            });
            alert(t('signature.alerts.success'));
        } catch (err: any) {
            alert(err.message || t('signature.alerts.error'));
        }
    };

    const handleClearSignature = () => {
        signatureRef.current?.clear();
    };

    // If the code from URL is invalid or missing and user hasn't typed a code, show input
    if (!canFetch && !manuallyAsked) {
        return (
            <Box textAlign="center" mt={4}>
                <Typography variant="h6" mb={2}>
                    {t('noAccessCode.title')}
                </Typography>
                <Button variant="contained" onClick={() => setManuallyAsked(true)}>
                    {t('noAccessCode.button')}
                </Button>
            </Box>
        );
    }

    // If user must type a code
    if (manuallyAsked && !contractData) {
        return (
            <Box display="flex" flexDirection="column" maxWidth="400px" mx="auto" mt={4}>
                <Typography variant="h6" mb={2}>
                    {t('enterCode.title')}
                </Typography>
                {isError && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {error?.message || t('enterCode.error')}
                    </Alert>
                )}
                <TextField
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    label={t('enterCode.label')}
                    fullWidth
                    margin="normal"
                />
                <Button variant="contained" onClick={handleViewContract}>
                    {t('enterCode.button')}
                </Button>
            </Box>
        );
    }

    // Loading
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress/>
            </Box>
        );
    }

    // If we STILL have error
    if (isError || !contractData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Alert severity="error">
                    {error?.message || t('loadError')}
                </Alert>
            </Box>
        );
    }

    // Show the contract "on paper" with signature
    return (
        <Box maxWidth="700px" mx="auto" mt={4} mb={4}>
            <Paper sx={{p: 2}} ref={contractRef}>
                <Typography variant="h4" mb={2} align="center">
                    {t('title')}
                </Typography>

                {/* Basic fields for demonstration */}
                <Typography variant="body1" gutterBottom>
                    <strong>{t('contract.fields.contractId')}: </strong>{contractData.id}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    <strong>{t('contract.fields.employeeName')}: </strong>
                    {contractData.employeeFirstName} {contractData.employeeLastName}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    <strong>{t('contract.fields.companyName')}: </strong>
                    {contractData.companyName || t('contract.notAvailable')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    <strong>{t('contract.fields.function')}: </strong>
                    {contractData.function || t('contract.notAvailable')}
                </Typography>

                {/* Use below page breaker to break the page and add a new one */}
                {/*<div className="pdf-page-break" />   /!* <‑‑ forced break *!/*/}

                {/* Show signature button or pad */}
                <>
                    <Box mt={2}>
                        <Typography>{t('signature.instruction')}</Typography>
                        <SignatureCanvasComponent
                            ref={signatureRef}
                            penColor="black"
                            canvasProps={{
                                width: 500,
                                height: 200,
                                style: {border: '1px solid #ccc'},
                            }}
                        />
                        <Box mt={1}>
                            <Button variant="outlined" onClick={handleClearSignature}>
                                {t('signature.clearButton')}
                            </Button>
                        </Box>
                    </Box>
                    <FormControlLabel
                        sx={{mt: 2}}
                        control={
                            <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)}/>
                        }
                        label={t('signature.agreementLabel')}
                    />
                    <Button
                        variant="contained"
                        sx={{mt: 2}}
                        disabled={signing}
                        onClick={handleSign}
                    >
                        {signing ? t('signature.signing') : t('signature.signButton')}
                    </Button>
                </>
            </Paper>
        </Box>
    );
}

// ### Page Export with Suspense ###
// Because we use searchParams in Next13 app router, let's wrap it in a Suspense
export default function SignContractPage() {
    return (
        <Suspense fallback={<LoadingFallback/>}>
            <SignContractPageInner/>
        </Suspense>
    );
}

function LoadingFallback() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress/>
        </Box>
    );
}
