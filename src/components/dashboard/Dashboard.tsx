import React, { useState, useEffect } from 'react';
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
  X,
  ArrowLeft
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
import { translateCategory, translateAccountType, translateSubcategory } from '@/utils/translations';

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
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>([]);
  const [passwordStrengthFilter, setPasswordStrengthFilter] = useState<'all' | 'strong' | 'weak'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'recent' | 'older'>('all');

  // Scroll detection for back to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        `🏷️ Categoria: ${translateCategory(password.category.name)}`,
        `🔖 Tipo de Conta: ${translateAccountType(password.account_type.name)}`,
        ...(password.subcategory ? [`🏷️ Subcategoria: ${translateSubcategory(password.subcategory.name)}`] : []),
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
      {/* Header - Mobile First */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="px-4 py-3 md:py-4">
          {/* Top Row - Logo and User Menu */}
          <div className="flex items-center justify-between mb-3 md:mb-0">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <h1 className="text-lg md:text-xl font-bold text-primary">PassKey</h1>
            </div>

            {/* Mobile User Menu */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordGenerator(true)}
                className="md:hidden"
                title="Gerador de senha"
              >
                <Key className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => setShowAddPassword(true)}
                size="sm"
                className="md:hidden"
                title="Nova senha"
              >
                <Plus className="w-4 h-4" />
              </Button>

              {/* Theme Toggle - Mobile */}
              <div className="flex items-center gap-1 md:hidden">
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  id="theme-toggle-mobile"
                  className="scale-75"
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/configuracoes')}
                className="md:hidden"
                title="Configurações"
              >
                <SettingsIcon className="w-4 h-4" />
              </Button>

              <Avatar className="w-8 h-8 md:w-9 md:h-9">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(profile?.display_name || user?.email || '')}
                </AvatarFallback>
              </Avatar>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="md:hidden"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Desktop Header Row */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar senhas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordGenerator(true)}
                className="flex items-center gap-2"
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
                <div className="flex items-center gap-2 mr-2">
                  <Sun className="w-4 h-4" />
                  <Switch 
                    checked={theme === 'dark'} 
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    id="theme-toggle-desktop"
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
                
                <div className="text-right">
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

          {/* Mobile Search Row */}
          <div className="md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar senhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 md:py-6 max-w-7xl mx-auto">
        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="border-0 shadow-sm md:border md:shadow-md">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                  <p className="text-xl md:text-2xl font-bold">{isLoading ? '-' : stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm md:border md:shadow-md">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm text-muted-foreground">Fortes</p>
                  <p className="text-xl md:text-2xl font-bold">{isLoading ? '-' : stats.strong}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm md:border md:shadow-md">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm text-muted-foreground">Fracas</p>
                  <p className="text-xl md:text-2xl font-bold">{isLoading ? '-' : stats.weak}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm md:border md:shadow-md">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm text-muted-foreground">Recentes</p>
                  <p className="text-xl md:text-2xl font-bold">{isLoading ? '-' : stats.recent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Mobile Optimized */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="sm" 
              className="flex items-center justify-center gap-2 w-full md:w-auto min-h-[44px] md:min-h-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                  {[...selectedCategories, ...selectedAccountTypes].length + 
                   (passwordStrengthFilter !== 'all' ? 1 : 0) + 
                   (dateFilter !== 'all' ? 1 : 0)}
                </Badge>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 md:px-3 md:py-1 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl md:rounded-lg border border-primary/20 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm md:text-sm font-medium text-primary">
                  {filteredPasswords.length} de {passwords.length} senhas
                </span>
              </div>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-auto px-3 py-1 text-xs w-full md:w-auto"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Filter Panel - Mobile Optimized */}
          {showFilters && (
            <Card className="border-0 shadow-sm md:border md:shadow-md">
              <CardContent className="p-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Category Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold">Categorias</label>
                    <div className="space-y-3 max-h-40 md:max-h-32 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                      {uniqueCategories.map(category => (
                        <div key={category} className="flex items-center space-x-3 min-h-[44px] md:min-h-auto">
                          <Checkbox
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategoryFilter(category)}
                            className="scale-110 md:scale-100"
                          />
                          <label
                            htmlFor={`category-${category}`}
                            className="text-sm cursor-pointer flex-1 py-2 md:py-0"
                          >
                            {translateCategory(category)}
                          </label>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {passwords.filter(p => p.category.name === category).length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Type Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold">Tipos de Conta</label>
                    <div className="space-y-3 max-h-40 md:max-h-32 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                      {uniqueAccountTypes.map(accountType => (
                        <div key={accountType} className="flex items-center space-x-3 min-h-[44px] md:min-h-auto">
                          <Checkbox
                            id={`account-${accountType}`}
                            checked={selectedAccountTypes.includes(accountType)}
                            onCheckedChange={() => toggleAccountTypeFilter(accountType)}
                            className="scale-110 md:scale-100"
                          />
                          <label
                            htmlFor={`account-${accountType}`}
                            className="text-sm cursor-pointer flex-1 py-2 md:py-0"
                          >
                            {translateAccountType(accountType)}
                          </label>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {passwords.filter(p => p.account_type.name === accountType).length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password Strength Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold">Força da Senha</label>
                    <Select value={passwordStrengthFilter} onValueChange={(value: 'all' | 'strong' | 'weak') => setPasswordStrengthFilter(value)}>
                      <SelectTrigger className="h-11 md:h-auto text-base md:text-sm">
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
                  <div className="space-y-3">
                    <label className="text-sm font-semibold">Data de Criação</label>
                    <Select value={dateFilter} onValueChange={(value: 'all' | 'recent' | 'older') => setDateFilter(value)}>
                      <SelectTrigger className="h-11 md:h-auto text-base md:text-sm">
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
                  <div className="pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium">Filtros ativos:</span>
                      {selectedCategories.map(category => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {translateCategory(category)}
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
                          {translateAccountType(accountType)}
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Passwords Grid - Mobile Optimized */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <span className="text-sm text-muted-foreground">Carregando suas senhas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPasswords.map((password) => (
              <Card key={password.id} className="border-0 shadow-sm md:border md:shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3 px-4 pt-4 md:px-6 md:pt-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-lg font-semibold truncate">{password.title}</CardTitle>
                      <CardDescription className="text-sm truncate">{password.email}</CardDescription>
                    </div>
                    
                    <div className="flex gap-2 md:gap-1 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditPassword(password)}
                        className="h-9 w-9 p-0 md:h-auto md:w-auto md:p-2"
                        title="Editar senha"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePassword(password.id, password.title)}
                        className="h-9 w-9 p-0 md:h-auto md:w-auto md:p-2 hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir senha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                <div className="space-y-4">
                  {/* Category and Type */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">{translateCategory(password.category.name)}</Badge>
                    <Badge variant="secondary" className="text-xs">{translateAccountType(password.account_type.name)}</Badge>
                    {password.subcategory && (
                      <Badge variant="outline" className="text-xs">{translateSubcategory(password.subcategory.name)}</Badge>
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
                        className="flex-1 h-11 md:h-auto text-base md:text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(password.id)}
                        className="h-11 w-11 p-0 md:h-auto md:w-auto md:p-2 shrink-0"
                        title={visiblePasswords.has(password.id) ? "Ocultar senha" : "Mostrar senha"}
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
                        className="h-11 w-11 p-0 md:h-auto md:w-auto md:p-2 shrink-0"
                        title="Copiar senha"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {password.description && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Descrição</label>
                      <p className="text-sm text-muted-foreground break-words">{password.description}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col md:flex-row gap-3 md:gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(password.email, 'Email')}
                      className="flex-1 min-h-[44px] md:min-h-auto justify-center"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyAllPasswordData(password)}
                      className="flex-1 min-h-[44px] md:min-h-auto justify-center"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar tudo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {/* Empty State - Mobile Optimized */}
        {!isLoading && filteredPasswords.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="max-w-sm mx-auto">
              <div className="flex h-20 w-20 md:h-16 md:w-16 items-center justify-center mx-auto mb-6 rounded-full bg-muted/50">
                <Shield className="w-10 h-10 md:w-8 md:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">
                {searchTerm || hasActiveFilters ? 'Nenhuma senha encontrada' : 'Nenhuma senha cadastrada'}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
                {searchTerm || hasActiveFilters
                  ? 'Tente ajustar os filtros de busca ou limpe os filtros ativos para ver mais resultados.'
                  : 'Comece adicionando sua primeira senha para manter todas as suas contas seguras em um só lugar.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => setShowAddPassword(true)}
                  className="min-h-[44px] px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {searchTerm || hasActiveFilters ? 'Adicionar nova senha' : 'Adicionar primeira senha'}
                </Button>
                {(searchTerm || hasActiveFilters) && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      clearAllFilters();
                    }}
                    className="min-h-[44px] px-6"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile FAB - Add Password Button */}
      {!isLoading && filteredPasswords.length > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Button
            onClick={() => setShowAddPassword(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 p-0"
            title="Adicionar nova senha"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}

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

      {/* Back to Top Button */}
      {showScrollTop && (
        <div className="fixed bottom-6 left-6 z-50">
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            variant="outline"
            size="sm"
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 p-0 bg-background/80 backdrop-blur-sm border-primary/20 animate-in fade-in-0 slide-in-from-bottom-2"
            title="Voltar ao Topo"
          >
            <ArrowLeft className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      )}

      
    </div>
  );
};