import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    userId: string;
    className?: string;
    disabled?: boolean;
}

// Nome do bucket para armazenar avatares
const AVATAR_BUCKET = 'avatars';

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    userId,
    className = '',
    disabled = false
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [bucketReady, setBucketReady] = useState(false);

    // Verificar se o bucket existe ao carregar o componente
    useEffect(() => {
        const checkBucket = async () => {
            try {
                console.log('Verificando se o bucket existe...');
                const { data: buckets, error } = await supabase.storage.listBuckets();
                
                if (error) {
                    console.warn('Aviso ao listar buckets:', error);
                    // Assumir que o bucket existe e continuar
                    setBucketReady(true);
                    return;
                }
                
                const exists = buckets?.some(bucket => bucket.name === AVATAR_BUCKET);
                
                if (exists) {
                    console.log('Bucket "avatars" encontrado e pronto para uso');
                } else {
                    console.warn('Bucket "avatars" não encontrado. Execute o script SQL para configurar o storage.');
                    // Mensagem removida: não exibir toast de configuração necessária
                }
                
                // Sempre definir como pronto, pois o bucket deve ter sido configurado via SQL
                setBucketReady(true);
            } catch (error) {
                console.warn('Erro ao verificar buckets:', error);
                // Continuar mesmo com erro, assumindo que o bucket existe
                setBucketReady(true);
            }
        };
        
        checkBucket();
    }, []);

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.substring(0, 2).toUpperCase();
    };

    const uploadImage = async (file: File) => {
        if (!file) {
            console.error('Nenhum arquivo fornecido');
            return;
        }

        console.log('Arquivo selecionado:', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "Erro",
                description: "A imagem deve ter no máximo 2MB",
                variant: "destructive",
            });
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Erro",
                description: "O arquivo deve ser uma imagem",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);

        try {
            console.log('Iniciando upload de imagem para o usuário:', userId);

            // Create a unique filename
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
            
            console.log('Nome do arquivo:', fileName);

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(AVATAR_BUCKET)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Erro no upload:', error);
                
                // Tentar diagnosticar o erro
                if (error.message?.includes('Bucket not found')) {
                    toast({
                        title: "Erro",
                        description: "Bucket de armazenamento não encontrado. Recarregue a página e tente novamente.",
                        variant: "destructive",
                    });
                } else if (error.message?.includes('permission')) {
                    toast({
                        title: "Erro",
                        description: "Sem permissão para fazer upload. Verifique se você está logado.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Erro",
                        description: `Erro no upload: ${error.message}`,
                        variant: "destructive",
                    });
                }
                throw error;
            }

            console.log('Upload realizado com sucesso:', data);

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from(AVATAR_BUCKET)
                .getPublicUrl(fileName);

            console.log('URL pública gerada:', publicUrlData.publicUrl);

            // Atualiza o campo avatar_url no banco de dados
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrlData.publicUrl })
                .eq('user_id', userId);
            if (updateError) {
                console.error('Erro ao atualizar avatar_url no perfil:', updateError);
                toast({
                    title: "Erro",
                    description: "Imagem enviada, mas não foi possível atualizar o perfil.",
                    variant: "destructive",
                });
            } else {
                // Update with the new URL
                onChange(publicUrlData.publicUrl);
                // Após upload, força atualização do perfil na tela
                toast({
                    title: "Sucesso",
                    description: "Imagem carregada e perfil atualizado com sucesso",
                });
            }
        } catch (error) {
            console.error('Erro ao fazer upload da imagem:', error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar a imagem. Verifique o console para mais detalhes.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('Arquivo selecionado no input');
        if (e.target.files && e.target.files[0]) {
            uploadImage(e.target.files[0]);
        } else {
            console.log('Nenhum arquivo selecionado');
        }
        
        // Limpar o input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
    };

    const handleRemove = async () => {
        if (!value) return;

        try {
            console.log('Removendo imagem:', value);
            
            // Extract the path from the URL
            const url = new URL(value);
            const pathMatch = url.pathname.match(new RegExp(`\\/storage\\/v1\\/object\\/public\\/${AVATAR_BUCKET}\\/(.+)$`));

            if (pathMatch && pathMatch[1]) {
                const filePath = decodeURIComponent(pathMatch[1]);
                console.log('Caminho do arquivo a ser removido:', filePath);

                // Delete the file from storage
                const { error } = await supabase.storage
                    .from(AVATAR_BUCKET)
                    .remove([filePath]);

                if (error) {
                    console.error('Erro ao remover arquivo:', error);
                    throw error;
                }
                
                console.log('Arquivo removido com sucesso');
            }

            // Update the state regardless of whether we could delete the file
            onChange('');

            toast({
                title: "Sucesso",
                description: "Imagem removida com sucesso",
            });
        } catch (error) {
            console.error('Erro ao remover imagem:', error);
            // Still update the state even if deletion fails
            onChange('');

            toast({
                title: "Aviso",
                description: "A imagem foi removida do perfil, mas pode continuar no servidor",
                variant: "default",
            });
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                    <AvatarImage src={value} alt="Avatar do usuário" />
                    <AvatarFallback className="text-lg">
                        {userId ? getInitials(userId) : 'U'}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-2">
                    {value && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemove}
                            disabled={disabled || isUploading}
                            className="flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Remover
                        </Button>
                    )}

                    <div className="relative">
                        <input
                            type="file"
                            id={`image-upload-${userId}`}
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={disabled || isUploading || !bucketReady}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={disabled || isUploading || !bucketReady}
                            className="flex items-center gap-2 w-full"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Carregando...
                                </>
                            ) : !bucketReady ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Preparando...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Carregar imagem
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};