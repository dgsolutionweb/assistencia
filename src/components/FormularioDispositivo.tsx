import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Paper,
  SelectChangeEvent,
  OutlinedInput,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress
} from '@mui/material';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import { useOrdemServico } from '../contexts/OrdemServicoContext';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { clienteService } from '../services';

const acessoriosDisponiveis = [
  'Carregador', 
  'Cabo USB', 
  'Fone de ouvido', 
  'Caixa original', 
  'Cartão de memória', 
  'Capinha/Case', 
  'Película de proteção'
];

// Array de marcas comuns de smartphones
const marcasDisponiveis = [
  'Apple', 
  'Samsung', 
  'Xiaomi', 
  'Motorola', 
  'LG',
  'Asus',
  'Sony', 
  'Nokia', 
  'Huawei', 
  'OnePlus',
  'Realme',
  'Lenovo',
  'Outra'
];

interface FormularioDispositivoProps {
  onSubmit?: (data: any) => void;
}

const FormularioDispositivo: React.FC<FormularioDispositivoProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const { criarOrdemServico, loading } = useOrdemServico();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteExistente, setClienteExistente] = useState<any>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  const [cliente, setCliente] = useState({
    nome: '',
    telefone: '',
    email: ''
  });

  const [dispositivo, setDispositivo] = useState({
    marca: '',
    modelo: '',
    imei: '',
    serial: '',
    senha: '',
    acessorios: [] as string[],
    condicaoExterna: ''
  });

  const [problemaRelatado, setProblemaRelatado] = useState('');
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState('');

  // Validação de campos por etapa
  const validarEtapa = (etapa: number) => {
    switch (etapa) {
      case 0: // Etapa do cliente
        return cliente.nome.trim() !== '' && cliente.telefone.trim() !== '';
      case 1: // Etapa do dispositivo
        return dispositivo.marca.trim() !== '' && 
               dispositivo.modelo.trim() !== '' && 
               dispositivo.condicaoExterna.trim() !== '';
      case 2: // Etapa da OS
        return problemaRelatado.trim() !== '' && tecnicoResponsavel.trim() !== '';
      default:
        return false;
    }
  };

  // Busca cliente pelo telefone quando o campo é preenchido
  useEffect(() => {
    const buscarClientePorTelefone = async () => {
      if (cliente.telefone && cliente.telefone.length >= 8) {
        try {
          setBuscandoCliente(true);
          const clientesEncontrados = await clienteService.listarClientes({
            telefone: cliente.telefone
          });
          
          if (clientesEncontrados && clientesEncontrados.length > 0) {
            const clienteEncontrado = clientesEncontrados[0];
            setClienteExistente(clienteEncontrado);
            
            // Preenche automaticamente o nome e email se o cliente for encontrado
            // mas ainda não tiver sido preenchido pelo usuário
            if (!cliente.nome) {
              setCliente(prev => ({
                ...prev,
                nome: clienteEncontrado.nome,
                email: clienteEncontrado.email || ''
              }));
              enqueueSnackbar('Cliente encontrado! Dados preenchidos automaticamente.', { 
                variant: 'info' 
              });
            }
          } else {
            setClienteExistente(null);
          }
        } catch (error) {
          console.error('Erro ao buscar cliente:', error);
        } finally {
          setBuscandoCliente(false);
        }
      }
    };
    
    const timeoutId = setTimeout(() => {
      buscarClientePorTelefone();
    }, 500); // Delay para evitar muitas requisições enquanto o usuário digita
    
    return () => clearTimeout(timeoutId);
  }, [cliente.telefone, enqueueSnackbar]);

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleDispositivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDispositivo(prev => ({ ...prev, [name]: value }));
  };

  const handleMarcaChange = (event: SelectChangeEvent<string>) => {
    setDispositivo(prev => ({
      ...prev,
      marca: event.target.value,
    }));
  };

  const handleAcessoriosChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setDispositivo(prev => ({
      ...prev,
      acessorios: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Cria o objeto com os dados do formulário
      const novaOrdemData = {
        cliente: {
          id: clienteExistente?.id, // Inclui o ID se for um cliente existente
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email || undefined
        },
        dispositivo: {
          marca: dispositivo.marca,
          modelo: dispositivo.modelo,
          imei: dispositivo.imei || undefined,
          serial: dispositivo.serial || undefined,
          senha: dispositivo.senha || undefined,
          acessorios: dispositivo.acessorios,
          condicaoExterna: dispositivo.condicaoExterna
        },
        problemaRelatado: problemaRelatado,
        tecnicoResponsavel: tecnicoResponsavel
      };
      
      // Se tiver uma função onSubmit, use-a, caso contrário, use o comportamento padrão
      if (onSubmit) {
        onSubmit(novaOrdemData);
      } else {
        // Comportamento padrão se onSubmit não for fornecido
        const novaOrdem = await criarOrdemServico(novaOrdemData);
        if (novaOrdem) {
          enqueueSnackbar('Ordem de serviço criada com sucesso!', { variant: 'success' });
          navigate(`/checklist/${novaOrdem.id}`);
        } else {
          throw new Error('Não foi possível criar a ordem de serviço');
        }
      }
      
      setActiveStep(3); // Vai para o passo de confirmação
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      enqueueSnackbar('Erro ao criar ordem de serviço', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Dados do Cliente', 'Dados do Dispositivo', 'Problema Relatado'];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    bgcolor: '#e3f2fd', 
                    color: '#1976d2', 
                    p: 1.5, 
                    borderRadius: '50%', 
                    mr: 2 
                  }}
                >
                  <PersonIcon />
                </Box>
                <Typography variant="h6" fontWeight={500}>
                  Informações do Cliente
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Nome do Cliente"
                    name="nome"
                    value={cliente.nome}
                    onChange={handleClienteChange}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                    helperText="Nome completo do cliente"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Telefone"
                    name="telefone"
                    value={cliente.telefone}
                    onChange={handleClienteChange}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                    helperText="Telefone de contato com DDD"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    name="email"
                    type="email"
                    value={cliente.email}
                    onChange={handleClienteChange}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                    helperText="E-mail opcional para contato"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    bgcolor: '#f3e5f5', 
                    color: '#9c27b0', 
                    p: 1.5, 
                    borderRadius: '50%', 
                    mr: 2 
                  }}
                >
                  <PhoneAndroidIcon />
                </Box>
                <Typography variant="h6" fontWeight={500}>
                  Informações do Dispositivo
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl required fullWidth>
                    <InputLabel id="marca-label">Marca</InputLabel>
                    <Select
                      labelId="marca-label"
                      value={dispositivo.marca}
                      onChange={handleMarcaChange}
                      input={<OutlinedInput label="Marca" sx={{ borderRadius: 1.5 }} />}
                    >
                      {marcasDisponiveis.map((marca) => (
                        <MenuItem key={marca} value={marca}>
                          {marca}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Modelo"
                    name="modelo"
                    value={dispositivo.modelo}
                    onChange={handleDispositivoChange}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IMEI/MEID"
                    name="imei"
                    value={dispositivo.imei}
                    onChange={handleDispositivoChange}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                    helperText="Digite *#06# no teclado do aparelho para ver o IMEI"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Número de Série"
                    name="serial"
                    value={dispositivo.serial}
                    onChange={handleDispositivoChange}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Senha/Padrão (se necessário)"
                    name="senha"
                    value={dispositivo.senha}
                    onChange={handleDispositivoChange}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Acessórios Entregues</InputLabel>
                    <Select
                      multiple
                      value={dispositivo.acessorios}
                      onChange={handleAcessoriosChange}
                      input={<OutlinedInput label="Acessórios Entregues" sx={{ borderRadius: 1.5 }} />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {acessoriosDisponiveis.map((acessorio) => (
                        <MenuItem key={acessorio} value={acessorio}>
                          {acessorio}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Condição Externa"
                    name="condicaoExterna"
                    multiline
                    rows={3}
                    value={dispositivo.condicaoExterna}
                    onChange={handleDispositivoChange}
                    placeholder="Descreva a condição externa do dispositivo (arranhões, danos, etc.)"
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    bgcolor: '#e8f5e9', 
                    color: '#4caf50', 
                    p: 1.5, 
                    borderRadius: '50%', 
                    mr: 2 
                  }}
                >
                  <SettingsIcon />
                </Box>
                <Typography variant="h6" fontWeight={500}>
                  Informações da Ordem de Serviço
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Problema Relatado"
                    multiline
                    rows={3}
                    value={problemaRelatado}
                    onChange={(e) => setProblemaRelatado(e.target.value)}
                    variant="outlined"
                    placeholder="Descreva o problema relatado pelo cliente de forma detalhada"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Técnico Responsável"
                    value={tecnicoResponsavel}
                    onChange={(e) => setTecnicoResponsavel(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                  Após cadastrar o dispositivo, você será redirecionado para o preenchimento do checklist.
                </Alert>
              </Box>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Box 
      component="div" 
      sx={{ 
        maxWidth: 900, 
        mx: 'auto', 
        p: 3,
        borderRadius: 2
      }}
    >
      <Paper 
        elevation={2} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)',
          }
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{ 
            color: '#1976d2', 
            fontWeight: 500,
            mb: 4 
          }}
        >
          Cadastro de Novo Dispositivo
        </Typography>

        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          sx={{ 
            mb: 4,
            '& .MuiStepLabel-label': {
              mt: 1
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || isSubmitting}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Voltar
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!validarEtapa(activeStep) || isSubmitting || loading}
              endIcon={isSubmitting || loading ? <CircularProgress size={20} /> : <CheckIcon />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                px: 4,
                py: 1.2,
                boxShadow: '0 4px 6px rgba(32, 101, 209, 0.2)',
              }}
            >
              {isSubmitting || loading ? 'Processando...' : 'Finalizar Cadastro'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validarEtapa(activeStep)}
              endIcon={<ArrowForwardIcon />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              Próximo
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default FormularioDispositivo; 