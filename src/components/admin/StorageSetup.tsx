import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setupAvatarStorage, testAdminUpload } from '@/utils/setupStorage';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export const StorageSetup: React.FC = () => {
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [setupResult, setSetupResult] = useState<any>(null);
    const [testResult, setTestResult] = useState<any>(null);

    const handleSetup = async () => {
        setIsSettingUp(true);
        setSetupResult(null);

        try {
            const result = await setupAvatarStorage();
            setSetupResult(result);

            if (result.success) {
                toast({
                    title: "Sucesso",
                    description: "Storage configurado com sucesso!",
                });
            } else {
                toast({
                    title: "Erro",
                    description: "Falha na configuração do storage",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Erro na configuração:', error);
            setSetupResult({ success: false, error });
            toast({
                title: "Erro",
                description: "Erro inesperado na configuração",
                variant: "destructive",
            });
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const result = await testAdminUpload();
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
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Configuração do Storage - Avatares</CardTitle>
                <CardDescription>
                    Configure o bucket de armazenamento para avatares no Supabase usando credenciais de administrador
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4">
                    <Button
                        onClick={handleSetup}
                        disabled={isSettingUp}
                        className="flex items-center gap-2"
                    >
                        {isSettingUp ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Configurando...
                            </>
                        ) : (
                            'Configurar Storage'
                        )}
                    </Button>

                    <Button
                        onClick={handleTest}
                        disabled={isTesting || !setupResult?.success}
                        variant="outline"
                        className="flex items-center gap-2"
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

                {setupResult && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            {setupResult.success ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <h3 className="font-semibold">
                                Resultado da Configuração: {setupResult.success ? 'Sucesso' : 'Falha'}
                            </h3>
                        </div>

                        <div className="p-4 bg-gray-100 rounded-lg">
                            <pre className="text-sm overflow-auto max-h-40">
                                {JSON.stringify(setupResult, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {testResult && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            {testResult.success ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <h3 className="font-semibold">
                                Resultado do Teste: {testResult.success ? 'Sucesso' : 'Falha'}
                            </h3>
                        </div>

                        <div className="p-4 bg-gray-100 rounded-lg">
                            <pre className="text-sm overflow-auto max-h-40">
                                {JSON.stringify(testResult, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Instruções:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Primeiro, clique em "Configurar Storage" para criar o bucket e configurar as políticas</li>
                        <li>Aguarde a confirmação de sucesso</li>
                        <li>Em seguida, clique em "Testar Upload" para verificar se tudo está funcionando</li>
                        <li>Verifique o console do navegador para logs detalhados</li>
                        <li>Após a configuração bem-sucedida, o upload de avatares deve funcionar normalmente</li>
                    </ol>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800">
                            <strong>Aviso:</strong> Este componente usa credenciais de administrador para configurar o storage.
                            Use apenas uma vez para configurar o sistema e depois remova este componente por segurança.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};