import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Plus, 
  Shield, 
  Key, 
  User, 
  Settings as SettingsIcon, 
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Filter,
  Loader2,
  ChevronDown,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PasswordGenerator } from './PasswordGenerator';
import { AddPasswordDialog } from './AddPasswordDialog';
import { EditPasswordDialog } from './EditPasswordDialog';
import { useNavigate } from 'react-router-dom';
import { usePasswords, usePasswordStats, Password } from '@/hooks/usePasswords';
import { toast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { passwords, isLoading, refetch, deletePassword } = usePasswords();
  const { stats } = usePasswordStats();
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const navigate = useNavigate();
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>([]);
  const [passwordStrengthFilter, setPasswordStrengthFilter] = useState<'all' | 'strong' | 'weak'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'recent' | 'older'>('all');

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const filteredPasswords = passwords.filter(password => {
    // Text search filter
    const matchesSearch = password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.account_type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.subcategory?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(password.category.name);

    // Account type filter
    const matchesAccountType = selectedAccountTypes.length === 0 || 
      selectedAccountTypes.includes(password.account_type.name);

    // Password strength filter
    const passwordLength = password.password_hash.length;
    const matchesStrength = passwordStrengthFilter === 'all' ||
      (passwordStrengthFilter === 'strong' && passwordLength >= 12) ||
      (passwordStrengthFilter === 'weak' && passwordLength < 8);

    // Date filter
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(password.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'recent' && daysDiff <= 7) ||
      (dateFilter === 'older' && daysDiff > 7);

    return matchesSearch && matchesCategory && matchesAccountType && matchesStrength && matchesDate;
  });

  // Filter management functions
  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleAccountTypeFilter = (accountType: string) => {
    setSelectedAccountTypes(prev => 
      prev.includes(accountType) 
        ? prev.filter(at => at !== accountType)
        : [...prev, accountType]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedAccountTypes([]);
    setPasswordStrengthFilter('all');
    setDateFilter('all');
  };

  // Get unique categories and account types
  const uniqueCategories = [...new Set(passwords.map(p => p.category.name))].sort();
  const uniqueAccountTypes = [...new Set(passwords.map(p => p.account_type.name))].sort();

  const hasActiveFilters = selectedCategories.length > 0 || 
    selectedAccountTypes.length > 0 || 
    passwordStrengthFilter !== 'all' || 
    dateFilter !== 'all';

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência.`,
      });
    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  const copyAllPasswordData = async (password: Password) => {
    try {
      const formattedData = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '🔐 INFORMAÇÕES DA SENHA',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `📝 Título: ${password.title}`,
        `📧 Email: ${password.email}`,
        `🔑 Senha: ${password.password_hash}`,
        '',
        '📂 CATEGORIZAÇÃO',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `🏷️ Categoria: ${password.category.name}`,
        `🔖 Tipo de Conta: ${password.account_type.name}`,
        ...(password.subcategory ? [`🏷️ Subcategoria: ${password.subcategory.name}`] : []),
        '',
        ...(password.description ? [
          '📋 DESCRIÇÃO',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `📄 ${password.description}`,
          ''
        ] : []),
        '📅 INFORMAÇÕES ADICIONAIS',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `📅 Criado em: ${new Date(password.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        `🔄 Atualizado em: ${new Date(password.updated_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '🔒 Gerado pelo PassKey - Gerenciador de Senhas',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      ].flat().join('\n');

      await navigator.clipboard.writeText(formattedData);
      toast({
        title: "Dados copiados!",
        description: "Todas as informações da senha foram copiadas para a área de transferência.",
      });
    } catch (err) {
      console.error('Erro ao copiar dados da senha:', err);
      toast({
        title: "Erro",
        description: "Não foi possível copiar as informações da senha.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePassword = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a senha "${title}"?`)) {
      deletePassword(id);
    }
  };

  const handleAddPasswordSuccess = () => {
    setShowAddPassword(false);
    refetch();
  };

  const handleEditPassword = (password: Password) => {
    console.log('Dashboard: handleEditPassword called with password:', password);
    console.log('Dashboard: Current states before edit:', {
      showEditPassword,
      editingPassword
    });
    setEditingPassword(password);
    setShowEditPassword(true);
    console.log('Dashboard: States after setting edit:', {
      passwordToEdit: password,
      dialogWillOpen: true
    });
  };

  const handleEditPasswordClose = () => {
    setShowEditPassword(false);
    setEditingPassword(null);
  };

  const handleEditPasswordSuccess = () => {
    console.log('Dashboard: handleEditPasswordSuccess called');
    setShowEditPassword(false);
    setEditingPassword(null);
    refetch();
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
                  placeholder="Pesquisar por título, email, categoria, tipo ou descrição..."
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
                {/* Theme Toggle */}
                <div className="flex items-center gap-2 mr-2">
                  <Sun className="w-4 h-4" />
                  <Switch 
                    checked={theme === 'dark'} 
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    id="theme-toggle"
                  />
                  <Moon className="w-4 h-4" />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/configuracoes')}
                  title="Configurações"
                >
                  <SettingsIcon className="w-4 h-4" />
                </Button>

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
                  <p className="text-2xl font-bold">{isLoading ? '-' : stats.total}</p>
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
                  <p className="text-2xl font-bold">{isLoading ? '-' : stats.strong}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Senhas fracas</p>
                  <p className="text-2xl font-bold">{isLoading ? '-' : stats.weak}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-info" />
                <div>
                  <p className="text-sm text-muted-foreground">Recentes (7 dias)</p>
                  <p className="text-2xl font-bold">{isLoading ? '-' : stats.recent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            <div className="flex gap-2">
              <Badge variant="secondary">
                {filteredPasswords.length} de {passwords.length} senhas
              </Badge>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-6 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categorias</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueCategories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategoryFilter(category)}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {category}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {passwords.filter(p => p.category.name === category).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipos de Conta</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueAccountTypes.map(accountType => (
                      <div key={accountType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`account-${accountType}`}
                          checked={selectedAccountTypes.includes(accountType)}
                          onCheckedChange={() => toggleAccountTypeFilter(accountType)}
                        />
                        <label
                          htmlFor={`account-${accountType}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {accountType}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {passwords.filter(p => p.account_type.name === accountType).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password Strength Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Força da Senha</label>
                  <Select value={passwordStrengthFilter} onValueChange={(value: 'all' | 'strong' | 'weak') => setPasswordStrengthFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a força" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as senhas</SelectItem>
                      <SelectItem value="strong">Senhas fortes (12+ caracteres)</SelectItem>
                      <SelectItem value="weak">Senhas fracas (&lt;8 caracteres)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Criação</label>
                  <Select value={dateFilter} onValueChange={(value: 'all' | 'recent' | 'older') => setDateFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as datas</SelectItem>
                      <SelectItem value="recent">Últimos 7 dias</SelectItem>
                      <SelectItem value="older">Mais de 7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium">Filtros ativos:</span>
                    {selectedCategories.map(category => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                        <button
                          onClick={() => toggleCategoryFilter(category)}
                          className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedAccountTypes.map(accountType => (
                      <Badge key={accountType} variant="secondary" className="text-xs">
                        {accountType}
                        <button
                          onClick={() => toggleAccountTypeFilter(accountType)}
                          className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {passwordStrengthFilter !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {passwordStrengthFilter === 'strong' ? 'Senhas fortes' : 'Senhas fracas'}
                        <button
                          onClick={() => setPasswordStrengthFilter('all')}
                          className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {dateFilter !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {dateFilter === 'recent' ? 'Últimos 7 dias' : 'Mais de 7 dias'}
                        <button
                          onClick={() => setDateFilter('all')}
                          className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Passwords Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Carregando senhas...</span>
          </div>
        ) : (
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditPassword(password)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePassword(password.id, password.title)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Category and Type */}
                  <div className="flex gap-2">
                    <Badge variant="outline">{password.category.name}</Badge>
                    <Badge variant="secondary">{password.account_type.name}</Badge>
                    {password.subcategory && (
                      <Badge variant="outline">{password.subcategory.name}</Badge>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Senha</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={visiblePasswords.has(password.id) ? "text" : "password"}
                        value={password.password_hash}
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
                        onClick={() => copyToClipboard(password.password_hash, 'Senha')}
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
                      onClick={() => copyAllPasswordData(password)}
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
        )}

        {/* Empty State */}
        {!isLoading && filteredPasswords.length === 0 && (
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
        onSuccess={handleAddPasswordSuccess} 
      />

      <EditPasswordDialog 
        open={showEditPassword} 
        onOpenChange={handleEditPasswordClose}
        password={editingPassword}
        onSuccess={handleEditPasswordSuccess} 
      />

      
    </div>
  );
};