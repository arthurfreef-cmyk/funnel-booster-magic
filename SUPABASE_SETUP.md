# Supabase Auth — configuração da conta opcional

O checkout continua permitindo compra como visitante. A conta é opcional e oferece login por e-mail/senha ou Google.

## 1. Criar o projeto Supabase
1. Crie um projeto em https://supabase.com/dashboard.
2. Em **Project Settings → API**, copie a Project URL e a chave pública **anon** (ou **publishable key**, conforme a versão do painel).
3. Nunca use a chave `service_role` no navegador e nunca a envie ao GitHub.

## 2. Configurar as variáveis no Lovable
Adicione estas variáveis de ambiente ao projeto Lovable e também ao ambiente de deploy:

- `VITE_SUPABASE_URL` = Project URL do Supabase
- `VITE_SUPABASE_ANON_KEY` = chave pública anon/publishable

Depois de salvar, faça um novo deploy para que as variáveis `VITE_*` sejam incluídas no frontend.

## 3. Ativar login com Google
1. No Supabase, abra **Authentication → Providers → Google** e habilite o provedor.
2. Crie um OAuth Client ID no Google Cloud Console.
3. Cadastre o Client ID e o Client Secret no provedor Google do Supabase.
4. Copie a **Callback URL** exibida pelo Supabase e adicione-a como Authorized redirect URI no Google Cloud.
5. Em **Authentication → URL Configuration**, configure a URL principal da loja e inclua as URLs de produção e preview usadas pelo Lovable na lista de Redirect URLs, terminando em `/checkout`.

## 4. Confirmação por e-mail
O cadastro usa confirmação de e-mail quando essa opção estiver habilitada no Supabase. Configure os templates de e-mail e o SMTP de produção antes de liberar o cadastro para clientes.

## Importante
- Não é necessário criar conta para comprar.
- O login preenche automaticamente nome e e-mail quando disponíveis; CPF, telefone e endereço continuam sendo informados no checkout.
- A autenticação não altera preços, descontos, produtos, frete ou condições promocionais.
- Esta integração não salva pedidos nem cria histórico de compras; ela autentica a conta do cliente.
