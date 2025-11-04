import React, { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoaderProps {
  fallback?: React.ReactNode;
  className?: string;
}

// Componente de loading padrão
const DefaultFallback: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center justify-center min-h-[200px] ${className || ''}`}>
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600">Carregando...</p>
    </div>
  </div>
);

// HOC para lazy loading de componentes
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options?: LazyLoaderProps
) {
  const LazyComponent = React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={options?.fallback || <DefaultFallback className={options?.className} />}>
      <Component {...(props as P)} />
    </Suspense>
  ));
  
  LazyComponent.displayName = `LazyLoaded(${Component.displayName || Component.name})`;
  
  return LazyComponent;
}

// Componente wrapper para lazy loading
export const LazyLoader: React.FC<LazyLoaderProps & { children: React.ReactNode }> = ({
  children,
  fallback,
  className
}) => (
  <Suspense fallback={fallback || <DefaultFallback className={className} />}>
    {children}
  </Suspense>
);

// Hook para lazy loading de dados
export function useLazyData<T>(
  loadData: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  React.useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export default LazyLoader;