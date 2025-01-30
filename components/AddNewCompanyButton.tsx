'use client';

import React from 'react';
import { Button } from '@mui/material';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';

const AddNewButton: React.FC = () => {
    return (
        <Link href="/companies/create" passHref>
            <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                sx={{ mb: 2 }}
            >
                Add New Company
            </Button>
        </Link>
    );
};

export default AddNewButton;
