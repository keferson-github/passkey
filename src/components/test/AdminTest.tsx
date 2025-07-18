import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminTest = () => {
  const { user, profile } = useAuth();

  const isAdmin = profile?.is_admin || user?.email === 'contato@techsolutionspro.com.br';

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Teste de Permissões Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Nome:</strong> {profile?.display_name}</p>
          <p><strong>Is Admin (DB):</strong> {profile?.is_admin ? 'Sim' : 'Não'}</p>
          <p><strong>Is Active:</strong> {profile?.is_active ? 'Sim' : 'Não'}</p>
          <p><strong>Is Admin (Email):</strong> {user?.email === 'contato@techsolutionspro.com.br' ? 'Sim' : 'Não'}</p>
          <p><strong>Final Admin Status:</strong> {isAdmin ? 'Sim' : 'Não'}</p>
          {isAdmin && (
            <Badge variant="secondary">
              Acesso de Administrador
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
