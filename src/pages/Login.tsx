import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/Loading'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const { error } = isSignUp 
        ? await signUp(data.email, data.password)
        : await signIn(data.email, data.password)

      if (error) {
        toast.error(error.message)
      } else {
        if (isSignUp) {
          toast.success('Conta criada com sucesso! Verifique seu email.')
        } else {
          toast.success('Login realizado com sucesso!')
          navigate('/dashboard')
        }
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ConsertaPro
          </h1>
          <p className="mt-2 text-gray-600">
            Sistema de Gerenciamento de Assistência Técnica
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isSignUp ? 'Criar Conta' : 'Fazer Login'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Preencha os dados para criar sua conta'
                : 'Entre com suas credenciais para acessar o sistema'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
              />

              <Input
                label="Senha"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Processando...</span>
                  </div>
                ) : (
                  isSignUp ? 'Criar Conta' : 'Entrar'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-red-600 hover:text-red-500 text-sm"
                  disabled={isLoading}
                >
                  {isSignUp 
                    ? 'Já tem uma conta? Fazer login'
                    : 'Não tem uma conta? Criar conta'
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}