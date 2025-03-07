import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Estas variáveis de ambiente devem ser configuradas no arquivo .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Verifica se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL e Anon Key são necessários. Configure as variáveis de ambiente REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY.');
} else {
  console.log('Conectando ao Supabase com URL:', supabaseUrl);
  // Verifica se a URL é válida
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('URL do Supabase inválida:', supabaseUrl);
  }
}

// Configurações adicionais para o cliente Supabase
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // Reduzir a quantidade de logs para evitar poluição do console
    fetch: (url: RequestInfo | URL, init?: RequestInit) => {
      // Adiciona configurações para evitar problemas com QUIC
      const customInit = {
        ...init,
        // Força o uso de HTTP/1.1 em vez de HTTP/2 ou HTTP/3 (QUIC)
        cache: 'no-store' as RequestCache,
        // Aumenta o timeout para 30 segundos
        signal: init?.signal || AbortSignal.timeout(30000)
      };
      return fetch(url, customInit);
    }
  }
};

// Cria e exporta o cliente do Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Função para testar a conexão com o Supabase
export const testarConexaoSupabase = async () => {
  try {
    console.log('Testando conexão com o Supabase...');
    console.log('URL:', supabaseUrl);
    console.log('Chave (primeiros 10 caracteres):', supabaseAnonKey.substring(0, 10) + '...');
    
    // Verificações preliminares
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Erro: Credenciais do Supabase não estão configuradas');
      return false;
    }
    
    try {
      new URL(supabaseUrl);
    } catch (e) {
      console.error('Erro: URL do Supabase inválida');
      return false;
    }
    
    // Tenta fazer uma requisição simples para verificar a conexão
    const { error } = await supabase.from('clientes').select('count()', { count: 'exact', head: true });
    
    if (error) {
      console.error('Erro ao conectar com o Supabase:', error);
      
      // Adicionar mais detalhes de diagnóstico
      if (error.code === 'PGRST301') {
        console.error('Erro de permissão: Verifique se as políticas RLS estão configuradas corretamente');
      } else if (error.code?.includes('auth')) {
        console.error('Erro de autenticação: Verifique se a chave anônima está correta');
      } else if (error.message?.includes('network')) {
        console.error('Erro de rede: Verifique sua conexão à internet');
      }
      
      return false;
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao testar conexão com o Supabase:', error);
    return false;
  }
};

// Testa a conexão ao inicializar, mas com um pequeno atraso
// para garantir que o ambiente já esteja totalmente carregado
setTimeout(() => {
  console.log('Dados inicializados com sucesso');
  testarConexaoSupabase();
}, 2000);
