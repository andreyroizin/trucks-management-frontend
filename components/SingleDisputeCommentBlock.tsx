import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Button, Divider, TextField, Typography } from '@mui/material';
import DisputeComment from '@/components/DisputeComment';

interface Props {
    comment: any;
    onAccept: () => void;
    onSubmit: (comment: string) => void;
    posting: boolean;
}

export default function SingleDisputeCommentBlock({ comment, onAccept, onSubmit, posting }: Props) {
    const t = useTranslations('disputes.comment');
    const [showForm, setShowForm] = useState(false);
    const [value, setValue] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = () => {
        if (!value.trim()) {
            setError(true);
            return;
        }
        setError(false);
        onSubmit(value);
    };

    return (
        <>
            <DisputeComment comment={comment} isLast />
            {!showForm ? (
                <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        sx={{ flex: 1 }}
                        onClick={onAccept}
                    >
                        {t('acceptCorrection')}
                    </Button>
                    <Button
                        variant="text"
                        color="primary"
                        fullWidth
                        sx={{ flex: 1 }}
                        onClick={() => setShowForm(true)}
                    >
                        {t('dispute')}
                    </Button>
                </Box>
            ) : (
                <Box mt={2}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        {t('explainTitle')}
                    </Typography>
                    <TextField
                        label={t('explainLabel')}
                        multiline
                        required
                        fullWidth
                        rows={4}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        error={error}
                        helperText={error ? t('explainRequired') : ''}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={posting}
                    >
                        {t('submit')}
                    </Button>
                </Box>
            )}
        </>
    );
}
