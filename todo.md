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

## Edição de Produto
- [x] Verificar/corrigir router update produto
- [x] ProductModal suporta modo edição (pré-preencher campos)
- [x] Botão editar no StoreManager abre modal com dados do produto
- [x] Mutation de update envia todos os campos (nome, preço, desconto, tamanhos, imagem)

## Edição de Loja e Banners
- [x] Tabela store_banners no schema (imageUrl, ordem, link opcional)
- [x] Router: update store (logo, nome, slogan, whatsapp)
- [x] Router: CRUD de banners (criar, listar, eliminar, reordenar)
- [x] Modal de edição da loja no painel admin
- [x] Gestor de banners no painel admin (upload, lista, remover)
- [x] Carrossel de banners na vitrine pública com auto-play e dots

## Imagem do Produto por URL
- [x] ProductModal com tabs: "Upload de arquivo" e "URL da imagem"
- [x] Pré-visualização da imagem ao inserir URL
- [x] Validação básica de URL de imagem

## Bug: Imagem por URL não carrega
- [x] Corrigir pré-visualização de imagem ao inserir URL no ProductModal
- [x] Garantir que a URL é enviada ao backend ao guardar o produto

## Suporte a URL do Google Drive
- [x] Converter automaticamente link de partilha do Google Drive em link direto de imagem
- [x] Mostrar aviso ao utilizador quando a URL é convertida

## Tamanhos por País
- [x] Tabelas de tamanhos de roupa por país (BR, PT, ES, AR, CO)
- [x] Tabelas de tamanhos de ténis por país
- [x] ProductModal usa tamanhos do país da loja automaticamente

## Ocultar Hero quando há Banners
- [x] Hero Section some quando existem banners na loja

## Categorias visíveis com banners
- [ ] Barra de categorias permanece visível mesmo quando há banners

## Contacto e Redes Sociais da Loja
- [x] Colunas: address, phone, email, instagram, facebook, tiktok, youtube na tabela stores
- [x] EditStoreModal com campos de endereço, telefone, email e redes sociais
- [x] Router update store aceita os novos campos
- [x] Rodapé da vitrine exibe contactos e ícones das redes sociais
