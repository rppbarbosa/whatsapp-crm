# 🧪 ESTRUTURA DE TESTES - FRONTEND

## 📁 Organização dos Testes

Esta pasta contém todos os testes do frontend React, organizados por categoria para facilitar a manutenção e identificação.

### 🗂️ Estrutura de Pastas

```
tests/
├── 📁 components/         # Testes de componentes React
├── 📁 pages/             # Testes de páginas/rotas
├── 📁 services/          # Testes de serviços e APIs
└── 📁 utils/             # Testes de utilitários e configurações
```

## 🔧 Categorias de Testes

### 🧩 **Components** (`components/`)
Testes de componentes React:
- ✅ Componentes UI reutilizáveis
- ✅ Componentes específicos do WhatsApp
- ✅ Testes de renderização
- ✅ Testes de interações

**Arquivos principais:**
- `App.test.tsx` - Teste principal do App
- `Button.test.tsx` - Teste do componente Button
- `Input.test.tsx` - Teste do componente Input
- `MessageBubble.test.tsx` - Teste do componente de mensagem

### 📄 **Pages** (`pages/`)
Testes de páginas e rotas:
- ✅ Páginas principais
- ✅ Navegação
- ✅ Estados de carregamento
- ✅ Integração com APIs

**Arquivos principais:**
- `Dashboard.test.tsx` - Teste da página Dashboard
- `WhatsAppBusiness.test.tsx` - Teste da página WhatsApp
- `Leads.test.tsx` - Teste da página de Leads

### 🔌 **Services** (`services/`)
Testes de serviços e APIs:
- ✅ Chamadas de API
- ✅ Tratamento de dados
- ✅ Gerenciamento de estado
- ✅ Cache e otimizações

**Arquivos principais:**
- `api.test.ts` - Teste das configurações de API
- `whatsappApi.test.ts` - Teste da API do WhatsApp
- `leadsApi.test.ts` - Teste da API de Leads

### 🛠️ **Utils** (`utils/`)
Testes de utilitários e configurações:
- ✅ Funções utilitárias
- ✅ Configurações de teste
- ✅ Helpers e formatação
- ✅ Validações

**Arquivos principais:**
- `setupTests.ts` - Configuração dos testes
- `reportWebVitals.ts` - Relatórios de performance
- `whatsappUtils.test.ts` - Teste das funções utilitárias

## 🚀 Como Usar

### 1. **Executar Todos os Testes**
```bash
npm test
```

### 2. **Executar Testes Específicos**
```bash
# Testar componentes
npm test -- --testPathPattern=components

# Testar páginas
npm test -- --testPathPattern=pages

# Testar serviços
npm test -- --testPathPattern=services
```

### 3. **Executar Teste Específico**
```bash
# Testar componente específico
npm test -- App.test.tsx

# Testar com watch mode
npm test -- --watch
```

### 4. **Executar com Cobertura**
```bash
npm test -- --coverage
```

## 📋 Convenções de Nomenclatura

### 🧩 **Testes de Componentes**
- `ComponentName.test.tsx` - Teste de componente
- `ComponentName.spec.tsx` - Especificação de componente
- `ComponentName.stories.tsx` - Storybook stories

### 📄 **Testes de Páginas**
- `PageName.test.tsx` - Teste de página
- `PageName.integration.test.tsx` - Teste de integração

### 🔌 **Testes de Serviços**
- `serviceName.test.ts` - Teste de serviço
- `serviceName.api.test.ts` - Teste de API

### 🛠️ **Testes de Utilitários**
- `utilName.test.ts` - Teste de utilitário
- `utilName.helper.test.ts` - Teste de helper

## 🎯 Benefícios da Organização

### ✅ **Facilita Manutenção**
- Testes organizados por funcionalidade
- Fácil localização de testes específicos
- Separação clara entre tipos de teste

### ✅ **Melhora Identificação**
- Nomenclatura consistente
- Categorização lógica
- Documentação clara

### ✅ **Aumenta Produtividade**
- Execução rápida de testes específicos
- Debugging mais eficiente
- Desenvolvimento mais ágil

### ✅ **Facilita Colaboração**
- Estrutura clara para novos desenvolvedores
- Documentação centralizada
- Padrões consistentes

## 🔧 Configuração de Testes

### 📦 **Dependências**
```json
{
  "devDependencies": {
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^5.16.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^27.0.0"
  }
}
```

### ⚙️ **Configuração Jest**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### 🧪 **Setup de Testes**
```typescript
// tests/utils/setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });
```

## 📊 Tipos de Teste

### 🧩 **Testes Unitários**
- Testes de componentes isolados
- Testes de funções utilitárias
- Testes de lógica de negócio

### 🔗 **Testes de Integração**
- Testes de fluxos completos
- Testes de integração com APIs
- Testes de navegação

### 🎨 **Testes de UI**
- Testes de renderização
- Testes de interações
- Testes de acessibilidade

### ⚡ **Testes de Performance**
- Testes de Web Vitals
- Testes de carregamento
- Testes de otimização

## 🔄 Próximos Passos

1. **Implementar testes automatizados** para todos os componentes
2. **Adicionar testes de integração** end-to-end
3. **Configurar CI/CD** para execução automática
4. **Implementar testes de acessibilidade**
5. **Adicionar testes de performance**

## 📝 Exemplos de Teste

### 🧩 **Teste de Componente**
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 🔌 **Teste de Serviço**
```typescript
import { whatsappApi } from '../services/api';

describe('WhatsApp API', () => {
  it('should fetch instances', async () => {
    const instances = await whatsappApi.getInstances();
    expect(instances).toBeDefined();
    expect(Array.isArray(instances)).toBe(true);
  });
});
```

---

**📝 Nota:** Esta estrutura foi criada para organizar os testes do frontend e facilitar a manutenção do projeto. Todos os testes seguem as melhores práticas do React Testing Library. 