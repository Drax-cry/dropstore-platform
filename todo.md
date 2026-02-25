# DropStore Platform - TODO

## Backend / Base de Dados
- [x] Schema: tabela stores (loja do utilizador)
- [x] Schema: tabela categories (categorias da loja)
- [x] Schema: tabela subcategories (subcategorias/marcas)
- [x] Schema: tabela products (produtos com preço, tamanhos, imagem)
- [x] Migração da base de dados (SQL direto)
- [x] Router: CRUD de lojas
- [x] Router: CRUD de categorias
- [x] Router: CRUD de subcategorias
- [x] Router: CRUD de produtos
- [x] Router: endpoint público da vitrine (por slug da loja)

## Frontend - Autenticação
- [x] Página de login (Landing page com botão OAuth)
- [x] Redirecionamento pós-login para painel admin

## Frontend - Painel Admin
- [x] Dashboard do admin com lista de lojas
- [x] Formulário de criação de loja (nome, logo, slogan, WhatsApp)
- [x] Gestão de categorias da loja
- [x] Gestão de subcategorias
- [x] Gestão de produtos (nome, marca, preço, tamanhos, imagem)
- [x] Upload de imagem do produto para S3

## Frontend - Vitrine Pública
- [x] Header com logo da loja e barra de busca
- [x] Hero section com slogan animado
- [x] Navegação por categorias (abas)
- [x] Filtro por subcategorias (badges de marcas)
- [x] Cards de produto com hover effects
- [x] Seletor de tamanho no card
- [x] Botão WhatsApp com mensagem pré-preenchida
- [x] Animações de scroll (fade-in)
- [x] Filtragem em tempo real na search bar
- [x] Design responsivo (mobile e desktop)

## Qualidade
- [x] Testes Vitest para routers principais
- [x] Estados de loading e erro em todos os componentes

## Responsividade Completa (Sem Alterar Design)
- [ ] Home.tsx (login) responsiva para mobile/tablet
- [ ] Admin.tsx responsivo com sidebar colapsável em mobile
- [ ] StoreManager.tsx responsivo
- [ ] CreateStoreModal responsivo
- [ ] ProductModal responsivo
- [ ] StoreFront.tsx responsivo

## Desconto no Produto
- [x] Adicionar coluna discountPercent na tabela products
- [x] Adicionar campo de desconto no ProductModal
- [x] Atualizar router para aceitar discountPercent
- [x] Exibir preço original riscado e preço final na vitrine
- [x] Badge de desconto no card do produto

## País, Prefixo e Moeda
- [x] Adicionar colunas country e currency na tabela stores
- [x] Atualizar CreateStoreModal com seletor de país (PT, BR, ES, AR, CO)
- [x] Prefixo telefónico automático por país (+351, +55, +34, +54, +57)
- [x] Seleção de moeda automática por país (€, R$, €, $, COP)
- [x] Exibir moeda correta nos preços da vitrine
- [x] Prefixo correto no link do WhatsApp
