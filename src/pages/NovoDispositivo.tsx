import React, { useState } from 'react';
import { Box, Container, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import FormularioDispositivo from '../components/FormularioDispositivo';
import { useNavigate } from 'react-router-dom';
import { useOrdemServico } from '../contexts/OrdemServicoContext';
import { useSnackbar } from 'notistack';
import LoadingOverlay from '../components/LoadingOverlay';

const NovoDispositivo: React.FC = () => {
  const navigate = useNavigate();
  const { criarOrdemServico, loading } = useOrdemServico();
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      const novaOrdem = await criarOrdemServico(data);
      
      if (novaOrdem) {
        enqueueSnackbar('Dispositivo registrado com sucesso!', { variant: 'success' });
        navigate(`/checklist/${novaOrdem.id}`);
      } else {
        throw new Error('Não foi possível criar a ordem de serviço');
      }
    } catch (err) {
      console.error('Erro ao criar ordem de serviço:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao registrar o dispositivo');
      enqueueSnackbar('Erro ao registrar dispositivo', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <LoadingOverlay open={loading} message="Registrando dispositivo..." />
      
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Registro de Novo Dispositivo
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <FormularioDispositivo onSubmit={handleSubmit} />
      </Paper>
    </Container>
  );
};

export default NovoDispositivo;