# Passo a Passo para Deploy no Vercel (Vindicatus)

Este guia ensina como migrar seu projeto para o Firebase e fazer o deploy no Vercel.

## 1. Configuração do Firebase (Firestore)

1. Vá para o [Console do Firebase](https://console.firebase.google.com/).
2. Crie um novo projeto ou use um existente.
3. No menu lateral, vá em **Project Settings** (ícone de engrenagem) > **Service Accounts**.
4. Clique em **Generate new private key**. Isso baixará um arquivo `.json`.
5. **Importante:** Você precisará transformar o conteúdo deste JSON em uma string única para colocar nas variáveis de ambiente.

## 2. Variáveis de Ambiente (Vercel)

No painel do seu projeto no Vercel, adicione as seguintes variáveis:

- `FIREBASE_SERVICE_ACCOUNT`: O conteúdo completo do arquivo JSON baixado no passo anterior (copie e cole tudo).
- `SESSION_SECRET`: Uma string aleatória para segurança das sessões.
- `PORT`: 5000 (Opcional, o Vercel gerencia isso).

## 3. Deploy no Vercel

1. Conecte seu repositório GitHub ao Vercel.
2. Certifique-se de que a **Root Directory** está apontando para a pasta `vindicatus` (se o seu projeto estiver dentro dela).
3. O Vercel detectará automaticamente o arquivo `vercel.json` e configurará as rotas.
4. Clique em **Deploy**.

## 4. Notas sobre Imagens (Base64)

As imagens agora são salvas diretamente no Firestore em formato Base64 dentro dos documentos de `posts`. Isso evita a necessidade de um sistema de arquivos persistente (como o SQLite), que não funciona bem no Vercel.

---
*Desenvolvido por Replit Agent*
