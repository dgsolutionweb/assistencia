export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Chave da API não configurada' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'Nenhuma imagem foi enviada' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Arquivo deve ser uma imagem' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Imagem muito grande. Máximo 10MB' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const buffer = await file.arrayBuffer();
    const base64 = toBase64(buffer);

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp', generationConfig: { temperature: 0.1, topK: 1, topP: 0.8, maxOutputTokens: 2048 } });

    const prompt = `Analise esta imagem de uma nota fiscal ou comprovante e liste TODOS os itens.\nRetorne apenas JSON no formato:\n{\n  \"fornecedor_geral\": \"\",\n  \"frete_total\": 0.00,\n  \"pecas\": [\n    { \"nome\": \"\", \"quantidade\": 1, \"valor_unitario\": 0.00, \"valor_total\": 0.00, \"preco_custo\": 0.00, \"frete\": 0.00 }\n  ]\n}\nRegras: frete_total deve ser distribuído proporcionalmente por valor_total.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType: file.type } }
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Não foi possível extrair dados válidos da imagem' }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    const data = JSON.parse(jsonMatch[0]);
    const freteTotal = Number(data.frete_total) || 0;
    const pecas = Array.isArray(data.pecas) ? data.pecas : [];
    const valorTotalGeral = pecas.reduce((sum: number, p: any) => sum + (Number(p.valor_total) || 0), 0);
    const processed = pecas.map((p: any) => {
      const ft = valorTotalGeral > 0 ? (freteTotal * (Number(p.valor_total) || 0)) / valorTotalGeral : 0;
      return {
        nome: String(p.nome || 'Produto não identificado'),
        preco_custo: Number(p.valor_unitario) || 0,
        frete: Number(ft.toFixed(2)) || 0,
        fornecedor: data.fornecedor_geral || 'Não identificado',
        quantidade: Number(p.quantidade) || 1,
        valor_unitario: Number(p.valor_unitario) || 0,
        valor_total: Number(p.valor_total) || 0
      };
    });

    const payload = { pecas: processed, frete_total: freteTotal, fornecedor_geral: data.fornecedor_geral || 'Não identificado' };
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Erro ao analisar nota', details: error?.message || 'desconhecido' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

function toBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

