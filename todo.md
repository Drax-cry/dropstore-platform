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


## Dashboard Admin - Responsividade
- [x] Otimizar layout do Admin para mobile (sidebar colapsável)
- [x] Otimizar StoreManager para mobile/tablet
- [x] Otimizar modais para mobile (full-screen em telas pequenas)
- [x] Melhorar espaçamento e tipografia em mobile
- [x] Testar em dispositivos reais
