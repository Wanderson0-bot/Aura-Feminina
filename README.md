# Aura Feminina - Servidor Node.js

Servidor Express para a loja online Aura Feminina com API CRUD para produtos.

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure o banco de dados MySQL:
```bash
mysql -u root -p < aura_feminina.sql
```

3. Configure as variáveis de ambiente (opcional):
```bash
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=sua_senha
export DB_NAME=aura_feminina
export PORT=3000
```

## Executar

**Modo produção:**
```bash
npm start
```

**Modo desenvolvimento** (com auto-reload):
```bash
npm run dev
```

O servidor será iniciado em `http://localhost:3000`

## API Endpoints

### GET /api/produtos
Obter todos os produtos

### GET /api/produtos/:id
Obter um produto específico

**Exemplo:**
```bash
curl http://localhost:3000/api/produtos/1
```

### POST /api/produtos
Criar novo produto

**Body:**
```json
{
  "nome": "Calcinha Premium",
  "preco": 89.90,
  "categoria": "Calcinhas",
  "imagem": "URL_DA_IMAGEM",
  "tamanho": "P,M,G",
  "cores": "Preto,Rosa,Branco"
}
```

### PUT /api/produtos/:id
Atualizar produto

### DELETE /api/produtos/:id
Deletar produto

## Estrutura de Arquivos

```
├── server.js           # Servidor principal
├── package.json        # Dependências do projeto
├── index.html          # Página inicial
├── carrinho.html       # Página do carrinho
├── categoria.html      # Página de categorias
├── admin-87204.html    # Painel administrativo
├── style.css           # Estilos
├── script.js           # Scripts do frontend
└── aura_feminina.sql   # Banco de dados
```

## Requisitos

- Node.js 14+
- MySQL 5.7+

## Licença

ISC
