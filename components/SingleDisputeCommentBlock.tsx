import React, { useState } from 'react';
import { Box, Button, Divider, TextField, Typography } from '@mui/material';
import DisputeComment from '@/components/DisputeComment';

interface Props {
    comment: any;
    onAccept: () => void;
    onSubmit: (comment: string) => void;
    posting: boolean;
}

export default function SingleDisputeCommentBlock({ comment, onAccept, onSubmit, posting }: Props) {
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
                        Accept Correction
                    </Button>
                    <Button
                        variant="text"
                        color="primary"
                        fullWidth
                        sx={{ flex: 1 }}
                        onClick={() => setShowForm(true)}
                    >
                        Dispute
                    </Button>
                </Box>
            ) : (
                <Box mt={2}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Explain why it’s wrong
                    </Typography>
                    <TextField
                        label="Explain the issue"
                        multiline
                        required
                        fullWidth
                        rows={4}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        error={error}
                        helperText={error ? 'This field is required.' : ''}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={posting}
                    >
                        Submit
                    </Button>
                </Box>
            )}
        </>
    );
}
