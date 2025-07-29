'use client';

import {useEffect, useState} from 'react';
import { useUsers } from '@/hooks/useUsers';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useRouter } from 'next/navigation';
import {useAuth} from "@/hooks/useAuth";
import { useTranslations } from 'next-intl';

export default function UsersPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState(0); // Zero-based index for the page
  const [rowsPerPage, setRowsPerPage] = useState(10); // Results per page
  const router = useRouter();
  const t = useTranslations('users.overview');

  const { data, isLoading, isError } = useUsers(page + 1, rowsPerPage); // Adjust API's 1-based page number

  useEffect(() => {
    const allowedRoles = ['globalAdmin', 'customerAdmin'];
    const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

    if (!loading && (!isAuthenticated || !hasAccess)) {
      router.push('/auth/login'); // Redirect to login if not authorized
    }
  }, [isAuthenticated, loading, user, router]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page when changing page size
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
          <CircularProgress />
        </div>
    );
  }

  if (isError) {
    return (
        <div className="flex justify-center items-center min-h-screen">
          <Alert severity="error">{t('loadError')}</Alert>
        </div>
    );
  }

  return (
      <div className="p-6">
        <Typography variant="h4" gutterBottom>
          {t('title')}
        </Typography>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('table.headers.id')}</TableCell>
                  <TableCell>{t('table.headers.email')}</TableCell>
                  <TableCell>{t('table.headers.firstName')}</TableCell>
                  <TableCell>{t('table.headers.lastName')}</TableCell>
                  <TableCell>{t('table.headers.companyName')}</TableCell>
                  <TableCell>{t('table.headers.roles')}</TableCell>
                  <TableCell>{t('table.headers.edit')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>{user.companyName}</TableCell>
                      <TableCell>{user.roles.join(', ')}</TableCell>
                      <TableCell>
                        <IconButton
                            color="primary"
                            onClick={() => router.push(`/users/edit?id=${user.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
              rowsPerPageOptions={[5, 10, 20, 50]}
              component="div"
              count={data?.totalUsers || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </div>
  );
}
