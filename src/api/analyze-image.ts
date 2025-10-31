import { analyzePartImage } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma imagem foi enviada' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'Arquivo deve ser uma imagem' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Imagem muito grande. Máximo 10MB' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Analisar imagem com Gemini
    const result = await analyzePartImage(file)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro ao analisar imagem:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor ao analisar imagem',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}