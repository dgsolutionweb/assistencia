import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  AlertColor
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import { useOrdemServico } from '../contexts/OrdemServicoContext';
import { OrdemServico } from '../types';
import { format } from 'date-fns';

interface ChecklistPreenchimentoProps {
  ordemId: string;
}

// Componente de impressão como classe para melhor compatibilidade
class PrintableChecklist extends React.Component<{ ordem: OrdemServico }> {
  render() {
    const { ordem } = this.props;

    return (
      <div style={{ padding: '20px', backgroundColor: 'white', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '8px' }}>Relatório de Checklist</h2>
          <h3>Assistência Técnica de Smartphones</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '32px' }}>
          <div style={{ flex: 1 }}>
            <p><strong>Cliente:</strong> {ordem.cliente.nome}</p>
            <p><strong>Telefone:</strong> {ordem.cliente.telefone}</p>
            {ordem.cliente.email && <p><strong>E-mail:</strong> {ordem.cliente.email}</p>}
          </div>
          <div style={{ flex: 1 }}>
            <p><strong>Data de Entrada:</strong> {format(new Date(ordem.dataEntrada), 'dd/MM/yyyy')}</p>
            <p><strong>Técnico:</strong> {ordem.tecnicoResponsavel}</p>
            <p><strong>Status:</strong> {ordem.status.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ marginBottom: '16px' }}>Informações do Dispositivo</h4>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ flex: 1 }}>
              <p><strong>Marca/Modelo:</strong> {ordem.dispositivo.marca} {ordem.dispositivo.modelo}</p>
              {ordem.dispositivo.imei && <p><strong>IMEI:</strong> {ordem.dispositivo.imei}</p>}
              {ordem.dispositivo.serial && <p><strong>Número de Série:</strong> {ordem.dispositivo.serial}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <p><strong>Acessórios:</strong> {ordem.dispositivo.acessorios.join(', ') || 'Nenhum'}</p>
              <p><strong>Condição Externa:</strong> {ordem.dispositivo.condicaoExterna}</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ marginBottom: '16px' }}>Problema Relatado</h4>
          <p>{ordem.problemaRelatado}</p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ marginBottom: '16px' }}>Resultado do Checklist</h4>
          
          {ordem.categorias.map((categoria) => (
            <div key={categoria.id} style={{ marginBottom: '24px' }}>
              <h5 style={{ marginBottom: '8px', fontWeight: 'bold' }}>{categoria.titulo}</h5>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc', width: '50%' }}>Item</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc', width: '15%' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc', width: '35%' }}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {categoria.itens.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{item.descricao}</td>
                      <td style={{ padding: '8px' }}>{item.verificado ? 'Verificado' : 'Não Verificado'}</td>
                      <td style={{ padding: '8px' }}>{item.observacao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '32px' }}>
          <div style={{ borderTop: '1px solid #000', width: '40%', textAlign: 'center', paddingTop: '8px' }}>
            <p>Assinatura do Técnico</p>
          </div>
          <div style={{ borderTop: '1px solid #000', width: '40%', textAlign: 'center', paddingTop: '8px' }}>
            <p>Assinatura do Cliente</p>
          </div>
        </div>
      </div>
    );
  }
}

const ChecklistPreenchimento: React.FC<ChecklistPreenchimentoProps> = ({ ordemId }) => {
  const { obterOrdemServico, atualizarOrdemServico } = useOrdemServico();
  const [dadosOrdem, setDadosOrdem] = useState<OrdemServico | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [imprimindo, setImprimindo] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as AlertColor
  });

  // Referência para o componente de impressão
  const componenteImpressaoRef = useRef<PrintableChecklist>(null);

  // Recuperar ordem quando o componente montar ou quando o ID mudar
  useEffect(() => {
    const carregarOrdem = async () => {
      try {
        setLoading(true);
        const ordem = await obterOrdemServico(ordemId);
        setDadosOrdem(ordem || undefined);
      } catch (error) {
        console.error('Erro ao carregar ordem de serviço:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao carregar ordem de serviço',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    carregarOrdem();
  }, [ordemId, obterOrdemServico]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Função de impressão simplificada usando a API de impressão do navegador
  const handlePrint = () => {
    setImprimindo(true);
    
    try {
      // Mostra feedback ao usuário
      setSnackbar({
        open: true,
        message: 'Preparando impressão...',
        severity: 'info'
      });
      
      // Espera um pouco para garantir que o snackbar seja mostrado
      setTimeout(() => {
        // Usa a API nativa de impressão do navegador
        window.print();
        
        // Mostra confirmação e reseta estado
        setImprimindo(false);
        setSnackbar({
          open: true,
          message: 'Checklist enviado para impressão com sucesso!',
          severity: 'success'
        });
      }, 500);
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      setImprimindo(false);
      setSnackbar({
        open: true,
        message: 'Erro ao imprimir. Por favor, tente novamente.',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dadosOrdem) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Ordem de serviço não encontrada</Typography>
      </Box>
    );
  }

  const handleCheckboxChange = (categoriaId: string, itemId: string, checked: boolean) => {
    const novasCategorias = dadosOrdem.categorias.map(categoria => {
      if (categoria.id === categoriaId) {
        return {
          ...categoria,
          itens: categoria.itens.map(item => {
            if (item.id === itemId) {
              return { ...item, verificado: checked };
            }
            return item;
          })
        };
      }
      return categoria;
    });

    const novaOrdem = { ...dadosOrdem, categorias: novasCategorias };
    setDadosOrdem(novaOrdem);
    atualizarOrdemServico(novaOrdem.id, novaOrdem);
  };

  const handleObservacaoChange = (categoriaId: string, itemId: string, observacao: string) => {
    const novasCategorias = dadosOrdem.categorias.map(categoria => {
      if (categoria.id === categoriaId) {
        return {
          ...categoria,
          itens: categoria.itens.map(item => {
            if (item.id === itemId) {
              return { ...item, observacao };
            }
            return item;
          })
        };
      }
      return categoria;
    });

    const novaOrdem = { ...dadosOrdem, categorias: novasCategorias };
    setDadosOrdem(novaOrdem);
    atualizarOrdemServico(novaOrdem.id, novaOrdem);
  };

  // Calcular totais verificados
  const totaisVerificados = dadosOrdem.categorias.reduce(
    (acc, categoria) => {
      const verificados = categoria.itens.filter(item => item.verificado).length;
      const total = categoria.itens.length;
      
      return {
        verificados: acc.verificados + verificados,
        total: acc.total + total
      };
    },
    { verificados: 0, total: 0 }
  );

  const progresso = totaisVerificados.total > 0 
    ? (totaisVerificados.verificados / totaisVerificados.total) * 100
    : 0;

  const handleSalvarChecklist = async () => {
    try {
      setSnackbar({
        open: true,
        message: 'Salvando checklist...',
        severity: 'info'
      });
      
      const sucesso = await atualizarOrdemServico(dadosOrdem.id, dadosOrdem);
      
      if (sucesso) {
        setSnackbar({
          open: true,
          message: 'Checklist salvo com sucesso!',
          severity: 'success'
        });
      } else {
        throw new Error('Não foi possível salvar o checklist');
      }
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar checklist. Tente novamente.',
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', my: 4 }}>
      {/* Conteúdo principal - não será impresso */}
      <Box sx={{ '@media print': { display: 'none' } }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)',
            }
          }}
        >
          <Typography variant="h4" gutterBottom align="center" sx={{ color: '#1976d2', fontWeight: 500 }}>
            Checklist de Diagnóstico
          </Typography>
          
          <Box sx={{ 
            mt: 2, 
            mb: 3, 
            p: 2, 
            bgcolor: '#f8f9fa', 
            borderRadius: 1, 
            border: '1px solid #e0e0e0' 
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Cliente: <strong>{dadosOrdem.cliente.nome}</strong></Typography>
                <Typography variant="subtitle1">Telefone: {dadosOrdem.cliente.telefone}</Typography>
                <Typography variant="subtitle1">Data de Entrada: {format(new Date(dadosOrdem.dataEntrada), 'dd/MM/yyyy')}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Dispositivo: <strong>{dadosOrdem.dispositivo.marca} {dadosOrdem.dispositivo.modelo}</strong></Typography>
                <Typography variant="subtitle1">Problema Relatado: {dadosOrdem.problemaRelatado.length > 50 
                  ? `${dadosOrdem.problemaRelatado.substring(0, 50)}...` 
                  : dadosOrdem.problemaRelatado}
                </Typography>
                <Typography variant="subtitle1">Técnico Responsável: {dadosOrdem.tecnicoResponsavel}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
              <CircularProgress 
                variant="determinate" 
                value={progresso} 
                size={40} 
                thickness={4}
                color={progresso === 100 ? "success" : "primary"}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {Math.round(progresso)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1">
              {totaisVerificados.verificados} de {totaisVerificados.total} itens verificados
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom sx={{ color: '#555', fontWeight: 500 }}>
            Itens do Checklist
          </Typography>

          {dadosOrdem.categorias.map((categoria) => (
            <Accordion 
              key={categoria.id} 
              sx={{ 
                mb: 1,
                borderRadius: '8px', 
                '&:before': { display: 'none' },
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: '#fafafa'
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  bgcolor: '#f5f5f5',
                  borderRadius: '8px 8px 0 0'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{categoria.titulo}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
                    {categoria.itens.filter(item => item.verificado).length} / {categoria.itens.length}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2 }}>
                <FormGroup>
                  {categoria.itens.map((item) => (
                    <Box 
                      key={item.id} 
                      sx={{ 
                        mb: 2, 
                        p: 1,
                        borderRadius: 1,
                        transition: 'background-color 0.2s',
                        '&:hover': { bgcolor: '#f9f9f9' }
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={item.verificado} 
                            onChange={(e) => handleCheckboxChange(categoria.id, item.id, e.target.checked)} 
                            color="primary"
                          />
                        }
                        label={item.descricao}
                        sx={{ width: '100%' }}
                      />
                      {item.verificado && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Observação"
                          variant="outlined"
                          sx={{ mt: 1, ml: 3 }}
                          value={item.observacao || ''}
                          onChange={(e) => handleObservacaoChange(categoria.id, item.id, e.target.value)}
                        />
                      )}
                    </Box>
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handlePrint}
              startIcon={imprimindo ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
              disabled={imprimindo}
              sx={{ 
                py: 1.5, 
                px: 4, 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 4px 6px rgba(32, 101, 209, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 10px rgba(32, 101, 209, 0.3)',
                }
              }}
            >
              {imprimindo ? 'Preparando impressão...' : 'Imprimir Checklist'}
            </Button>
          </Box>
        </Paper>

        {/* Snackbar de feedback */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>

      {/* Conteúdo para impressão - visível apenas durante a impressão */}
      <Box sx={{ 
        display: "none", 
        '@media print': {
          display: 'block',
          width: '100%',
          margin: 0,
          padding: '20px'
        } 
      }}>
        {/* Passamos os dados diretamente aqui, sem uso de ref */}
        {dadosOrdem && (
          <div style={{ padding: '20px', backgroundColor: 'white', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ marginBottom: '8px' }}>Relatório de Checklist</h2>
              <h3>Assistência Técnica de Smartphones</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '32px' }}>
              <div style={{ flex: 1 }}>
                <p><strong>Cliente:</strong> {dadosOrdem.cliente.nome}</p>
                <p><strong>Telefone:</strong> {dadosOrdem.cliente.telefone}</p>
                {dadosOrdem.cliente.email && <p><strong>E-mail:</strong> {dadosOrdem.cliente.email}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <p><strong>Data de Entrada:</strong> {format(new Date(dadosOrdem.dataEntrada), 'dd/MM/yyyy')}</p>
                <p><strong>Técnico:</strong> {dadosOrdem.tecnicoResponsavel}</p>
                <p><strong>Status:</strong> {dadosOrdem.status.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ marginBottom: '16px' }}>Informações do Dispositivo</h4>
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ flex: 1 }}>
                  <p><strong>Marca/Modelo:</strong> {dadosOrdem.dispositivo.marca} {dadosOrdem.dispositivo.modelo}</p>
                  {dadosOrdem.dispositivo.imei && <p><strong>IMEI:</strong> {dadosOrdem.dispositivo.imei}</p>}
                  {dadosOrdem.dispositivo.serial && <p><strong>Número de Série:</strong> {dadosOrdem.dispositivo.serial}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <p><strong>Acessórios:</strong> {dadosOrdem.dispositivo.acessorios.join(', ') || 'Nenhum'}</p>
                  <p><strong>Condição Externa:</strong> {dadosOrdem.dispositivo.condicaoExterna}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ marginBottom: '16px' }}>Problema Relatado</h4>
              <p>{dadosOrdem.problemaRelatado}</p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ marginBottom: '16px' }}>Resultado do Checklist</h4>
              
              {dadosOrdem.categorias.map((categoria) => (
                <div key={categoria.id} style={{ marginBottom: '24px' }}>
                  <h5 style={{ marginBottom: '8px', fontWeight: 'bold' }}>{categoria.titulo}</h5>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc', width: '50%' }}>Item</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc', width: '15%' }}>Status</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc', width: '35%' }}>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoria.itens.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>{item.descricao}</td>
                          <td style={{ padding: '8px' }}>{item.verificado ? 'Verificado' : 'Não Verificado'}</td>
                          <td style={{ padding: '8px' }}>{item.observacao || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '32px' }}>
              <div style={{ borderTop: '1px solid #000', width: '40%', textAlign: 'center', paddingTop: '8px' }}>
                <p>Assinatura do Técnico</p>
              </div>
              <div style={{ borderTop: '1px solid #000', width: '40%', textAlign: 'center', paddingTop: '8px' }}>
                <p>Assinatura do Cliente</p>
              </div>
            </div>
          </div>
        )}
      </Box>
    </Box>
  );
};

export default ChecklistPreenchimento; 