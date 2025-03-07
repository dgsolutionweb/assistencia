import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Grid, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Tooltip,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  PhoneAndroid as PhoneIcon, 
  Person as PersonIcon, 
  MoreVert as MoreVertIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationOnIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useOrdemServico } from '../contexts/OrdemServicoContext';
import { OrdemServico, StatusOrdemServico } from '../types';
import { format, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definição das colunas do Kanban
const COLUNAS_KANBAN: { id: StatusOrdemServico; titulo: string; cor: string }[] = [
  { id: 'aguardando', titulo: 'Aguardando', cor: '#42a5f5' }, // Azul claro
  { id: 'pendente', titulo: 'Pendente', cor: '#ab47bc' }, // Roxo
  { id: 'em_analise', titulo: 'Em Análise', cor: '#ff9800' }, // Laranja
  { id: 'em_reparo', titulo: 'Em Reparo', cor: '#66bb6a' }, // Verde
  { id: 'em_testes', titulo: 'Em Testes', cor: '#26a69a' }, // Teal
  { id: 'aguardando_peca', titulo: 'Aguardando Peça', cor: '#ec407a' }, // Rosa
  { id: 'concluido', titulo: 'Concluído', cor: '#5c6bc0' }, // Indigo
  { id: 'entregue', titulo: 'Entregue', cor: '#8bc34a' }, // Verde claro
  { id: 'cancelado', titulo: 'Cancelado', cor: '#ef5350' } // Vermelho
];

const KanbanBoard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    filtrarOrdensPorStatus, 
    atualizarStatusOrdem,
    loading
  } = useOrdemServico();
  
  // Estado para o menu de contexto de cada cartão
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);
  
  // Estado para o diálogo de mudança de status
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [novoStatus, setNovoStatus] = useState<StatusOrdemServico | ''>('');
  const [observacao, setObservacao] = useState('');
  const [localizacaoFisica, setLocalizacaoFisica] = useState('');
  
  // Estado para controlar a navegação horizontal
  const [colunaInicial, setColunaInicial] = useState(0);
  const [colunasVisiveis, setColunasVisiveis] = useState(3);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Estado para armazenar as ordens por coluna
  const [ordens, setOrdens] = useState<Record<StatusOrdemServico, OrdemServico[]>>({
    aguardando: [],
    pendente: [],
    em_analise: [],
    em_reparo: [],
    em_testes: [],
    aguardando_peca: [],
    concluido: [],
    entregue: [],
    cancelado: []
  });
  
  // Estado para controlar o carregamento de cada coluna
  const [carregandoColunas, setCarregandoColunas] = useState<Record<StatusOrdemServico, boolean>>({
    aguardando: false,
    pendente: false,
    em_analise: false,
    em_reparo: false,
    em_testes: false,
    aguardando_peca: false,
    concluido: false,
    entregue: false,
    cancelado: false
  });

  // Carrega as ordens para cada coluna
  useEffect(() => {
    const carregarOrdens = async () => {
      // Carrega todas as colunas definidas em COLUNAS_KANBAN
      for (const coluna of COLUNAS_KANBAN) {
        await carregarOrdensParaColuna(coluna.id);
      }
    };
    
    carregarOrdens();
  }, []);

  // Função para carregar ordens para uma coluna específica
  const carregarOrdensParaColuna = async (status: StatusOrdemServico) => {
    try {
      setCarregandoColunas(prev => ({ ...prev, [status]: true }));
      const ordensColuna = await filtrarOrdensPorStatus(status);
      setOrdens(prev => ({ ...prev, [status]: ordensColuna }));
    } catch (error) {
      console.error(`Erro ao carregar ordens para a coluna ${status}:`, error);
    } finally {
      setCarregandoColunas(prev => ({ ...prev, [status]: false }));
    }
  };

  // Funções para navegação horizontal
  const handleProximasColunas = () => {
    if (colunaInicial + colunasVisiveis < COLUNAS_KANBAN.length) {
      setColunaInicial(prev => prev + 1);
    }
  };

  const handleColunasAnteriores = () => {
    if (colunaInicial > 0) {
      setColunaInicial(prev => prev - 1);
    }
  };

  // Ajustar número de colunas visíveis com base no tamanho da tela
  useEffect(() => {
    const ajustarColunasVisiveis = () => {
      const larguraTela = window.innerWidth;
      if (larguraTela < 768) {
        setColunasVisiveis(1);
      } else if (larguraTela < 1200) {
        setColunasVisiveis(2);
      } else if (larguraTela < 1600) {
        setColunasVisiveis(3);
      } else {
        setColunasVisiveis(4);
      }
    };

    ajustarColunasVisiveis();
    window.addEventListener('resize', ajustarColunasVisiveis);
    
    return () => {
      window.removeEventListener('resize', ajustarColunasVisiveis);
    };
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, ordem: OrdemServico) => {
    setMenuAnchorEl(event.currentTarget);
    setOrdemSelecionada(ordem);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleAbrirDialogoStatus = (status: StatusOrdemServico) => {
    setNovoStatus(status);
    setDialogoAberto(true);
    handleMenuClose();
  };

  const handleFecharDialogo = () => {
    setDialogoAberto(false);
    setObservacao('');
    setLocalizacaoFisica('');
  };

  const handleMudarStatus = async () => {
    if (ordemSelecionada && novoStatus) {
      try {
        // Atualiza o status da ordem
        const sucesso = await atualizarStatusOrdem(
          ordemSelecionada.id,
          novoStatus,
          observacao,
          novoStatus === 'concluido' ? localizacaoFisica : undefined
        );
        
        if (sucesso) {
          // Recarrega as ordens para as colunas afetadas
          await carregarOrdensParaColuna(ordemSelecionada.status);
          await carregarOrdensParaColuna(novoStatus);
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      } finally {
        handleFecharDialogo();
      }
    }
  };

  const handleVerChecklist = (id: string) => {
    navigate(`/checklist/${id}`);
    handleMenuClose();
  };

  // Estilo para cada coluna do Kanban
  const colunaStyle = {
    minWidth: 'auto',
    width: '100%',
    height: 'calc(100vh - 280px)', // Ajustado para acomodar os botões de navegação
    overflowY: 'auto' as const,
    padding: 2,
    bgcolor: '#f5f7fa',
    borderRadius: 2,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease'
  };

  // Renderiza um cartão para uma ordem de serviço
  const renderOrdemCard = (ordem: OrdemServico) => {
    const dataAtualizacao = ordem.dataAtualizacao || ordem.dataEntrada;
    const tempoDesdeAtualizacao = formatDistance(
      new Date(dataAtualizacao),
      new Date(),
      { addSuffix: true, locale: ptBR }
    );

    return (
      <Card key={ordem.id} sx={{ mb: 2, width: '100%' }}>
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="div" noWrap sx={{ maxWidth: '80%' }}>
              {ordem.dispositivo.marca} {ordem.dispositivo.modelo}
            </Typography>
            <IconButton 
              size="small" 
              onClick={(e) => handleMenuClick(e, ordem)}
              aria-label="opções"
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          <Box display="flex" alignItems="center" mt={1}>
            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {ordem.cliente.nome}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" mt={0.5}>
            <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {ordem.cliente.telefone}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="body2" color="text.secondary" noWrap>
            {ordem.problemaRelatado.length > 50 
              ? ordem.problemaRelatado.substring(0, 50) + '...' 
              : ordem.problemaRelatado}
          </Typography>
          
          {/* Mostrar a localização física para aparelhos concluídos */}
          {ordem.status === 'concluido' && ordem.localizacaoFisica && (
            <Box 
              mt={1} 
              p={1} 
              bgcolor="#e3f2fd" 
              borderRadius={1} 
              display="flex" 
              alignItems="center"
            >
              <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2" color="primary.main" fontWeight="medium">
                Localização: {ordem.localizacaoFisica}
              </Typography>
            </Box>
          )}
          
          <Box display="flex" alignItems="center" mt={1}>
            <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Tooltip title={`Atualizado em: ${format(new Date(dataAtualizacao), 'dd/MM/yyyy HH:mm')}`}>
              <Typography variant="caption" color="text.secondary">
                {tempoDesdeAtualizacao}
              </Typography>
            </Tooltip>
          </Box>
        </CardContent>
        
        <CardActions>
          <Button 
            size="small" 
            color="primary" 
            onClick={() => handleVerChecklist(ordem.id)}
          >
            Ver Checklist
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Renderiza uma coluna do Kanban
  const renderColuna = (coluna: typeof COLUNAS_KANBAN[0]) => {
    const ordensColuna = ordens[coluna.id] || [];
    const carregando = carregandoColunas[coluna.id];
    const totalOrdens = ordensColuna.length;
    
    // Ordenar as ordens por data de atualização (mais recentes primeiro)
    const ordensOrdenadas = [...ordensColuna].sort((a, b) => {
      const dataA = new Date(a.dataAtualizacao || a.dataEntrada);
      const dataB = new Date(b.dataAtualizacao || b.dataEntrada);
      return dataB.getTime() - dataA.getTime();
    });
    
    // Limitar a 5 ordens por coluna
    const ordensLimitadas = ordensOrdenadas.slice(0, 5);
    const temMaisOrdens = totalOrdens > 5;
    
    return (
      <Paper key={coluna.id} sx={colunaStyle}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            pb: 1,
            borderBottom: `2px solid ${coluna.cor}`
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {coluna.titulo}
          </Typography>
          <Chip 
            label={totalOrdens} 
            size="small" 
            sx={{ 
              bgcolor: coluna.cor,
              color: '#fff',
              fontWeight: 'bold'
            }} 
          />
        </Box>
        
        {carregando ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100px">
            <CircularProgress size={30} />
          </Box>
        ) : (
          <>
            {ordensLimitadas.length > 0 ? (
              <>
                {ordensLimitadas.map(ordem => renderOrdemCard(ordem))}
                
                {temMaisOrdens && (
                  <Box sx={{ textAlign: 'center', mt: 2, mb: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        color: coluna.cor,
                        borderColor: coluna.cor,
                        '&:hover': {
                          borderColor: coluna.cor,
                          backgroundColor: `${coluna.cor}10`
                        }
                      }}
                      onClick={() => navigate('/home')}
                    >
                      Ver mais {totalOrdens - 5} ordens
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box 
                sx={{ 
                  height: 100, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px dashed #ccc',
                  borderRadius: 1,
                  bgcolor: 'rgba(0,0,0,0.02)'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Nenhuma ordem neste status
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Botões de navegação - parte superior */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        px: 1 
      }}>
        <Button 
          variant="contained" 
          onClick={handleColunasAnteriores}
          disabled={colunaInicial === 0}
          sx={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
            textTransform: 'none',
            padding: '8px 16px',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
            },
            '&.Mui-disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          <ChevronLeftIcon sx={{ mr: 0.5 }} />
          Anterior
        </Button>
        
        <Typography variant="subtitle1" fontWeight="medium">
          Colunas {colunaInicial + 1}-{Math.min(colunaInicial + colunasVisiveis, COLUNAS_KANBAN.length)} de {COLUNAS_KANBAN.length}
        </Typography>
        
        <Button 
          variant="contained"
          onClick={handleProximasColunas}
          disabled={colunaInicial + colunasVisiveis >= COLUNAS_KANBAN.length}
          sx={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
            textTransform: 'none',
            padding: '8px 16px',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
            },
            '&.Mui-disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          Próximo
          <ChevronRightIcon sx={{ ml: 0.5 }} />
        </Button>
      </Box>
      
      {/* Container das colunas */}
      <Box 
        ref={containerRef} 
        sx={{ 
          display: 'flex',
          pb: 2,
          transition: 'transform 0.3s ease',
          position: 'relative',
          mx: 1
        }}
      >
        {COLUNAS_KANBAN.map((coluna, index) => (
          <Box 
            key={coluna.id} 
            sx={{ 
              display: index >= colunaInicial && index < colunaInicial + colunasVisiveis ? 'block' : 'none',
              width: `calc(100% / ${colunasVisiveis})`,
              pr: index < colunaInicial + colunasVisiveis - 1 ? 2 : 0,
              transition: 'all 0.3s ease'
            }}
          >
            {renderColuna(coluna)}
          </Box>
        ))}
      </Box>
      
      {/* Menu de contexto para cada cartão */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => ordemSelecionada && handleVerChecklist(ordemSelecionada.id)}>
          Ver Checklist
        </MenuItem>
        <Divider />
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5 }}>
          Mudar status para:
        </Typography>
        {COLUNAS_KANBAN.filter(coluna => 
          ordemSelecionada && coluna.id !== ordemSelecionada.status
        ).map(coluna => (
          <MenuItem 
            key={coluna.id}
            onClick={() => handleAbrirDialogoStatus(coluna.id)}
            sx={{ 
              '&:hover': { 
                bgcolor: `${coluna.cor}20` // Cor com 20% de opacidade
              }
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: coluna.cor,
                mr: 1
              }} 
            />
            {coluna.titulo}
          </MenuItem>
        ))}
      </Menu>
      
      {/* Diálogo para mudança de status */}
      <Dialog open={dialogoAberto} onClose={handleFecharDialogo} maxWidth="sm" fullWidth>
        <DialogTitle>
          Alterar Status da Ordem
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Alterando status de <strong>{ordemSelecionada?.dispositivo.marca} {ordemSelecionada?.dispositivo.modelo}</strong> para <strong>{COLUNAS_KANBAN.find(c => c.id === novoStatus)?.titulo}</strong>
          </Typography>
          
          <TextField
            label="Observação"
            multiline
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Adicione uma observação sobre esta mudança de status..."
          />
          
          {novoStatus === 'concluido' && (
            <TextField
              label="Localização Física"
              value={localizacaoFisica}
              onChange={(e) => setLocalizacaoFisica(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="Onde o dispositivo está armazenado? (ex: Gaveta 3, Prateleira B)"
              helperText="Esta informação ajudará a localizar o dispositivo quando o cliente vier buscá-lo"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFecharDialogo} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleMudarStatus} 
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard;