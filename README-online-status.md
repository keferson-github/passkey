# Implementação do Status Online/Offline dos Usuários

## Visão Geral

Esta implementação adiciona a funcionalidade de rastreamento do status online/offline dos usuários em tempo real. Quando um usuário faz login, seu status é marcado como "Online", e quando faz logout ou fecha a aplicação, é marcado como "Offline".

## Arquivos Modificados

### 1. **add-online-status.sql**
Script SQL que deve ser executado no painel do Supabase para:
- Adicionar campos `is_online` e `last_seen` na tabela `profiles`
- Criar função `update_user_online_status()` para atualizar status
- Criar função `cleanup_offline_users()` para limpar usuários inativos
- Criar índices para melhor performance

### 2. **src/contexts/AuthContext.ts**
- Adicionados campos `is_online` e `last_seen` na interface `Profile`

### 3. **src/components/auth/AuthContext.tsx**
- Função `updateOnlineStatus()` para atualizar status no banco
- Listener de mudanças de autenticação atualizado para marcar online/offline
- Heartbeat a cada 2 minutos para manter status online
- Cleanup no `beforeunload` para marcar offline ao fechar página
- Logout atualizado para marcar offline antes de deslogar

### 4. **src/components/admin/UserManagement.tsx**
- Interface `UserProfile` atualizada com campos `is_online` e `last_seen`
- Função `isUserOnline()` agora usa o campo real `is_online` do banco
- Função `getLastSeenText()` para mostrar tempo desde última atividade
- Badges "Online" e "Offline" baseados no status real
- Informações de "Visto pela última vez" em tempo real

## Como Implementar

### Passo 1: Executar Script SQL
1. Acesse o painel do Supabase (https://app.supabase.com)
2. Vá para o projeto: https://oyjpnwjwawmgecobeebl.supabase.co
3. Acesse "SQL Editor"
4. Cole o conteúdo do arquivo `add-online-status.sql`
5. Execute o script

### Passo 2: Verificar Implementação
Execute o teste para verificar se tudo foi configurado corretamente:
```bash
node test-online-status.js
```

## Funcionalidades Implementadas

### 1. **Status Online Automático**
- ✅ Login → Status "Online"
- ✅ Logout → Status "Offline"
- ✅ Fechar página/aba → Status "Offline"
- ✅ Heartbeat a cada 2 minutos → Mantém "Online"

### 2. **Limpeza Automática**
- ✅ Usuários inativos há mais de 5 minutos → Marcados como "Offline"
- ✅ Função `cleanup_offline_users()` pode ser chamada periodicamente

### 3. **Interface Atualizada**
- ✅ Badge "Online" (verde) para usuários conectados
- ✅ Badge "Offline" (cinza) para usuários desconectados
- ✅ Indicador visual (ponto verde) no avatar de usuários online
- ✅ Texto "Online agora" ou "Visto X tempo atrás"

### 4. **Tempo Real**
- ✅ Status atualizado instantaneamente no login/logout
- ✅ Heartbeat mantém status atualizado
- ✅ Cleanup automático de usuários inativos

## Estrutura do Banco de Dados

### Novos Campos na Tabela `profiles`:
```sql
is_online BOOLEAN DEFAULT FALSE  -- Status online atual
last_seen TIMESTAMPTZ DEFAULT NOW()  -- Última atividade
```

### Funções RPC Criadas:
```sql
update_user_online_status(user_uuid, online_status)  -- Atualizar status
cleanup_offline_users()  -- Limpar usuários inativos
```

## Comportamento Esperado

### Cenário 1: Usuário faz login
1. AuthContext detecta login
2. Chama `updateOnlineStatus(userId, true)`
3. Banco atualiza `is_online = true` e `last_seen = now()`
4. UserManagement mostra badge "Online" e ponto verde

### Cenário 2: Usuário faz logout
1. AuthContext detecta logout
2. Chama `updateOnlineStatus(userId, false)`
3. Banco atualiza `is_online = false`
4. UserManagement mostra badge "Offline"

### Cenário 3: Usuário fecha página
1. Event listener `beforeunload` é acionado
2. Chama `updateOnlineStatus(userId, false)`
3. Status marcado como offline

### Cenário 4: Heartbeat
1. A cada 2 minutos, se usuário está logado
2. Chama `updateOnlineStatus(userId, true)`
3. Atualiza `last_seen` no banco
4. Mantém status online ativo

## Teste da Funcionalidade

Após executar o script SQL, você pode testar:

1. **Fazer login** → Verificar se aparece "Online" no gerenciamento de usuários
2. **Fazer logout** → Verificar se muda para "Offline"
3. **Fechar aba** → Verificar se fica "Offline"
4. **Aguardar 5+ minutos inativo** → Verificar se cleanup marca como "Offline"

## Monitoramento

Para monitorar o status dos usuários em tempo real:
```sql
SELECT 
  display_name,
  is_online,
  last_seen,
  EXTRACT(EPOCH FROM (NOW() - last_seen))/60 as minutes_since_last_seen
FROM profiles 
ORDER BY is_online DESC, last_seen DESC;
```

Esta implementação garante que o status online/offline seja preciso e atualizado em tempo real, proporcionando uma experiência mais rica para os administradores monitorarem a atividade dos usuários.