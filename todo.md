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


## Responsividade
- [x] Otimizar painel admin para mobile (sidebar colapsável, layout stack)
- [x] Otimizar StoreFront para mobile (grid responsivo, touch-friendly)
- [x] Otimizar modais para mobile (full-screen em telas pequenas)
- [x] Otimizar página de login para mobile
- [x] Otimizar página de apresentação para mobile
- [x] Testar em dispositivos reais (mobile, tablet, desktop)


## Secção de Categorias
- [x] Criar página dedicada de categorias com grid de cards
- [x] Exibir contagem de produtos por categoria
- [x] Cards com ícones/cores por categoria
- [x] Navegação entre categorias e subcategorias
- [x] Link para voltar à vitrine principal
- [x] Responsividade completa para mobile/tablet/desktop


## Ordenacao de Produtos
- [x] Adicionar selector de ordenacao na pagina de categorias
- [x] Implementar ordenacao por mais recentes
- [x] Implementar ordenacao por maior preco
- [x] Implementar ordenacao por menor preco
- [x] Adicionar selector de ordenacao na vitrine (StoreFront)
- [x] Persistir preferencia de ordenacao (localStorage)
