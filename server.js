// ===============================
// IMPORTAÇÕES
// ===============================
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

// ===============================
// CONFIG APP
// ===============================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("img-aura")); // sua pasta do site
app.use("/img-aura", express.static("img-aura"));

// ===============================
// CONEXÃO COM BANCO
// ===============================
const db = mysql.createConnection({
  host: "127.0.0.1", // 🔥 corrigido
  user: "root",
  password: "123456", // coloque sua senha aqui
  database: "aura_feminina"
});

// ===============================
// TESTAR CONEXÃO
// ===============================
db.connect(err => {
  if (err) {
    console.log("❌ Erro ao conectar no banco:");
    console.log(err);
  } else {
    console.log("✅ Banco conectado!");
  }
});

// ===============================
// ROTA: LISTAR PRODUTOS
// ===============================
app.get("/produtos", (req, res) => {
  db.query("SELECT * FROM produtos", (err, result) => {
    if (err) {
      console.log("Erro ao buscar produtos:", err);
      return res.status(500).json([]);
    }
    res.json(result);
  });
});

// ===============================
// ROTA: ADICIONAR PRODUTO
// ===============================
app.post("/produtos", (req, res) => {
  const {
    nome,
    preco,
    imagem_url,
    categoria,
    tamanhos,
    cores,
    estoque
  } = req.body;

  db.query(
    `INSERT INTO produtos 
    (nome, preco, imagem_url, categoria, tamanhos, cores, estoque) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      nome,
      preco,
      imagem_url,
      categoria,
      tamanhos,
      cores,
      estoque || 0 // se não mandar estoque, vira 0
    ],
    (err) => {
      if (err) {
        console.log("Erro ao inserir:", err);
        return res.status(500).json({ erro: true });
      }
      res.json({ ok: true });
    }
  );
});

// ===============================
// ROTA: APLICAR PROMOÇÃO
// ===============================
app.put("/produtos/promocao/:id", (req, res) => {
  const id = req.params.id;
  const { preco } = req.body;

  // pega preço atual antes de alterar
  db.query("SELECT preco FROM produtos WHERE id = ?", [id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ erro: true });
    }

    const precoAtual = result[0].preco;

    // atualiza com promoção
    db.query(
      "UPDATE produtos SET preco = ?, preco_antigo = ? WHERE id = ?",
      [preco, precoAtual, id],
      (err2) => {
        if (err2) {
          return res.status(500).json({ erro: true });
        }
        res.json({ ok: true });
      }
    );
  });
});

// ===============================
// ROTA: REMOVER PROMOÇÃO
// ===============================
app.put("/produtos/remover-promocao/:id", (req, res) => {
  const id = req.params.id;

  // volta o preço antigo e remove promoção
  db.query(
    "UPDATE produtos SET preco = preco_antigo, preco_antigo = NULL WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.log("Erro ao remover promoção:", err);
        return res.status(500).json({ erro: true });
      }

      res.json({ ok: true });
    }
  );
});

// ===============================
// ROTA: DELETAR PRODUTO
// ===============================
app.delete("/produtos/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM produtos WHERE id = ?", [id], (err) => {
    if (err) {
      console.log("Erro ao deletar:", err);
      return res.status(500).json({ erro: true });
    }
    res.json({ ok: true });
  });
});

// ===============================
// ROTA: ATUALIZAR PRODUTO (EXTRA)
// ===============================
app.put("/produtos/:id", (req, res) => {
  const id = req.params.id;

  const {
    nome,
    preco,
    imagem_url,
    categoria,
    tamanhos,
    cores,
    estoque
  } = req.body;

  db.query(
    `UPDATE produtos SET 
      nome=?, preco=?, imagem_url=?, categoria=?, 
      tamanhos=?, cores=?, estoque=? 
     WHERE id=?`,
    [
      nome,
      preco,
      imagem_url,
      categoria,
      tamanhos,
      cores,
      estoque,
      id
    ],
    (err) => {
      if (err) {
        console.log("Erro ao atualizar:", err);
        return res.status(500).json({ erro: true });
      }
      res.json({ ok: true });
    }
  );
});

// ===============================
// ROTA TESTE
// ===============================
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

// ===============================
// SERVIDOR
// ===============================
app.listen(3000, () => {
  console.log("🚀 Servidor rodando em: http://localhost:3000");
});