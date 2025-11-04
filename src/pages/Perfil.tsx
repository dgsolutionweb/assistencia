import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { 
  User, 
  Mail, 
  Lock, 
  Shield,
  LogOut,
  Save,
  Settings,
  Bell,
  Download,
  Trash2,
  Calendar,
  Key,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/Loading'
import { useAuth } from '@/hooks/useAuth'
import { useMobile } from '@/hooks/useMobile'
import { HapticService } from '@/services/HapticService'
import TouchableCard from '@/components/mobile/TouchableCard'
import FloatingActionButton from '@/components/mobile/FloatingActionButton'
import { supabase } from '@/lib/supabase'

// Schema de validação para mudança de senha
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
})

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>

// Mobile Profile Component
function MobilePerfil({ 
  user, 
  isChangingPassword, 
  isSigningOut, 
  register, 
  handleSubmit, 
  errors, 
  handlePasswordChange, 
  handleSignOut, 
  resetPassword 
}: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Perfil</h1>
            <p className="text-blue-100 text-sm">Gerencie sua conta</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <User className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-20">
        {/* User Info Card */}
        <TouchableCard className="bg-white rounded-xl shadow-sm border-0">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações Pessoais</h3>
                <p className="text-sm text-gray-500">Dados da sua conta</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Mail className="h-4 w-4 text-gray-500 mr-3" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-sm text-gray-900">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-500 mr-3" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Membro desde</p>
                  <p className="text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Shield className="h-4 w-4 text-gray-500 mr-3" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID</p>
                  <p className="text-xs text-gray-900 font-mono">{user?.id?.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
        </TouchableCard>

        {/* Password Change Card */}
        <TouchableCard className="bg-white rounded-xl shadow-sm border-0">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Key className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Alterar Senha</h3>
                <p className="text-sm text-gray-500">Mantenha sua conta segura</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
              <Input
                label="Senha Atual"
                type="password"
                {...register('currentPassword')}
                error={errors.currentPassword?.message}
                disabled={isChangingPassword}
                className="text-sm"
              />

              <Input
                label="Nova Senha"
                type="password"
                {...register('newPassword')}
                error={errors.newPassword?.message}
                disabled={isChangingPassword}
                className="text-sm"
              />

              <Input
                label="Confirmar Nova Senha"
                type="password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isChangingPassword}
                className="text-sm"
              />

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => HapticService.trigger('medium')}
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
                onClick={() => {
                  HapticService.trigger('light')
                  resetPassword()
                }}
                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                Esqueci minha senha
              </Button>
            </div>
          </div>
        </TouchableCard>

        {/* Settings Card */}
        <TouchableCard className="bg-white rounded-xl shadow-sm border-0">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Configurações</h3>
                <p className="text-sm text-gray-500">Preferências da conta</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Bell className="h-4 w-4 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Notificações</p>
                    <p className="text-xs text-gray-500">Receba atualizações por email</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled>
                  Em breve
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Download className="h-4 w-4 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Backup</p>
                    <p className="text-xs text-gray-500">Backup automático na nuvem</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled>
                  Em breve
                </Button>
              </div>
            </div>
          </div>
        </TouchableCard>

        {/* Danger Zone Card */}
        <TouchableCard className="bg-white rounded-xl shadow-sm border border-red-200">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Zona de Perigo</h3>
                <p className="text-sm text-red-600">Ações irreversíveis</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <LogOut className="h-4 w-4 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Sair da Conta</p>
                    <p className="text-xs text-red-600">Fazer logout</p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    HapticService.trigger('heavy')
                    handleSignOut()
                  }}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Sair'
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <Trash2 className="h-4 w-4 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Excluir Conta</p>
                    <p className="text-xs text-red-600">Excluir permanentemente</p>
                  </div>
                </div>
                <Button variant="danger" size="sm" disabled>
                  Em breve
                </Button>
              </div>
            </div>
          </div>
        </TouchableCard>
      </div>
    </div>
  )
}

// Desktop Profile Component
function DesktopPerfil({ 
  user, 
  isChangingPassword, 
  isSigningOut, 
  register, 
  handleSubmit, 
  errors, 
  handlePasswordChange, 
  handleSignOut, 
  resetPassword 
}: any) {
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

export function Perfil() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useMobile()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema)
  })

  const handlePasswordChange = async (data: PasswordChangeForm) => {
    try {
      setIsChangingPassword(true)

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) throw error

      toast.success('Senha alterada com sucesso!')
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      navigate('/login')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout')
      setIsSigningOut(false)
    }
  }

  const resetPassword = async () => {
    try {
      if (!user?.email) {
        toast.error('Email não encontrado')
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      toast.success('Email de recuperação enviado!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de recuperação')
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