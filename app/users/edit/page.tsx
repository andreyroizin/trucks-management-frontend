'use client';

import { useSearchParams } from 'next/navigation';
import { Typography } from '@mui/material';

export default function EditUserPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <Typography variant="h4" gutterBottom>
          Edit User
        </Typography>
        <Typography variant="body1">User ID: {userId}</Typography>
      </div>
  );
}
