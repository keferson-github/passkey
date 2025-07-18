import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Plus, 
  Shield, 
  Key, 
  User, 
  Settings, 
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { PasswordGenerator } from './PasswordGenerator';
import { AddPasswordDialog } from './AddPasswordDialog';

export const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  // Mock data - será substituído por dados reais do banco
  const mockPasswords = [
    {
      id: '1',
      title: 'Gmail Principal',
      email: 'usuario@gmail.com',
      password: 'MinhaSenhaSegura123!',
      category: 'Social Media',
      accountType: 'Google',
      subcategory: 'Gmail',
      description: 'Conta principal do Gmail',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'LinkedIn Profissional',
      email: 'usuario@empresa.com',
      password: 'LinkedIn@2024#Pro',
      category: 'Work & Business',
      accountType: 'LinkedIn',
      subcategory: 'LinkedIn',
      description: 'Perfil profissional LinkedIn',
      createdAt: '2024-01-10'
    }
  ];

  const filteredPasswords = mockPasswords.filter(password =>
    password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.accountType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Toast notification will be added later
      console.log(`${label} copiado para a área de transferência`);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold text-primary">PassKey</h1>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar senhas por tipo ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordGenerator(true)}
                className="hidden md:flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Gerador
              </Button>
              
              <Button
                onClick={() => setShowAddPassword(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova senha
              </Button>

              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(profile?.display_name || user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{profile?.display_name}</p>
                  {profile?.is_admin && (
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                  )}
                </div>

                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de senhas</p>
                  <p className="text-2xl font-bold">{mockPasswords.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Senhas fortes</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Categorias</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="text-sm">Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          
          <div className="flex gap-2">
            <Badge variant="secondary">Todas (2)</Badge>
            <Badge variant="outline">Social Media (1)</Badge>
            <Badge variant="outline">Work & Business (1)</Badge>
          </div>
        </div>

        {/* Passwords Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPasswords.map((password) => (
            <Card key={password.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{password.title}</CardTitle>
                    <CardDescription>{password.email}</CardDescription>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Category and Type */}
                  <div className="flex gap-2">
                    <Badge variant="outline">{password.category}</Badge>
                    <Badge variant="secondary">{password.accountType}</Badge>
                    {password.subcategory && (
                      <Badge variant="outline">{password.subcategory}</Badge>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Senha</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={visiblePasswords.has(password.id) ? "text" : "password"}
                        value={password.password}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(password.id)}
                      >
                        {visiblePasswords.has(password.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(password.password, 'Senha')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {password.description && (
                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <p className="text-sm text-muted-foreground">{password.description}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(password.email, 'Email')}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${password.email}:${password.password}`, 'Credenciais')}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar tudo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPasswords.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhuma senha encontrada' : 'Nenhuma senha cadastrada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente buscar por outro termo ou limpe o filtro.'
                : 'Comece adicionando sua primeira senha para manter suas contas seguras.'
              }
            </p>
            <Button onClick={() => setShowAddPassword(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeira senha
            </Button>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <PasswordGenerator 
        open={showPasswordGenerator} 
        onOpenChange={setShowPasswordGenerator} 
      />
      
      <AddPasswordDialog 
        open={showAddPassword} 
        onOpenChange={setShowAddPassword} 
      />
    </div>
  );
};