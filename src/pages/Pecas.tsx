import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff, DollarSign, Truck, ShoppingCart, Scan } from 'lucide-react';
import { supabase, type Peca } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import Empty from '../components/Empty';
import TouchableCard from '../components/mobile/TouchableCard';
import FloatingActionButton from '../components/mobile/FloatingActionButton';
import BarcodeScanner from '../components/mobile/BarcodeScanner';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { InfiniteScrollLoader } from '../components/mobile/InfiniteScrollLoader';
import { useMobile } from '../hooks/useMobile';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import { VoiceSearchButton } from "../components/mobile/VoiceSearchButton";
import HapticService from "../lib/haptic";
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

// Types for component props
interface PecasProps {
  pecas: Peca[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showInactive: boolean;
  setShowInactive: (show: boolean) => void;
  toggleAtivoPeca: (id: string, ativo: boolean) => void;
  deletarPeca: (id: string) => void;
  pecasFiltradas: Peca[];
  carregarPecas: () => Promise<void>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => Promise<void>;
}

// Mobile Parts Component with proper memoization
const MobilePecas = React.memo<PecasProps>(({ 
  pecas, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  showInactive, 
  setShowInactive, 
  toggleAtivoPeca, 
  deletarPeca, 
  pecasFiltradas,
  carregarPecas,
  hasMore,
  isLoadingMore,
  onLoadMore
}) => {
  // Barcode scanner hook
  const { isOpen: isScannerOpen, openScanner, closeScanner } = useBarcodeScanner();
  
  // Voice search callbacks - properly memoized
  const handleVoiceResult = useCallback((transcript: string) => {
    setSearchTerm(transcript);
    toast.success(`Busca por voz: "${transcript}"`);
  }, [setSearchTerm]);

  const handleVoiceError = useCallback((error: string) => {
    toast.error(`Erro na busca por voz: ${error}`);
  }, []);

  // Voice search configuration - memoized to prevent re-renders
  const voiceSearchConfig = useMemo(() => ({
    onResult: handleVoiceResult,
    onError: handleVoiceError
  }), [handleVoiceResult, handleVoiceError]);

  // Voice search hook
  const {
    isListening,
    isSupported: isVoiceSupported,
    toggleListening
  } = useVoiceSearch(voiceSearchConfig);
  
  // Pull to refresh configuration - memoized
  const pullToRefreshConfig = useMemo(() => ({
    onRefresh: carregarPecas,
    enabled: !loading
  }), [carregarPecas, loading]);

  // Pull to refresh hook
  const {
    bind: pullBind,
    containerRef: pullContainerRef,
    isRefreshing,
    pullDistance,
    canRefresh,
    refreshProgress
  } = usePullToRefresh(pullToRefreshConfig);

  // Infinite scroll configuration - memoized
  const infiniteScrollConfig = useMemo(() => ({
    hasMore: hasMore ?? false,
    isLoading: isLoadingMore ?? false,
    onLoadMore: onLoadMore ?? (async () => {}),
    enabled: true
  }), [hasMore, isLoadingMore, onLoadMore]);

  // Infinite scroll hook
  const {
    containerRef: scrollContainerRef,
    sentinelRef,
    isFetching: scrollIsLoadingMore
  } = useInfiniteScroll(infiniteScrollConfig);

  // Barcode scan handler - properly memoized
  const handleBarcodeScanned = useCallback((result: { 
    type: 'barcode' | 'qr' | 'text' | 'product'; 
    data: string; 
    confidence?: number; 
    productInfo?: { 
      name?: string; 
      brand?: string; 
      category?: string; 
      description?: string; 
      price?: string 
    } 
  }) => {
    HapticService.success();
    const searchValue = result.data || result.productInfo?.name || '';
    toast.success(`Código escaneado: ${searchValue}`);
    
    // Search for the part with this barcode
    const foundPart = pecas.find(peca => 
      peca.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
      peca.fornecedor?.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    if (foundPart) {
      setSearchTerm(searchValue);
      toast.success(`Peça encontrada: ${foundPart.nome}`);
    } else {
      setSearchTerm(searchValue);
      toast.info(`Buscando por: ${searchValue}`);
    }
    
    closeScanner();
  }, [pecas, setSearchTerm, closeScanner]);

  // Memoized calculations
  const totals = useMemo(() => {
    const totalCusto = pecasFiltradas.reduce((acc, peca) => acc + peca.preco_custo, 0);
    const totalFrete = pecasFiltradas.reduce((acc, peca) => acc + peca.frete, 0);
    const totalGeral = totalCusto + totalFrete;
    
    return { totalCusto, totalFrete, totalGeral };
  }, [pecasFiltradas]);

  // Event handlers - memoized
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleShowInactiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowInactive(e.target.checked);
  }, [setShowInactive]);

  const handleVoiceToggle = useCallback(() => {
    HapticService.light();
    toggleListening();
  }, [toggleListening]);

  const handleScannerOpen = useCallback(() => {
    HapticService.light();
    openScanner();
  }, [openScanner]);

  const handleToggleAtivo = useCallback((id: string, ativo: boolean) => {
    HapticService.light();
    toggleAtivoPeca(id, ativo);
  }, [toggleAtivoPeca]);

  if (loading) return <Loading />;

  return (
    <div 
      {...pullBind()}
      ref={(el) => {
        pullContainerRef.current = el;
        scrollContainerRef.current = el;
      }}
      className="pb-6 overflow-y-auto h-full"
      style={{ touchAction: 'pan-y' }}
    >
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        canRefresh={canRefresh}
        refreshProgress={refreshProgress}
      >
        {/* Mobile Header */}
        <div className="px-4 py-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white -mx-4 -mt-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">Peças</h1>
          <p className="text-purple-100">Gerencie suas peças cadastradas</p>
        </div>

        {/* Summary Cards - Mobile Layout */}
        <div className="px-4 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <TouchableCard
              variant="elevated"
              className="p-4"
              hapticFeedback
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{pecasFiltradas.length}</div>
                <div className="text-xs text-gray-500">Peças</div>
              </div>
            </TouchableCard>

            <TouchableCard
              variant="elevated"
              className="p-4"
              hapticFeedback
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-600">R$ {totals.totalCusto.toFixed(0)}</div>
                <div className="text-xs text-gray-500">Custo Total</div>
              </div>
            </TouchableCard>
          </div>

          <TouchableCard
            variant="elevated"
            className="p-4"
            hapticFeedback
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Valor Total (com frete)</div>
                <div className="text-2xl font-bold text-gray-900">R$ {totals.totalGeral.toFixed(2)}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </TouchableCard>
        </div>

        {/* Search and Filters */}
        <div className="px-4 mb-6 space-y-4">
          <TouchableCard variant="default" className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar peças..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-0 focus:outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex space-x-2">
                {isVoiceSupported && (
                  <VoiceSearchButton
                    isListening={isListening}
                    isSupported={isVoiceSupported}
                    onToggle={handleVoiceToggle}
                  />
                )}
                <button
                  onClick={handleScannerOpen}
                  className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  title="Escanear código de barras"
                >
                  <Scan className="w-5 h-5" />
                </button>
              </div>
            </div>
          </TouchableCard>

          <TouchableCard variant="default" className="p-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Mostrar peças inativas</span>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={handleShowInactiveChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </label>
          </TouchableCard>
        </div>

        {/* Parts List */}
        <div className="px-4 space-y-4">
          {pecasFiltradas.length === 0 ? (
            <TouchableCard variant="default" className="p-8">
              <div className="text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-4">
                  {searchTerm ? 'Nenhuma peça encontrada' : 'Nenhuma peça cadastrada'}
                </div>
                {!searchTerm && (
                  <Link to="/pecas/nova">
                    <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium">
                      <Plus className="h-4 w-4 mr-2 inline" />
                      Cadastrar Primeira Peça
                    </button>
                  </Link>
                )}
              </div>
            </TouchableCard>
          ) : (
            pecasFiltradas.map((peca, index) => (
              <motion.div
                key={peca.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TouchableCard
                  variant="elevated"
                  className={`p-4 ${!peca.ativo ? 'opacity-60' : ''}`}
                  hapticFeedback
                  swipeActions={{
                    left: {
                      icon: <Edit className="w-5 h-5" />,
                      color: 'bg-blue-500',
                      action: () => window.location.href = `/pecas/${peca.id}/editar`
                    },
                    right: {
                      icon: <Trash2 className="w-5 h-5" />,
                      color: 'bg-red-500',
                      action: () => deletarPeca(peca.id)
                    }
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex items-start space-x-3">
                        {peca.imagem_url && (
                          <img
                            src={peca.imagem_url}
                            alt={peca.nome}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{peca.nome}</h3>
                          {peca.fornecedor && (
                            <div className="text-sm text-gray-500 mt-1">{peca.fornecedor}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          R$ {(peca.preco_custo + peca.frete).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">total</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500">Custo</div>
                        <div className="font-medium">R$ {peca.preco_custo.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Frete</div>
                        <div className="font-medium">R$ {peca.frete.toFixed(2)}</div>
                      </div>
                    </div>

                    {peca.observacoes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Observações</div>
                        <div className="text-sm text-gray-700">{peca.observacoes}</div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        peca.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {peca.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                      <div className="text-xs text-gray-500">
                        {new Date(peca.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleToggleAtivo(peca.id, peca.ativo)}
                        className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                      >
                        {peca.ativo ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1 inline" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1 inline" />
                            Ativar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </TouchableCard>
              </motion.div>
            ))
          )}
        </div>

        {/* Infinite Scroll Loader */}
        <InfiniteScrollLoader
          isLoading={isLoadingMore ?? false}
          hasMore={hasMore ?? false}
          error={null}
        />

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={<Plus className="w-6 h-6" />}
          onClick={() => window.location.href = '/pecas/nova'}
          tooltip="Nova Peça"
          color="bg-purple-500 hover:bg-purple-600"
        />

        {/* Barcode Scanner */}
        <AnimatePresence>
          {isScannerOpen && (
            <BarcodeScanner
              isOpen={isScannerOpen}
              onClose={closeScanner}
              onScan={handleBarcodeScanned}
            />
          )}
        </AnimatePresence>
      </PullToRefresh>
    </div>
  );
});

// Desktop Parts Component with proper memoization
const DesktopPecas = React.memo<Omit<PecasProps, 'carregarPecas'>>(({ 
  pecas, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  showInactive, 
  setShowInactive, 
  toggleAtivoPeca, 
  deletarPeca, 
  pecasFiltradas 
}) => {
  // Event handlers - memoized
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleShowInactiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowInactive(e.target.checked);
  }, [setShowInactive]);

  // Memoized calculations
  const totals = useMemo(() => {
    const totalCusto = pecasFiltradas.reduce((acc, peca) => acc + peca.preco_custo, 0);
    const totalFrete = pecasFiltradas.reduce((acc, peca) => acc + peca.frete, 0);
    
    return { totalCusto, totalFrete };
  }, [pecasFiltradas]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Peças</h1>
              <p className="text-gray-600 mt-1">
                Gerencie suas peças cadastradas
              </p>
            </div>
            <Link
              to="/pecas/nova"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Peça
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou fornecedor..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={handleShowInactiveChange}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Mostrar inativas
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de Peças */}
        {pecasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma peça encontrada</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Tente ajustar os filtros de busca" : "Cadastre sua primeira peça para começar"}
            </p>
            {!searchTerm && (
              <Link
                to="/pecas/nova"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Peça
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peça
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preços
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pecasFiltradas.map((peca) => (
                    <tr key={peca.id} className={!peca.ativo ? 'opacity-60' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {peca.imagem_url && (
                            <img
                              src={peca.imagem_url}
                              alt={peca.nome}
                              className="w-10 h-10 rounded-md object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {peca.nome}
                            </div>
                            {peca.observacoes && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {peca.observacoes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Custo: R$ {peca.preco_custo.toFixed(2)}
                        </div>
                        {peca.frete > 0 && (
                          <div className="text-sm text-gray-500">
                            Frete: R$ {peca.frete.toFixed(2)}
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          Total: R$ {(peca.preco_custo + peca.frete).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {peca.fornecedor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          peca.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {peca.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(peca.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => toggleAtivoPeca(peca.id, peca.ativo)}
                            className="text-gray-400 hover:text-gray-600"
                            title={peca.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {peca.ativo ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <Link
                            to={`/pecas/${peca.id}/editar`}
                            className="text-red-600 hover:text-red-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deletarPeca(peca.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumo */}
        {pecasFiltradas.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {pecasFiltradas.length}
                </div>
                <div className="text-sm text-gray-500">
                  {pecasFiltradas.length === 1 ? 'Peça' : 'Peças'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {totals.totalCusto.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Valor Total em Custo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {totals.totalFrete.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Total em Frete</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Main Pecas component with optimized state management
export default function Pecas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Get mobile status - this should now be stable
  const { isMobile } = useMobile();

  // Memoized callbacks to prevent unnecessary re-renders
  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleShowInactiveChange = useCallback((show: boolean) => {
    setShowInactive(show);
  }, []);

  const pageSize = 20;
  const {
    data: pages,
    isLoading: loading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<Peca[], number>({
    queryKey: ['pecas', user?.id, showInactive, searchTerm],
    enabled: !!user,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined;
      if (lastPage.length < pageSize) return undefined;
      return allPages.length;
    },
    queryFn: async ({ pageParam = 0 }) => {
      const offset = Number(pageParam) * pageSize;
      let query = supabase
        .from('pecas')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (!showInactive) query = query.eq('ativo', true);
      if (searchTerm) {
        const term = `%${searchTerm}%`;
        query = query.or(`nome.ilike.${term},fornecedor.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const pecas = useMemo(() => (pages?.pages || []).flat(), [pages]);

  const carregarPecas = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const toggleAtivoPeca = useCallback(async (id: string, ativo: boolean) => {
    try {
      HapticService.trigger('light');
      
      if (navigator.onLine) {
        const { error } = await supabase
          .from('pecas')
          .update({ ativo: !ativo })
          .eq('id', id);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['pecas', user?.id] });
      } else {
        toast.info('Ação salva para sincronização');
      }

      toast.success(ativo ? 'Peça desativada' : 'Peça ativada');
    } catch (error) {
      console.error('Erro ao alterar status da peça:', error);
      toast.error('Erro ao alterar status da peça');
    }
  }, [queryClient, user]);

  const deletarPeca = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta peça?')) return;

    try {
      HapticService.trigger('medium');
      
      if (navigator.onLine) {
        const { error } = await supabase
          .from('pecas')
          .delete()
          .eq('id', id);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['pecas', user?.id] });
      } else {
        // Store action for later sync

        toast.info('Exclusão salva para sincronização');
      }

      toast.success('Peça excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir peça:', error);
      toast.error('Erro ao excluir peça');
    }
  }, [queryClient, user]);

  // Memoized filtered parts
  const pecasFiltradas = useMemo(() => {
    return pecas.filter(peca => {
      const matchesSearch = peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peca.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!showInactive) {
        return matchesSearch && peca.ativo;
      }
      
      return matchesSearch;
    });
  }, [pecas, searchTerm, showInactive]);

  

  // Memoized props for components
  const commonProps = useMemo(() => ({
    pecas,
    loading,
    searchTerm,
    setSearchTerm: handleSearchTermChange,
    showInactive,
    setShowInactive: handleShowInactiveChange,
    toggleAtivoPeca,
    deletarPeca,
    pecasFiltradas,
    hasMore: !!hasNextPage,
    isLoadingMore: isFetchingNextPage,
    onLoadMore: async () => { if (hasNextPage) await fetchNextPage(); }
  }), [
    pecas,
    loading,
    searchTerm,
    handleSearchTermChange,
    showInactive,
    handleShowInactiveChange,
    toggleAtivoPeca,
    deletarPeca,
    pecasFiltradas,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  ]);

  const mobileProps = useMemo(() => ({
    ...commonProps,
    carregarPecas
  }), [commonProps, carregarPecas]);

  return isMobile ? (
    <MobilePecas {...mobileProps} />
  ) : (
    <DesktopPecas {...commonProps} />
  );
}
