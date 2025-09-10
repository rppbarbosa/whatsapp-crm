# Teste da Funcionalidade "Criar Lead"

## Como testar:

1. **Acesse a página do WhatsApp** (`localhost:3000/whatsapp`)
2. **Clique no menu de três pontos** (⋮) de qualquer contato na lista de conversas
3. **Verifique se aparece a opção "Criar Lead"** com ícone de usuário (👤+)
4. **Clique em "Criar Lead"**
5. **Verifique se o modal abre** com nome e telefone pré-preenchidos
6. **Preencha os dados obrigatórios** e clique em "Salvar"
7. **Verifique se aparece o toast de sucesso**
8. **Vá para a página de Leads** e verifique se o lead foi criado

## Posição da opção no dropdown:
- Após "Fixar conversa"
- Antes de "Arquivar conversa"

## Debug:
- Abra o console do navegador (F12)
- Clique em "Criar Lead" e verifique se aparece: "Criando lead para contato: [dados do contato]"

## Possíveis problemas:
1. Se não aparecer a opção: verificar se a prop `onCreateLead` está sendo passada
2. Se não abrir o modal: verificar se `handleCreateLead` está sendo chamada
3. Se não salvar: verificar se o contexto de leads está funcionando
