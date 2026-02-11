# Vindicatus - Vercel Deployment Guide

Este projeto está configurado para rodar no **Vercel**. Siga os passos abaixo para implantar.

## Configuração do Banco de Dados
**Importante:** Este projeto usa SQLite (`better-sqlite3`). No Vercel (serveless), o sistema de arquivos é somente leitura e efêmero. 
- Para persistência real em produção, recomenda-se migrar para um banco de dados externo (como Supabase Postgres ou PlanetScale).
- Atualmente, o SQLite funcionará, mas os dados serão resetados a cada novo deploy ou reinicialização da função.

## Passos para Deploy

1. **Importar no Vercel:**
   - Conecte seu repositório GitHub ao Vercel.
   - O Vercel detectará automaticamente o arquivo `vercel.json`.

2. **Variáveis de Ambiente:**
   Configure as seguintes variáveis no painel do Vercel (**Settings > Environment Variables**):
   - `SESSION_SECRET`: Uma string aleatória para segurança das sessões.
   - `CONTACT_WEBHOOK_URL`: A URL do Webhook do Discord para receber contatos.
   - `FIREBASE_PROJECT_ID`: O ID do seu projeto Firebase (ex: `vindicatus-ce514`).
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON`: (Opcional) O JSON da sua conta de serviço Firebase se você não estiver usando a autenticação padrão do ambiente.

3. **Deploy:**
   - Clique em **Deploy**. O Vercel cuidará do build e da exposição das rotas API e arquivos estáticos.

## Como rodar localmente
1. Instale as dependências: `npm install`
2. Inicie o servidor: `node server/index.js`
3. Acesse `http://localhost:5000`
