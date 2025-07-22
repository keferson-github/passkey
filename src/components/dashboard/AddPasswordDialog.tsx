import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Plus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { translateCategory, translateAccountType, translateSubcategory } from '@/utils/translations';

interface AddPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AccountType {
  id: string;
  name: string;
  icon: string;
}

interface Subcategory {
  id: string;
  name: string;
  icon: string;
}

export const AddPasswordDialog: React.FC<AddPasswordDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load categories and account types
  useEffect(() => {
    if (open) {
      loadCategories();
      loadAccountTypes();
    }
  }, [open]);

  // Load subcategories when account type changes
  useEffect(() => {
    if (selectedAccountType) {
      loadSubcategories(selectedAccountType);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedAccountType]);

  const loadCategories = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('password_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadAccountTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('account_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAccountTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de conta.",
        variant: "destructive"
      });
    }
  };

  const loadSubcategories = async (accountTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('account_subcategories')
        .select('*')
        .eq('account_type_id', accountTypeId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as subcategorias.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setEmail('');
    setPassword('');
    setDescription('');
    setSelectedCategory('');
    setSelectedAccountType('');
    setSelectedSubcategory('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar senhas.",
        variant: "destructive"
      });
      return;
    }

    if (!title || !email || !password || !selectedCategory || !selectedAccountType) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // In a real application, you would encrypt the password before storing
      // For this demo, we'll store it as is (NOT recommended for production)
      const { error } = await supabase
        .from('passwords')
        .insert({
          user_id: user.id,
          category_id: selectedCategory,
          account_type_id: selectedAccountType,
          subcategory_id: selectedSubcategory || null,
          title,
          email,
          password_hash: password, // This should be encrypted in production
          description: description || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha salva com sucesso!",
        variant: "default"
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();

    } catch (error: unknown) {
      console.error('Erro ao salvar senha:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar a senha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[85vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[10px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Adicionar Nova Senha
          </DialogTitle>
          <DialogDescription>
            Cadastre uma nova senha de forma segura e organizada
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Gmail Principal, LinkedIn Profissional"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite ou gere uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="account-type">Tipo de Conta *</Label>
            <Select value={selectedAccountType} onValueChange={setSelectedAccountType} disabled={loadingData}>
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o tipo de conta"} />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {translateAccountType(type.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loadingData}>
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione uma categoria"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {translateCategory(category.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria</Label>
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma subcategoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {translateSubcategory(sub.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Adicione uma descrição para lembrar do contexto desta senha..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingData}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Salvar senha
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};