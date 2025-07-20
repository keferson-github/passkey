import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testStorageConnection, testImageUpload } from '@/utils/testStorage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const StorageTest: React.FC = () => {
  const { user } = useAuth();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingUpload, setIsTestingUpload] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await testStorageConnection();
      setTestResults(result);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Conexão com storage testada com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha no teste de conexão com storage",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado no teste",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user?.id) return;
    
    const file = e.target.files[0];
    setIsTestingUpload(true);
    
    try {
      const result = await testImageUpload(file, user.id);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Upload de teste realizado com sucesso!",
        });
        console.log('Resultado do upload:', result);
      } else {
        toast({
          title: "Erro",
          description: "Falha no teste de upload",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no teste de upload:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado no teste de upload",
        variant: "destructive",
      });
    } finally {
      setIsTestingUpload(false);
      e.target.value = ''; // Limpar input
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Teste de Storage do Supabase</CardTitle>
        <CardDescription>
          Use este componente para testar a conexão e upload de imagens no Supabase Storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            variant="outline"
          >
            {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleTestUpload}
              disabled={isTestingUpload}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            <Button 
              disabled={isTestingUpload || !user?.id}
              variant="outline"
            >
              {isTestingUpload ? 'Testando Upload...' : 'Testar Upload'}
            </Button>
          </div>
        </div>
        
        {testResults && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Resultados do Teste:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Instruções:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Primeiro, clique em "Testar Conexão" para verificar se o bucket existe</li>
            <li>Em seguida, clique em "Testar Upload" e selecione uma imagem</li>
            <li>Verifique o console do navegador para logs detalhados</li>
            <li>Os resultados aparecerão abaixo dos botões</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};