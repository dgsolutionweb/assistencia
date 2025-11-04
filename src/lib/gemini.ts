import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface PecaExtraida {
  nome: string;
  preco_custo: number;
  frete: number;
  fornecedor?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
}

export interface ResultadoAnalise {
  pecas: PecaExtraida[];
  frete_total: number;
  fornecedor_geral?: string;
}

export async function analisarImagemPeca(imageFile: File): Promise<PecaExtraida> {
  try {
    // Validar imagem antes de processar
    const validacao = validarImagemPeca(imageFile);
    if (!validacao.valido) {
      throw new Error(validacao.erro || 'Imagem inválida');
    }

    // Converter arquivo para base64
    const imageBase64 = await fileToBase64(imageFile);
    
    // Usar o modelo Gemini 2.0 Flash com configurações otimizadas
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
    });
    
    const prompt = `
    Analise esta imagem de uma nota fiscal, comprovante de compra ou produto e extraia as seguintes informações:

    1. Nome da peça/produto (seja específico e técnico, incluindo modelo/código se visível)
    2. Preço de custo unitário (valor numérico apenas, sem símbolos de moeda)
    3. Valor do frete (se houver, caso contrário 0)
    4. Nome do fornecedor/loja (se visível)
    5. Quantidade (se especificada, caso contrário 1)

    REGRAS IMPORTANTES: 
    - Retorne APENAS um JSON válido no formato exato abaixo
    - Use números decimais para preços (ex: 15.50, não R$ 15,50)
    - Converta vírgulas em pontos para decimais
    - Se não conseguir identificar algum campo, use valores padrão apropriados
    - Para frete, se não houver informação clara, use 0
    - Para fornecedor, se não houver, use "Não identificado"
    - Para quantidade, se não especificada, use 1
    - Seja preciso na identificação do nome da peça

    Formato de resposta (JSON apenas):
    {
      "nome": "nome_da_peca",
      "preco_custo": 0.00,
      "frete": 0.00,
      "fornecedor": "nome_do_fornecedor",
      "quantidade": 1
    }`;

    // Tentar análise com retry em caso de falha
    let tentativas = 0;
    const maxTentativas = 3;
    
    while (tentativas < maxTentativas) {
      try {
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType: imageFile.type
            }
          }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Extrair JSON da resposta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Resposta não contém JSON válido');
        }

        const dadosExtraidos = JSON.parse(jsonMatch[0]) as PecaExtraida;
        
        // Validar dados extraídos
        if (!dadosExtraidos.nome || typeof dadosExtraidos.preco_custo !== 'number') {
          throw new Error('Dados extraídos são inválidos');
        }

        return {
          nome: dadosExtraidos.nome.trim(),
          preco_custo: Number(dadosExtraidos.preco_custo) || 0,
          frete: Number(dadosExtraidos.frete) || 0,
          fornecedor: dadosExtraidos.fornecedor || 'Não identificado',
          quantidade: Number(dadosExtraidos.quantidade) || 1
        };

      } catch (error) {
        tentativas++;
        console.warn(`Tentativa ${tentativas} falhou:`, error);
        
        if (tentativas >= maxTentativas) {
          throw error;
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * tentativas));
      }
    }

  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    throw new Error('Falha ao analisar a imagem. Verifique se a imagem contém informações de compra válidas.');
  }
}

export async function analisarNotaFiscalCompleta(imageFile: File): Promise<ResultadoAnalise> {
  try {
    // Validar imagem antes de processar
    const validacao = validarImagemPeca(imageFile);
    if (!validacao.valido) {
      throw new Error(validacao.erro || 'Imagem inválida');
    }

    // Converter arquivo para base64
    const imageBase64 = await fileToBase64(imageFile);
    
    // Usar o modelo Gemini 2.0 Flash com configurações otimizadas
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });
    
    const prompt = `
    Analise esta imagem de uma nota fiscal ou comprovante de compra e extraia informações sobre TODOS os produtos/peças listados.

    IMPORTANTE: 
    - Identifique TODOS os produtos/itens da nota fiscal
    - Para cada produto, extraia: nome, quantidade, valor unitário, valor total
    - Identifique o valor total do frete (se houver)
    - Identifique o fornecedor/loja
    - Retorne APENAS um JSON válido no formato exato abaixo
    - Use números decimais para preços (ex: 15.50, não R$ 15,50)

    Formato de resposta (JSON apenas):
    {
      "fornecedor_geral": "nome_do_fornecedor_ou_loja",
      "frete_total": 0.00,
      "pecas": [
        {
          "nome": "nome_do_produto_1",
          "quantidade": 1,
          "valor_unitario": 0.00,
          "valor_total": 0.00,
          "preco_custo": 0.00,
          "frete": 0.00
        },
        {
          "nome": "nome_do_produto_2",
          "quantidade": 1,
          "valor_unitario": 0.00,
          "valor_total": 0.00,
          "preco_custo": 0.00,
          "frete": 0.00
        }
      ]
    }

    REGRAS PARA CÁLCULO DO FRETE:
    - Se houver frete total na nota, divida proporcionalmente entre os produtos baseado no valor total de cada um
    - Se não houver frete, use 0 para todos
    - preco_custo deve ser igual ao valor_unitario
    - frete deve ser a parte proporcional do frete total para cada produto
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageFile.type
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Não foi possível extrair dados válidos da imagem');
    }

    const dadosExtraidos = JSON.parse(jsonMatch[0]) as ResultadoAnalise;
    
    // Validar dados extraídos
    if (!dadosExtraidos.pecas || !Array.isArray(dadosExtraidos.pecas) || dadosExtraidos.pecas.length === 0) {
      throw new Error('Nenhum produto foi encontrado na nota fiscal');
    }

    // Calcular frete proporcional se necessário
    const freteTotal = dadosExtraidos.frete_total || 0;
    const valorTotalGeral = dadosExtraidos.pecas.reduce((sum, peca) => sum + (peca.valor_total || 0), 0);
    
    const pecasProcessadas = dadosExtraidos.pecas.map(peca => {
      const freteProporcional = valorTotalGeral > 0 ? (freteTotal * (peca.valor_total || 0)) / valorTotalGeral : 0;
      
      return {
        nome: peca.nome || 'Produto não identificado',
        preco_custo: Number(peca.valor_unitario) || 0,
        frete: Number(freteProporcional.toFixed(2)) || 0,
        fornecedor: dadosExtraidos.fornecedor_geral || 'Não identificado',
        quantidade: Number(peca.quantidade) || 1,
        valor_unitario: Number(peca.valor_unitario) || 0,
        valor_total: Number(peca.valor_total) || 0
      };
    });

    return {
      pecas: pecasProcessadas,
      frete_total: freteTotal,
      fornecedor_geral: dadosExtraidos.fornecedor_geral || 'Não identificado'
    };

  } catch (error) {
    console.error('Erro ao analisar nota fiscal completa:', error);
    throw new Error('Falha ao analisar a nota fiscal. Verifique se a imagem contém uma nota fiscal válida com produtos listados.');
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remover o prefixo data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export function validarImagemPeca(file: File): { valido: boolean; erro?: string } {
  // Verificar tipo de arquivo
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!tiposPermitidos.includes(file.type)) {
    return {
      valido: false,
      erro: 'Tipo de arquivo não suportado. Use JPG, PNG ou WebP.'
    };
  }

  // Verificar tamanho (máximo 10MB)
  const tamanhoMaximo = 10 * 1024 * 1024; // 10MB
  if (file.size > tamanhoMaximo) {
    return {
      valido: false,
      erro: 'Arquivo muito grande. Máximo 10MB.'
    };
  }

  return { valido: true };
}