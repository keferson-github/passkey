import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Edit, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Password } from '@/hooks/usePasswords';
import { translateCategory, translateAccountType, translateSubcategory } from '@/utils/translations';

interface EditPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: Password | null;
  onSuccess?: () => void;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface AccountType {
  id: string;
  name: string;
  icon?: string;
}

interface Subcategory {
  id: string;
  name: string;
  account_type_id: string;
  icon?: string;
}

export const EditPasswordDialog: React.FC<EditPasswordDialogProps> = ({ 
  open, 
  onOpenChange, 
  password,
  onSuccess 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('none');
  
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load categories and account types when dialog opens
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
      setSelectedSubcategory('none');
    }
  }, [selectedAccountType]);

  // Populate form when password changes
  useEffect(() => {
    if (password && open) {
      console.log('EditPasswordDialog: Populating form with password data:', password);
      setTitle(password.title);
      setEmail(password.email);
      setPasswordValue(password.password_hash);
      setDescription(password.description || '');
      setSelectedCategory(password.category.id);
      setSelectedAccountType(password.account_type.id);
      // Set subcategory to 'none' initially, will be updated when subcategories load
      setSelectedSubcategory('none');
    }
  }, [password, open]);

  // Set subcategory after subcategories are loaded and password data is available
  useEffect(() => {
    if (password && subcategories.length > 0 && selectedAccountType === password.account_type.id) {
      console.log('EditPasswordDialog: Setting subcategory:', password.subcategory?.id || 'none');
      setSelectedSubcategory(password.subcategory?.id || 'none');
    }
  }, [subcategories, password, selectedAccountType]);

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
    setPasswordValue('');
    setDescription('');
    setSelectedCategory('');
    setSelectedAccountType('');
    setSelectedSubcategory('none');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('EditPasswordDialog: handleSubmit called', {
      user: !!user,
      password: !!password,
      title,
      email,
      passwordValue,
      selectedCategory,
      selectedAccountType,
      formData: {
        title,
        email,
        passwordValue,
        description,
        selectedCategory,
        selectedAccountType,
        selectedSubcategory
      }
    });
    
    if (!user || !password) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para editar senhas.",
        variant: "destructive"
      });
      return;
    }

    // Validação flexível - permite edição parcial dos campos
    // Apenas verifica se pelo menos um campo foi alterado
    const hasChanges = 
      title !== password.title ||
      email !== password.email ||
      passwordValue !== password.password_hash ||
      selectedCategory !== password.category.id ||
      selectedAccountType !== password.account_type.id ||
      selectedSubcategory !== (password.subcategory?.id || 'none') ||
      description !== (password.description || '');

    if (!hasChanges) {
      toast({
        title: "Nenhuma alteração",
        description: "Nenhum campo foi modificado. Faça pelo menos uma alteração para salvar.",
        variant: "default"
      });
      return;
    }

    // Validação básica - apenas campos que não podem estar vazios se foram preenchidos
    if (title && title.trim() === '') {
      toast({
        title: "Erro",
        description: "O título não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }

    if (email && email.trim() === '') {
      toast({
        title: "Erro",
        description: "O email não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }

    if (passwordValue && passwordValue.trim() === '') {
      toast({
        title: "Erro",
        description: "A senha não pode estar vazia.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Construir objeto de atualização apenas com campos alterados
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Adicionar apenas campos que foram alterados
      if (title !== password.title) {
        updateData.title = title;
      }
      
      if (email !== password.email) {
        updateData.email = email;
      }
      
      if (passwordValue !== password.password_hash) {
        updateData.password_hash = passwordValue;
      }
      
      if (selectedCategory !== password.category.id) {
        updateData.category_id = selectedCategory;
      }
      
      if (selectedAccountType !== password.account_type.id) {
        updateData.account_type_id = selectedAccountType;
      }
      
      if (selectedSubcategory !== (password.subcategory?.id || 'none')) {
        updateData.subcategory_id = selectedSubcategory === 'none' ? null : selectedSubcategory;
      }
      
      if (description !== (password.description || '')) {
        updateData.description = description || null;
      }

      console.log('EditPasswordDialog: Updating password with data:', updateData);

      const { error } = await supabase
        .from('passwords')
        .update(updateData)
        .eq('id', password.id);

      if (error) {
        console.error('EditPasswordDialog: Supabase error:', error);
        throw error;
      }

      console.log('EditPasswordDialog: Password updated successfully');

      toast({
        title: "Sucesso",
        description: "Senha atualizada com sucesso!",
        variant: "default"
      });

      onOpenChange(false);
      onSuccess?.();

    } catch (error: unknown) {
      console.error('Erro ao atualizar senha:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a senha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      // Delay reset to avoid visual glitches
      setTimeout(() => {
        resetForm();
      }, 150);
    }
  }, [open]);

  if (!password && open) {
    console.log('EditPasswordDialog: No password provided but dialog is open');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[85vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[10px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Editar Senha
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da sua senha de forma segura. Você pode alterar apenas os campos desejados - não é necessário preencher todos os campos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Edição Flexível</p>
                <p>Altere apenas os campos que desejar. Não é necessário preencher todos os campos - apenas aqueles que você quer modificar.</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              placeholder="Ex: Gmail Principal, LinkedIn Profissional"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="edit-password">Senha</Label>
            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite ou atualize a senha"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Account Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="edit-account-type">Tipo de Conta</Label>
            <Select 
              value={selectedAccountType || ''} 
              onValueChange={setSelectedAccountType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de conta" />
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

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="edit-category">Categoria</Label>
            <Select 
              value={selectedCategory || ''} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
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

          {/* Subcategory Selection */}
          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-subcategory">Subcategoria</Label>
              <Select 
                value={selectedSubcategory || 'none'} 
                onValueChange={(value) => setSelectedSubcategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma subcategoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {translateSubcategory(subcategory.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              placeholder="Adicione uma descrição opcional..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                  Atualizando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Atualizar Senha
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
