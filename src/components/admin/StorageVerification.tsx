import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyAvatarBucketSetup, generateStorageReport } from '@/utils/verifyStorageSetup';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';

interface VerificationResult {
    bucketExists: boolean;
    bucketPublic: boolean;
    canListBuckets: boolean;
    canUpload: boolean;
    canRead: boolean;
    errors: string[];
    warnings: string[];
    info: string[];
}

export const StorageVerification: React.FC = () => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [showDetailedReport, setShowDetailedReport] = useState(false);

    const handleVerification = async () => {
        setIsVerifying(true);
        setVerificationResult(null);

        try {
            console.log('Iniciando verificação do bucket de avatares...');
            const result = await verifyAvatarBucketSetup();
            setVerificationResult(result);

            // Mostrar toast baseado no resultado
            if (result.errors.length === 0 && result.canUpload && result.canRead) {
                toast({
                    title: "✅ Verificação Concluída",
                    description: "Bucket configurado corretamente! Upload de avatares deve funcionar.",
                });
            } else if (result.errors.length > 0) {
                toast({
                    title: "❌ Problemas Encontrados",
                    description: `${result.errors.length} erro(s) encontrado(s). Verifique os detalhes.`,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "⚠️ Verificação Concluída",
                    description: "Alguns avisos encontrados. Verifique os detalhes.",
                    variant: "default",
                });
            }
        } catch (error) {
            console.error('Erro na verificação:', error);
            toast({
                title: "Erro na Verificação",
                description: "Não foi possível completar a verificação. Verifique o console.",
                variant: "destructive",
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const getStatusIcon = (status: boolean, hasErrors: boolean = false) => {
        if (hasErrors) return <XCircle className="w-4 h-4 text-red-500" />;
        if (status) return <CheckCircle className="w-4 h-4 text-green-500" />;
        return <XCircle className="w-4 h-4 text-red-500" />;
    };

    const getOverallStatus = () => {
        if (!verificationResult) return null;

        const { bucketExists, canUpload, canRead, errors } = verificationResult;

        if (errors.length === 0 && bucketExists && canUpload && canRead) {
            return { status: 'success', message: 'Configuração Perfeita', color: 'text-green-600' };
        } else if (bucketExists && (canUpload || canRead)) {
            return { status: 'warning', message: 'Configuração Parcial', color: 'text-yellow-600' };
        } else {
            return { status: 'error', message: 'Configuração Incorreta', color: 'text-red-600' };
        }
    };

    const overallStatus = getOverallStatus();

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-500" />
                    Verificação do Bucket de Avatares
                </CardTitle>
                <CardDescription>
                    Verifique se o bucket de armazenamento está configurado corretamente para upload de avatares
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Botão de Verificação */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleVerification}
                        disabled={isVerifying}
                        className="flex items-center gap-2"
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Executar Verificação
                            </>
                        )}
                    </Button>

                    {verificationResult && (
                        <Button
                            onClick={() => setShowDetailedReport(!showDetailedReport)}
                            variant="outline"
                            size="sm"
                        >
                            {showDetailedReport ? 'Ocultar' : 'Mostrar'} Relatório Detalhado
                        </Button>
                    )}
                </div>

                {/* Status Geral */}
                {verificationResult && overallStatus && (
                    <div className={`p-4 rounded-lg border-2 ${overallStatus.status === 'success' ? 'border-green-200 bg-green-50' :
                        overallStatus.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                            'border-red-200 bg-red-50'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            {overallStatus.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {overallStatus.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                            {overallStatus.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                            <h3 className={`font-semibold ${overallStatus.color}`}>
                                {overallStatus.message}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            {overallStatus.status === 'success' && 'O bucket está configurado corretamente e o upload de avatares deve funcionar perfeitamente.'}
                            {overallStatus.status === 'warning' && 'O bucket existe mas pode ter alguns problemas de configuração.'}
                            {overallStatus.status === 'error' && 'O bucket não está configurado corretamente. Execute o script SQL para corrigir.'}
                        </p>
                    </div>
                )}

                {/* Resultados da Verificação */}
                {verificationResult && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-700">Status dos Componentes:</h4>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-sm">Bucket "avatars" existe</span>
                                {getStatusIcon(verificationResult.bucketExists)}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-sm">Pode listar buckets</span>
                                {getStatusIcon(verificationResult.canListBuckets)}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-sm">Pode fazer upload</span>
                                {getStatusIcon(verificationResult.canUpload)}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-sm">Pode ler publicamente</span>
                                {getStatusIcon(verificationResult.canRead)}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-sm">Bucket é público</span>
                                {getStatusIcon(verificationResult.bucketPublic)}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-700">Resumo:</h4>

                            {verificationResult.errors.length > 0 && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded">
                                    <h5 className="font-medium text-red-700 mb-1">Erros ({verificationResult.errors.length}):</h5>
                                    <ul className="text-sm text-red-600 space-y-1">
                                        {verificationResult.errors.slice(0, 3).map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                        {verificationResult.errors.length > 3 && (
                                            <li className="text-xs">... e mais {verificationResult.errors.length - 3} erro(s)</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {verificationResult.warnings.length > 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <h5 className="font-medium text-yellow-700 mb-1">Avisos ({verificationResult.warnings.length}):</h5>
                                    <ul className="text-sm text-yellow-600 space-y-1">
                                        {verificationResult.warnings.slice(0, 2).map((warning, index) => (
                                            <li key={index}>• {warning}</li>
                                        ))}
                                        {verificationResult.warnings.length > 2 && (
                                            <li className="text-xs">... e mais {verificationResult.warnings.length - 2} aviso(s)</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {verificationResult.info.length > 0 && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                    <h5 className="font-medium text-blue-700 mb-1">Informações:</h5>
                                    <ul className="text-sm text-blue-600 space-y-1">
                                        {verificationResult.info.slice(0, 2).map((info, index) => (
                                            <li key={index}>• {info}</li>
                                        ))}
                                        {verificationResult.info.length > 2 && (
                                            <li className="text-xs">... e mais {verificationResult.info.length - 2} informação(ões)</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Relatório Detalhado */}
                {verificationResult && showDetailedReport && (
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-700 mb-3">Relatório Detalhado:</h4>
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                            <pre>{generateStorageReport(verificationResult)}</pre>
                        </div>
                    </div>
                )}

                {/* Instruções */}
                <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Como usar:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Clique em "Executar Verificação" para testar a configuração do bucket</li>
                        <li>Analise os resultados para identificar problemas</li>
                        <li>Se houver erros, execute o script SQL no console do Supabase</li>
                        <li>Execute a verificação novamente para confirmar as correções</li>
                    </ol>

                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 text-xs">
                            <strong>Nota:</strong> Esta verificação usa a chave pública (anon) para simular o comportamento
                            real do upload de avatares pelos usuários da aplicação.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};