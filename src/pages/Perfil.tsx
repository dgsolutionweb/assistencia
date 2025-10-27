import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/Loading'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  User, 
  Mail, 
  Lock, 
  Shield,
  LogOut,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Senha atual deve ter pelo menos 6 caracteres'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação deve ter pelo menos 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

type PasswordForm = z.infer<typeof passwordSchema>

export function Perfil() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { user, signOut } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const handlePasswordChange = async (data: PasswordForm) => {
    setIsChangingPassword(true)
    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      })

      if (signInError) {
        toast.error('Senha atual incorreta')
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) throw error

      toast.success('Senha alterada com sucesso!')
      reset()
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Erro ao alterar senha')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const { error } = await signOut()
      if (error) throw error
      
      toast.success('Logout realizado com sucesso!')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Erro ao fazer logout')
    } finally {
      setIsSigningOut(false)
    }
  }

  const resetPassword = async () => {
    if (!user?.email) return

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.')
    } catch (error) {
      console.error('Error sending reset email:', error)
      toast.error('Erro ao enviar email de recuperação')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e configurações</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Suas informações de conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">ID do Usuário</p>
                <p className="text-sm text-gray-600 font-mono">{user?.id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Conta criada em</p>
                <p className="text-sm text-gray-600">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Mantenha sua conta segura com uma senha forte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
              <Input
                label="Senha Atual"
                type="password"
                {...register('currentPassword')}
                error={errors.currentPassword?.message}
                disabled={isChangingPassword}
              />

              <Input
                label="Nova Senha"
                type="password"
                {...register('newPassword')}
                error={errors.newPassword?.message}
                disabled={isChangingPassword}
              />

              <Input
                label="Confirmar Nova Senha"
                type="password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isChangingPassword}
              />

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full"
              >
                {isChangingPassword ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Alterando...</span>
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={resetPassword}
                className="w-full text-red-600 hover:text-red-700"
              >
                Esqueci minha senha - Enviar email de recuperação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Conta</CardTitle>
          <CardDescription>
            Gerencie suas preferências e configurações de segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Notificações por Email</h3>
                <p className="text-sm text-gray-600">
                  Receba atualizações sobre seus serviços e relatórios
                </p>
              </div>
              <Button variant="secondary" disabled>
                Em breve
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Backup Automático</h3>
                <p className="text-sm text-gray-600">
                  Backup automático dos seus dados na nuvem
                </p>
              </div>
              <Button variant="secondary" disabled>
                Em breve
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Exportação de Dados</h3>
                <p className="text-sm text-gray-600">
                  Baixe todos os seus dados em formato CSV
                </p>
              </div>
              <Button variant="secondary" disabled>
                Em breve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis relacionadas à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <h3 className="font-medium text-red-800">Sair da Conta</h3>
                <p className="text-sm text-red-600">
                  Fazer logout e retornar à tela de login
                </p>
              </div>
              <Button
                variant="danger"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <h3 className="font-medium text-red-800">Excluir Conta</h3>
                <p className="text-sm text-red-600">
                  Excluir permanentemente sua conta e todos os dados
                </p>
              </div>
              <Button variant="danger" disabled>
                Em breve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}