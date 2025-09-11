# 📚 Documentação das APIs - Sistema de Usuários e Projetos

## 🎯 Visão Geral

Este documento descreve as APIs implementadas para o sistema de gerenciamento de usuários, projetos e auditoria do WhatsApp CRM.

## 🔐 Autenticação

Todas as rotas (exceto `/api/auth`) requerem autenticação via token JWT no header:
```
Authorization: Bearer <token>
```

## 📋 Endpoints Disponíveis

### **1. Usuários**

#### **GET /api/users/profile**
Buscar perfil do usuário atual.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "Nome do Usuário",
    "email": "usuario@email.com",
    "phone": "+5511999999999",
    "avatar_url": "https://...",
    "role": "owner",
    "project_id": "uuid",
    "is_active": true,
    "last_login": "2024-12-19T14:52:00Z",
    "created_at": "2024-12-19T10:00:00Z",
    "updated_at": "2024-12-19T14:52:00Z",
    "projects": {
      "id": "uuid",
      "name": "Meu Projeto",
      "description": "Descrição do projeto",
      "settings": {
        "allowInvites": true,
        "maxMembers": 10
      },
      "color": "#10B981"
    }
  }
}
```

#### **PUT /api/users/profile**
Atualizar perfil do usuário.

**Body:**
```json
{
  "full_name": "Novo Nome",
  "phone": "+5511888888888",
  "avatar_url": "https://novo-avatar.com"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": { /* perfil atualizado */ },
  "message": "Perfil atualizado com sucesso"
}
```

#### **GET /api/users/stats**
Buscar estatísticas do usuário.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 5,
    "pendingInvites": 2,
    "projectName": "Meu Projeto"
  }
}
```

### **2. Projetos**

#### **POST /api/users/projects**
Criar novo projeto.

**Body:**
```json
{
  "name": "Nome do Projeto",
  "description": "Descrição do projeto",
  "settings": {
    "allowInvites": true,
    "maxMembers": 10
  },
  "color": "#10B981"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nome do Projeto",
    "description": "Descrição do projeto",
    "owner_id": "uuid",
    "settings": { /* configurações */ },
    "color": "#10B981",
    "created_at": "2024-12-19T14:52:00Z"
  },
  "message": "Projeto criado com sucesso"
}
```

#### **GET /api/users/projects**
Buscar projetos do usuário.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Meu Projeto",
      "description": "Descrição",
      "owner_id": "uuid",
      "settings": { /* configurações */ },
      "color": "#10B981",
      "created_at": "2024-12-19T14:52:00Z",
      "owner": {
        "id": "uuid",
        "full_name": "Nome do Owner",
        "email": "owner@email.com"
      }
    }
  ]
}
```

#### **GET /api/users/projects/:id**
Buscar projeto por ID.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nome do Projeto",
    "description": "Descrição",
    "owner_id": "uuid",
    "settings": { /* configurações */ },
    "color": "#10B981",
    "created_at": "2024-12-19T14:52:00Z",
    "owner": {
      "id": "uuid",
      "full_name": "Nome do Owner",
      "email": "owner@email.com",
      "avatar_url": "https://..."
    }
  }
}
```

#### **PUT /api/users/projects/:id**
Atualizar projeto (apenas owner).

**Body:**
```json
{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "settings": {
    "allowInvites": false,
    "maxMembers": 20
  },
  "color": "#FF6B6B"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": { /* projeto atualizado */ },
  "message": "Projeto atualizado com sucesso"
}
```

#### **GET /api/users/projects/:id/members**
Buscar membros do projeto.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "Membro 1",
      "email": "membro1@email.com",
      "role": "member",
      "is_active": true,
      "last_login": "2024-12-19T14:52:00Z"
    }
  ]
}
```

### **3. Convites**

#### **POST /api/users/projects/:id/invites**
Enviar convite para projeto.

**Body:**
```json
{
  "toUserId": "uuid-do-usuario",
  "message": "Mensagem opcional"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "from_user_id": "uuid",
    "to_user_id": "uuid",
    "status": "pending",
    "message": "Mensagem opcional",
    "created_at": "2024-12-19T14:52:00Z",
    "from_user": {
      "id": "uuid",
      "full_name": "Nome do Remetente",
      "email": "remetente@email.com"
    },
    "to_user": {
      "id": "uuid",
      "full_name": "Nome do Destinatário",
      "email": "destinatario@email.com"
    },
    "project": {
      "id": "uuid",
      "name": "Nome do Projeto"
    }
  },
  "message": "Convite enviado com sucesso"
}
```

#### **GET /api/users/invites/received**
Buscar convites recebidos.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "from_user_id": "uuid",
      "to_user_id": "uuid",
      "status": "pending",
      "message": "Mensagem",
      "created_at": "2024-12-19T14:52:00Z",
      "from_user": {
        "id": "uuid",
        "full_name": "Nome do Remetente",
        "email": "remetente@email.com",
        "avatar_url": "https://..."
      },
      "project": {
        "id": "uuid",
        "name": "Nome do Projeto",
        "description": "Descrição",
        "color": "#10B981"
      }
    }
  ]
}
```

#### **GET /api/users/invites/sent**
Buscar convites enviados.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "from_user_id": "uuid",
      "to_user_id": "uuid",
      "status": "pending",
      "message": "Mensagem",
      "created_at": "2024-12-19T14:52:00Z",
      "to_user": {
        "id": "uuid",
        "full_name": "Nome do Destinatário",
        "email": "destinatario@email.com",
        "avatar_url": "https://..."
      },
      "project": {
        "id": "uuid",
        "name": "Nome do Projeto",
        "description": "Descrição"
      }
    }
  ]
}
```

#### **POST /api/users/invites/:id/approve**
Aprovar convite.

**Resposta:**
```json
{
  "success": true,
  "data": true,
  "message": "Convite aprovado com sucesso"
}
```

#### **POST /api/users/invites/:id/reject**
Rejeitar convite.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    "responded_at": "2024-12-19T14:52:00Z"
  },
  "message": "Convite rejeitado com sucesso"
}
```

### **4. Auditoria**

#### **GET /api/users/audit-logs**
Buscar logs de auditoria.

**Query Parameters:**
- `action` (opcional): Filtrar por ação
- `entity_type` (opcional): Filtrar por tipo de entidade
- `start_date` (opcional): Data inicial (ISO 8601)
- `end_date` (opcional): Data final (ISO 8601)
- `limit` (opcional): Limite de resultados (padrão: 50)

**Exemplo:**
```
GET /api/users/audit-logs?action=created&entity_type=project&limit=20
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "created",
      "entity_type": "project",
      "entity_id": "uuid",
      "entity_name": "Nome do Projeto",
      "details": {
        "name": "Nome do Projeto"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "timestamp": "2024-12-19T14:52:00Z",
      "user_name": "Nome do Usuário",
      "user_email": "usuario@email.com"
    }
  ]
}
```

## 🔒 Segurança

### **Row Level Security (RLS)**
- Usuários só podem ver seus próprios dados
- Membros do projeto podem ver outros membros
- Apenas owners podem atualizar projetos
- Logs de auditoria são filtrados por usuário/projeto

### **Validações**
- Campos obrigatórios são validados
- Tipos de dados são verificados
- Permissões são verificadas antes de operações

### **Rate Limiting**
- 100 requests por IP a cada 15 minutos (produção)
- Configurações mais permissivas em desenvolvimento

## 📊 Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autenticado
- **403**: Sem permissão
- **404**: Não encontrado
- **500**: Erro interno do servidor

## 🚀 Próximos Passos

1. **Integração Frontend**: Conectar frontend com as APIs
2. **Testes**: Implementar testes automatizados
3. **Documentação**: Adicionar exemplos de uso
4. **Monitoramento**: Implementar logs e métricas

---

**Versão da API:** 1.0.0  
**Última atualização:** 2024-12-19  
**Compatibilidade:** Node.js 16+, Supabase PostgreSQL 15+
