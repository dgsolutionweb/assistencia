import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Tooltip,
  Container,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Add as AddIcon, 
  Dashboard as DashboardIcon,
  List as ListIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationOnIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useOrdemServico } from '../contexts/OrdemServicoContext';
import { format } from 'date-fns';
import KanbanBoard from '../components/KanbanBoard';
import LoadingOverlay from '../components/LoadingOverlay';

const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  pendente: 'warning',
  em_analise: 'info',
  em_reparo: 'secondary',
  aguardando_peca: 'default',
  concluido: 'success',
  entregue: 'primary'
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  em_reparo: 'Em Reparo',
  aguardando_peca: 'Aguardando Peça',
  concluido: 'Concluído',
  entregue: 'Entregue'
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ height: 'calc(100vh - 180px)' }}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { 
    ordensServico, 
    loading, 
    obterTodasOrdens, 
    filtrarOrdensPorStatus,
    recarregarOrdens 
  } = useOrdemServico();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    pendentes: 0,
    emAndamento: 0,
    concluidos: 0
  });

  // Carrega os dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      await recarregarOrdens();
      atualizarEstatisticas();
    };
    
    carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removendo a dependência recarregarOrdens que causa o loop infinito

  // Atualiza as estatísticas quando as ordens mudam
  useEffect(() => {
    atualizarEstatisticas();
  }, [ordensServico]);

  // Filtrando as ordens com base no termo de busca
  const ordensFiltradas = ordensServico.filter(ordem => 
    ordem.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.dispositivo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.dispositivo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.problemaRelatado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para atualizar estatísticas
  const atualizarEstatisticas = () => {
    setEstatisticas({
      total: ordensServico.length,
      pendentes: ordensServico.filter(o => o.status === 'pendente' || o.status === 'em_analise').length,
      emAndamento: ordensServico.filter(o => o.status === 'em_reparo' || o.status === 'aguardando_peca').length,
      concluidos: ordensServico.filter(o => o.status === 'concluido' || o.status === 'entregue').length
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNovoDispositivo = () => {
    navigate('/novo');
  };

  const handleForceRefresh = async () => {
    setAtualizando(true);
    await recarregarOrdens();
    setTimeout(() => {
      setAtualizando(false);
    }, 500);
  };

  // Obtém estatísticas básicas
  const totalAparelhos = estatisticas.total;
  const emAnaliseOuReparo = estatisticas.emAndamento;
  const concluidos = estatisticas.concluidos;
  const aguardandoPecas = ordensServico.filter(o => o.status === 'aguardando_peca').length;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <LoadingOverlay open={loading} message="Carregando ordens de serviço..." />
      
      <AppBar position="static" sx={{ 
        background: 'linear-gradient(90deg, #1976d2 0%, #0d47a1 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <Toolbar>
          <Box display="flex" alignItems="center">
            <PhoneAndroidIcon sx={{ mr: 2, fontSize: 28 }} />
            <Typography variant="h5" component="div" sx={{ 
              flexGrow: 1, 
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              DGAssistência
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            color="inherit" 
            startIcon={<AddIcon />}
            sx={{ 
              borderRadius: '24px', 
              px: 2,
              py: 1,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
            onClick={handleNovoDispositivo}
          >
            Novo Dispositivo
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2" sx={{ mb: 1 }}>
                      TOTAL DE DISPOSITIVOS
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {totalAparelhos}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#e3f2fd', p: 1 }}>
                    <PhoneAndroidIcon sx={{ color: '#1976d2' }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2" sx={{ mb: 1 }}>
                      EM ANÁLISE/REPARO
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: '#ff9800' }}>
                      {emAnaliseOuReparo}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#fff3e0', p: 1 }}>
                    <DashboardIcon sx={{ color: '#ff9800' }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2" sx={{ mb: 1 }}>
                      AGUARDANDO PEÇAS
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: '#ec407a' }}>
                      {aguardandoPecas}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#fce4ec', p: 1 }}>
                    <LocationOnIcon sx={{ color: '#ec407a' }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="subtitle2" sx={{ mb: 1 }}>
                      CONCLUÍDOS
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: '#4caf50' }}>
                      {concluidos}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#e8f5e9', p: 1 }}>
                    <CheckIcon sx={{ color: '#4caf50' }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          mt: 1
        }}>
          <TextField
            placeholder="Buscar por cliente, dispositivo ou problema..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              width: '40%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                },
                '&.Mui-focused': {
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            startIcon={atualizando ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={handleForceRefresh}
            disabled={atualizando || loading}
            sx={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
              textTransform: 'none',
              padding: '8px 16px',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            Atualizar Dados
          </Button>
        </Box>

        <Box sx={{ width: '100%', mt: 2 }}>
          <Paper sx={{ 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
          }}>
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              backgroundColor: '#f8fafc'
            }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="visualização de ordens"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '15px',
                    fontWeight: 500,
                    minHeight: '48px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  },
                  '& .Mui-selected': {
                    color: '#1976d2',
                    fontWeight: 600
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1976d2',
                    height: 3
                  }
                }}
              >
                <Tab 
                  icon={<ListIcon />} 
                  iconPosition="start" 
                  label="Lista de Ordens" 
                  {...a11yProps(0)} 
                />
                <Tab 
                  icon={<DashboardIcon />} 
                  iconPosition="start" 
                  label="Quadro Kanban" 
                  {...a11yProps(1)} 
                />
              </Tabs>
            </Box>
            <TabPanel value={tabValue} index={0}>
              <TableContainer sx={{ maxHeight: 'calc(100vh - 360px)' }}>
                <Table sx={{ minWidth: 650 }} aria-label="tabela de ordens de serviço" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        backgroundColor: '#f8fafc',
                        color: '#455a64'
                      }}>Cliente</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        backgroundColor: '#f8fafc',
                        color: '#455a64'
                      }}>Dispositivo</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        backgroundColor: '#f8fafc',
                        color: '#455a64'
                      }}>Problema</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        backgroundColor: '#f8fafc',
                        color: '#455a64'
                      }}>Data</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        backgroundColor: '#f8fafc',
                        color: '#455a64'
                      }}>Status</TableCell>
                      <TableCell align="center" sx={{ 
                        fontWeight: 600, 
                        backgroundColor: '#f8fafc',
                        color: '#455a64'
                      }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordensFiltradas.length > 0 ? (
                      ordensFiltradas.map((ordem) => (
                        <TableRow 
                          key={ordem.id} 
                          hover
                          sx={{
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              backgroundColor: '#f5f8fe'
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body1">{ordem.cliente.nome}</Typography>
                                <Typography variant="body2" color="text.secondary">{ordem.cliente.telefone}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'secondary.light' }}>
                                <PhoneAndroidIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body1">{ordem.dispositivo.marca}</Typography>
                                <Typography variant="body2" color="text.secondary">{ordem.dispositivo.modelo}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ordem.problemaRelatado}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {ordem.dataAtualizacao ? (
                              <Tooltip title={`Entrada: ${format(new Date(ordem.dataEntrada), 'dd/MM/yyyy')}`}>
                                <Typography variant="body2">
                                  Atualizado: {format(new Date(ordem.dataAtualizacao), 'dd/MM/yyyy')}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2">
                                {format(new Date(ordem.dataEntrada), 'dd/MM/yyyy')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={statusLabels[ordem.status] || ordem.status.replace('_', ' ')}
                              color={statusColors[ordem.status] || 'default'}
                              size="small"
                            />
                            {ordem.localizacaoFisica && (
                              <>
                                <Tooltip title={`Localização: ${ordem.localizacaoFisica}`}>
                                  <LocationOnIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle', color: 'text.secondary' }} />
                                </Tooltip>
                                {ordem.status === 'concluido' && (
                                  <Chip
                                    icon={<LocationOnIcon />}
                                    label={ordem.localizacaoFisica}
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              component={Link}
                              to={`/checklist/${ordem.id}`}
                              startIcon={<VisibilityIcon />}
                              size="small"
                              variant="outlined"
                            >
                              Checklist
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          {searchTerm ? (
                            <Typography variant="body1">Nenhuma ordem encontrada para "{searchTerm}"</Typography>
                          ) : (
                            <Typography variant="body1">Nenhuma ordem de serviço cadastrada</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <KanbanBoard />
            </TabPanel>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;