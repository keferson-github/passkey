import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Copy, RefreshCw, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PasswordGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ open, onOpenChange }) => {
  const [length, setLength] = useState([12]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generatePassword = useCallback(() => {
    let charset = '';
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Remove similar characters if option is selected
    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }
    
    if (charset === '') {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tipo de caractere.",
        variant: "destructive"
      });
      return;
    }
    
    let password = '';
    for (let i = 0; i < length[0]; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setGeneratedPassword(password);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  const copyToClipboard = async () => {
    if (!generatedPassword) {
      toast({
        title: "Erro",
        description: "Gere uma senha primeiro.",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast({
        title: "Sucesso",
        description: "Senha copiada para a área de transferência.",
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a senha.",
        variant: "destructive"
      });
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: 'Nenhuma' };
    
    let score = 0;
    
    // Length score
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety score
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { score, label: 'Fraca', color: 'text-destructive' };
    if (score <= 4) return { score, label: 'Média', color: 'text-warning' };
    if (score <= 6) return { score, label: 'Forte', color: 'text-success' };
    return { score, label: 'Muito Forte', color: 'text-success' };
  };

  const strength = getPasswordStrength(generatedPassword);

  // Generate initial password when dialog opens
  React.useEffect(() => {
    if (open && !generatedPassword) {
      generatePassword();
    }
  }, [open, generatedPassword, generatePassword]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Gerador de Senhas
          </DialogTitle>
          <DialogDescription>
            Crie senhas seguras e personalizadas para suas contas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Generated Password */}
          <div className="space-y-2">
            <Label>Senha gerada</Label>
            <div className="flex gap-2">
              <Input
                value={generatedPassword}
                readOnly
                className="font-mono text-sm"
                placeholder="Clique em gerar para criar uma senha"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!generatedPassword}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            {generatedPassword && (
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${strength.color}`}>
                  Força: {strength.label}
                </span>
                <span className="text-muted-foreground">
                  {generatedPassword.length} caracteres
                </span>
              </div>
            )}
          </div>

          {/* Length Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Comprimento da senha</Label>
              <span className="text-sm text-muted-foreground">{length[0]} caracteres</span>
            </div>
            <Slider
              value={length}
              onValueChange={setLength}
              max={100}
              min={4}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4</span>
              <span>100</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="space-y-3">
            <Label>Tipos de caracteres</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uppercase"
                  checked={includeUppercase}
                  onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                />
                <Label htmlFor="uppercase" className="text-sm">
                  Letras maiúsculas (A-Z)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lowercase"
                  checked={includeLowercase}
                  onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                />
                <Label htmlFor="lowercase" className="text-sm">
                  Letras minúsculas (a-z)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="numbers"
                  checked={includeNumbers}
                  onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
                />
                <Label htmlFor="numbers" className="text-sm">
                  Números (0-9)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="symbols"
                  checked={includeSymbols}
                  onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                />
                <Label htmlFor="symbols" className="text-sm">
                  Símbolos (!@#$%^&*)
                </Label>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <Label>Opções avançadas</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exclude-similar"
                checked={excludeSimilar}
                onCheckedChange={(checked) => setExcludeSimilar(checked as boolean)}
              />
              <Label htmlFor="exclude-similar" className="text-sm">
                Excluir caracteres similares (i, l, 1, L, o, 0, O)
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={generatePassword} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Gerar nova senha
            </Button>
            <Button variant="outline" onClick={copyToClipboard} disabled={!generatedPassword}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};