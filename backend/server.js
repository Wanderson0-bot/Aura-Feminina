// ===============================
// IMPORTAÇÕES
// ===============================
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

// ===============================
// CONFIG APP
// ===============================
const app = express();
const frontendPath = path.resolve(__dirname, "..", "frontend");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));
app.use("/img-aura", express.static(path.join(frontendPath, "img-aura")));

// ===============================
// CONEXÃO COM BANCO
// ===============================
const db = mysql.createConnection({
  host: "127.0.0.1", // 🔥 corrigido
  user: "root",
  password: "123456", // coloque sua senha aqui
  database: "aura_feminina"
});

function garantirColunaPrecoAntigo() {
  const sqlVerificar = `
    SELECT COUNT(*) AS total
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'produtos'
      AND COLUMN_NAME = 'preco_antigo'
  `;

  db.query(sqlVerificar, [db.config.database], (erroVerificacao, resultado) => {
    if (erroVerificacao) {
      console.log("Erro ao verificar coluna preco_antigo:", erroVerificacao);
      return;
    }

    const colunaExiste = Number(resultado?.[0]?.total || 0) > 0;
    if (colunaExiste) return;

    db.query(
      "ALTER TABLE produtos ADD COLUMN preco_antigo DECIMAL(10,2) NULL",
      (erroAlteracao) => {
        if (erroAlteracao) {
          console.log("Erro ao criar coluna preco_antigo:", erroAlteracao);
          return;
        }

        console.log("✅ Coluna preco_antigo criada com sucesso.");
      }
    );
  });
}

// ===============================
// TESTAR CONEXÃO
// ===============================
db.connect(err => {
  if (err) {
    console.log("❌ Erro ao conectar no banco:");
    console.log(err);
  } else {
    console.log("✅ Banco conectado!");
    garantirColunaPrecoAntigo();
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

  // preserva o preço original mesmo se a promoção for alterada depois
  db.query("SELECT preco, preco_antigo FROM produtos WHERE id = ?", [id], (err, result) => {
    if (err || result.length === 0) {
      console.log("Erro ao buscar produto para promoção:", err);
      return res.status(500).json({ erro: true });
    }

    const precoAtual = result[0].preco;
    const precoOriginal = result[0].preco_antigo || precoAtual;

    db.query(
      "UPDATE produtos SET preco = ?, preco_antigo = ? WHERE id = ?",
      [preco, precoOriginal, id],
      (err2) => {
        if (err2) {
          console.log("Erro ao aplicar promoção:", err2);
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
// ROTA: ATUALIZAR CAMPOS ESPECÍFICOS
// ===============================
app.patch("/produtos/:id", (req, res) => {
  const id = req.params.id;
  const camposPermitidos = ["preco", "cores", "tamanhos"];
  const entradas = Object.entries(req.body || {}).filter(([chave]) => camposPermitidos.includes(chave));

  if (!entradas.length) {
    return res.status(400).json({ erro: true, mensagem: "Nenhum campo válido enviado" });
  }

  const setSql = entradas.map(([chave]) => `${chave} = ?`).join(", ");
  const valores = entradas.map(([, valor]) => valor);

  db.query(
    `UPDATE produtos SET ${setSql} WHERE id = ?`,
    [...valores, id],
    (err) => {
      if (err) {
        console.log("Erro ao atualizar campos do produto:", err);
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
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ===============================
// SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta " + PORT);
});
