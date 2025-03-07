import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  Divider, 
  IconButton, 
  AppBar, 
  Toolbar, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useOrdemServico } from '../contexts/OrdemServicoContext';
import { verificacaoChecklistService } from '../services';
import { StatusOrdemServico } from '../types';
import LoadingOverlay from '../components/LoadingOverlay';

// Definição de labels e cores para os status
const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  aguardando_aprovacao: 'Aguardando Aprovação',
  aprovado: 'Aprovado',
  em_manutencao: 'Em Manutenção',
  aguardando_peca: 'Aguardando Peça',
  finalizado: 'Finalizado',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};

const statusColors: Record<string, any> = {
  pendente: 'warning',
  em_analise: 'info',
  aguardando_aprovacao: 'secondary',
  aprovado: 'success',
  em_manutencao: 'primary',
  aguardando_peca: 'warning',
  finalizado: 'success',
  entregue: 'success',
  cancelado: 'error'
};

const Checklist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { obterOrdemServico, atualizarStatusOrdem, loading } = useOrdemServico();
  
  const [ordem, setOrdem] = useState<any>(null);
  const [verificacoes, setVerificacoes] = useState<Record<string, { verificado: boolean, observacao?: string }>>({});
  const [salvando, setSalvando] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novoStatus, setNovoStatus] = useState<StatusOrdemServico>('em_analise');
  const [observacao, setObservacao] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  
  // Carrega a ordem de serviço e as verificações
  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      // Carrega a ordem de serviço
      const ordemCarregada = await obterOrdemServico(id);
      if (ordemCarregada) {
        setOrdem(ordemCarregada);
        
        // Carrega as verificações existentes
        const verificacoesExistentes = await verificacaoChecklistService.buscarPorOrdemServico(id);
        
        // Converte para o formato esperado pelo componente
        const verificacoesMap: Record<string, { verificado: boolean, observacao?: string }> = {};
        verificacoesExistentes.forEach(v => {
          verificacoesMap[v.item_checklist_id] = {
            verificado: v.verificado,
            observacao: v.observacao || undefined
          };
        });
        
        setVerificacoes(verificacoesMap);
      }
    };
    
    carregarDados();
  }, [id, obterOrdemServico]);

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setVerificacoes(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId] || {},
        verificado: checked
      }
    }));
  };

  const handleObservacaoChange = (itemId: string, observacao: string) => {
    setVerificacoes(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId] || { verificado: false },
        observacao
      }
    }));
  };

  const handleSalvar = async () => {
    if (!id || !ordem) return;
    
    setSalvando(true);
    
    try {
      // Salva cada verificação
      const promises = Object.entries(verificacoes).map(([itemId, dados]) => 
        verificacaoChecklistService.atualizar(id, itemId, {
          verificado: dados.verificado,
          observacao: dados.observacao
        })
      );
      
      await Promise.all(promises);
      
      // Notifica o usuário
      alert('Checklist salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar verificações:', error);
      alert('Erro ao salvar o checklist. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleVoltar = () => {
    navigate('/');
  };

  const handleAbrirDialogStatus = () => {
    setDialogAberto(true);
  };

  const handleFecharDialogStatus = () => {
    setDialogAberto(false);
  };

  const handleAtualizarStatus = async () => {
    if (!id) return;
    
    setSalvando(true);
    
    try {
      const sucesso = await atualizarStatusOrdem(id, novoStatus);
      
      if (sucesso) {
        setDialogAberto(false);
        // Atualiza a ordem local
        const ordemAtualizada = await obterOrdemServico(id);
        if (ordemAtualizada) {
          setOrdem(ordemAtualizada);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar o status. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <LoadingOverlay open={true} message="Carregando checklist..." />;
  }

  if (!ordem) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Ordem de serviço não encontrada
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleVoltar}
          sx={{ mt: 2 }}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="voltar"
            sx={{ mr: 2 }}
            onClick={handleVoltar}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Checklist de Diagnóstico
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<SaveIcon />}
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? <CircularProgress size={24} color="inherit" /> : 'Salvar'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Informações do Cliente
              </Typography>
              <Typography><strong>Nome:</strong> {ordem.cliente.nome}</Typography>
              <Typography><strong>Telefone:</strong> {ordem.cliente.telefone}</Typography>
              <Typography><strong>Email:</strong> {ordem.cliente.email || 'Não informado'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Informações do Dispositivo
              </Typography>
              <Typography><strong>Marca:</strong> {ordem.dispositivo.marca}</Typography>
              <Typography><strong>Modelo:</strong> {ordem.dispositivo.modelo}</Typography>
              <Typography><strong>IMEI/Serial:</strong> {ordem.dispositivo.imei || 'Não informado'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Detalhes da Ordem
              </Typography>
              <Typography><strong>Problema Relatado:</strong> {ordem.problemaRelatado}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography component="span"><strong>Status Atual:</strong></Typography>
                <Chip 
                  label={statusLabels[ordem.status] || ordem.status.replace('_', ' ')}
                  color={statusColors[ordem.status] || 'default'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 2 }}
                onClick={handleAbrirDialogStatus}
              >
                Alterar Status
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Checklist de Verificação
        </Typography>

        {ordem.categorias && ordem.categorias.map((categoria: any) => (
          <Accordion key={categoria.id} defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel-${categoria.id}-content`}
              id={`panel-${categoria.id}-header`}
            >
              <Typography variant="h6">{categoria.titulo}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {categoria.itens.map((item: any) => (
                <Box key={item.id} sx={{ mb: 2, p: 1, borderRadius: 1, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.03)' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={verificacoes[item.id]?.verificado || false}
                          onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            textDecoration: verificacoes[item.id]?.verificado ? 'line-through' : 'none',
                            color: verificacoes[item.id]?.verificado ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {item.descricao}
                        </Typography>
                      }
                      sx={{ width: '100%' }}
                    />
                  </Box>
                  <TextField
                    label="Observações"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    value={verificacoes[item.id]?.observacao || ''}
                    onChange={(e) => handleObservacaoChange(item.id, e.target.value)}
                    sx={{ mt: 1, ml: 4 }}
                  />
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={handleVoltar}
          >
            Voltar
          </Button>
          <Button 
            variant="contained" 
            startIcon={salvando ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
            onClick={handleSalvar}
            disabled={salvando}
          >
            Salvar Checklist
          </Button>
        </Box>
      </Box>

      {/* Dialog para alterar status */}
      <Dialog open={dialogAberto} onClose={handleFecharDialogStatus}>
        <DialogTitle>Alterar Status da Ordem</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Selecione o novo status para esta ordem de serviço:
          </DialogContentText>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={novoStatus}
              label="Status"
              onChange={(e) => setNovoStatus(e.target.value as StatusOrdemServico)}
            >
              <MenuItem value="pendente">Pendente</MenuItem>
              <MenuItem value="em_analise">Em Análise</MenuItem>
              <MenuItem value="em_reparo">Em Reparo</MenuItem>
              <MenuItem value="aguardando_peca">Aguardando Peça</MenuItem>
              <MenuItem value="em_testes">Em Testes</MenuItem>
              <MenuItem value="concluido">Concluído</MenuItem>
              <MenuItem value="entregue">Entregue</MenuItem>
              <MenuItem value="cancelado">Cancelado</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            margin="normal"
            label="Observação"
            fullWidth
            multiline
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
          
          {novoStatus === 'concluido' && (
            <TextField
              margin="normal"
              label="Localização Física"
              fullWidth
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              helperText="Informe onde o dispositivo está armazenado"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFecharDialogStatus} startIcon={<CloseIcon />}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAtualizarStatus} 
            variant="contained" 
            color="primary"
            startIcon={salvando ? <CircularProgress size={20} /> : <CheckIcon />}
            disabled={salvando}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Checklist;