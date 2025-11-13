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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp', generationConfig: { temperature: 0.1, topK: 1, topP: 0.8, maxOutputTokens: 1024 } });

    const prompt = `Analise esta imagem de uma nota fiscal, comprovante de compra ou produto e extraia as seguintes informações:\n\n1. Nome da peça/produto (seja específico e técnico)\n2. Preço de custo unitário (número decimal)\n3. Valor do frete (decimal, 0 se ausente)\n4. Nome do fornecedor/loja\n5. Quantidade (1 se ausente)\n\nRetorne apenas JSON no formato:\n{\n  \"nome\": \"\",\n  \"preco_custo\": 0.00,\n  \"frete\": 0.00,\n  \"fornecedor\": \"\",\n  \"quantidade\": 1\n}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType: file.type } }
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Resposta não contém JSON válido' }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const payload = {
      nome: String(parsed.nome || '').trim(),
      preco_custo: Number(parsed.preco_custo) || 0,
      frete: Number(parsed.frete) || 0,
      fornecedor: parsed.fornecedor || 'Não identificado',
      quantidade: Number(parsed.quantidade) || 1
    };

    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Erro ao analisar imagem', details: error?.message || 'desconhecido' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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

