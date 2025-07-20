import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { configureAvatarStorage, testAvatarUpload } from '@/utils/configureSupabaseStorage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const QuickStorageSetup: React.FC = () => {
  const { user } = useAuth();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [configResult, setConfigResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const handleConfigure = async () => {
    setIsConfiguring(true);
    setConfigResult(null);
    
    try {
      const result = await configureAvatarStorage();
      setConfigResult(result);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Bucket configurado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha na configuração do bucket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro na configuração:', error);
      setConfigResult({ success: false, error });
      toast({
        title: "Erro",
        description: "Erro inesperado na configuração",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleTest = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testAvatarUpload(user.id);
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Teste de upload realizado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha no teste de upload",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      setTestResult({ success: false, error });
      toast({
        title: "Erro",
        description: "Erro inesperado no teste",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Configuração Rápida do Storage
        </CardTitle>
        <CardDescription>
          Configure o bucket de armazenamento para avatares (use apenas uma vez)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button 
            onClick={handleConfigure}
            disabled={isConfiguring}
            className="flex items-center gap-2"
            size="sm"
          >
            {isConfiguring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Configurando...
              </>
            ) : (
              'Configurar Bucket'
            )}
          </Button>
          
          <Button 
            onClick={handleTest}
            disabled={isTesting || !configResult?.success}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testando...
              </>
            ) : (
              'Testar Upload'
            )}
          </Button>
        </div>
        
        {configResult && (
          <div className="flex items-center gap-2 text-sm">
            {configResult.success ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700">Bucket configurado com sucesso</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700">Falha na configuração</span>
              </>
            )}
          </div>
        )}
        
        {testResult && (
          <div className="flex items-center gap-2 text-sm">
            {testResult.success ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700">Teste de upload bem-sucedido</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700">Falha no teste de upload</span>
              </>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
          <p><strong>Instruções:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>Execute o script SQL no console do Supabase (arquivo configure_storage.sql)</li>
            <li>Clique em "Configurar Bucket" para criar o bucket</li>
            <li>Clique em "Testar Upload" para verificar se funciona</li>
            <li>Remova este componente após a configuração por segurança</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};