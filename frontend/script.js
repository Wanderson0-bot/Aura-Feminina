// ===============================
// CONFIG API
// ===============================
const API = (() => {
  const { protocol, hostname, port } = window.location;

  if (protocol === "file:") {
    return "http://127.0.0.1:3000";
  }

  if (port && port !== "3000") {
    return `${protocol}//${hostname}:3000`;
  }

  return window.location.origin;
})();

// ===============================
// CARRINHO (localStorage)
// ===============================
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

// ===============================
// PEGAR CATEGORIA DA URL
// ===============================
const params = new URLSearchParams(window.location.search);
const categoria = params.get("cat") || "";

function normalizarCategoria(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function removerAcentos(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function categoriaCompativel(categoriaProduto, categoriaUrl) {
  const produto = normalizarCategoria(categoriaProduto);
  const filtro = normalizarCategoria(categoriaUrl);

  if (!filtro) return true;
  if (produto === filtro) return true;

  const alias = {
    sutia: "sutias",
    sutias: "sutias",
    calcinha: "calcinhas",
    calcinhas: "calcinhas",
    lingerie: "lingeries",
    lingeries: "lingeries",
    cueca: "cuecas",
    cuecas: "cuecas"
  };

  return alias[produto] === alias[filtro];
}

function normalizarCaminhoImagem(caminho) {
  if (!caminho) return "";
  if (/^https?:\/\//i.test(caminho)) return caminho;

  return caminho
    .split("/")
    .map(parte => encodeURIComponent(removerAcentos(parte)))
    .join("/")
    .replace(/%2E/g, ".");
}

function montarUrlImagem(caminho) {
  const caminhoNormalizado = normalizarCaminhoImagem(caminho);
  if (!caminhoNormalizado) return "";
  if (/^https?:\/\//i.test(caminhoNormalizado)) return caminhoNormalizado;
  return `${API}/${caminhoNormalizado}`;
}

function formatarPreco(valor) {
  return Number(valor || 0).toFixed(2);
}

function temPromocaoAtiva(produto) {
  return produto.preco_antigo && Number(produto.preco_antigo) > 0;
}

function montarPrecoProduto(produto) {
  const precoAtual = formatarPreco(produto.preco);
  const precoAntigo = temPromocaoAtiva(produto) ? formatarPreco(produto.preco_antigo) : "";

  if (!precoAntigo) {
    return `<p class="home-preco">R$ ${precoAtual}</p>`;
  }

  return `
    <div class="home-precos">
      <p class="home-preco home-preco-promocional">R$ ${precoAtual}</p>
      <p class="home-preco-antigo">De: <s>R$ ${precoAntigo}</s></p>
    </div>
  `;
}

// ===============================
// CARROSSEL HOME
// ===============================
function iniciarCarrosselHome() {
  const carrossel = document.querySelector(".home-carrossel");
  const slidesWrapper = document.querySelector(".home-slides");
  const slides = document.querySelectorAll(".home-slide");
  const dots = document.querySelectorAll(".home-dot");

  if (!carrossel || !slidesWrapper || slides.length <= 1) return;
  if (window.innerWidth <= 768) return;

  let slideAtual = 0;
  let intervalo = null;

  function atualizarSlide(indice) {
    slideAtual = indice;
    slidesWrapper.style.transform = `translateX(-${slideAtual * 100}%)`;

    slides.forEach((slide, posicao) => {
      slide.classList.toggle("active", posicao === slideAtual);
    });

    dots.forEach((dot, posicao) => {
      dot.classList.toggle("active", posicao === slideAtual);
    });
  }

  function proximoSlide() {
    const proximoIndice = (slideAtual + 1) % slides.length;
    atualizarSlide(proximoIndice);
  }

  function iniciarAutoPlay() {
    clearInterval(intervalo);
    intervalo = setInterval(proximoSlide, 2000);
  }

  dots.forEach((dot, indice) => {
    dot.addEventListener("click", () => {
      atualizarSlide(indice);
      iniciarAutoPlay();
    });
  });

  carrossel.addEventListener("mouseenter", () => clearInterval(intervalo));
  carrossel.addEventListener("mouseleave", iniciarAutoPlay);

  atualizarSlide(0);
  iniciarAutoPlay();
}

// ===============================
// LISTAR PRODUTOS
// ===============================
function carregarProdutos() {
  const div = document.getElementById("produtos");
  if (!div) return;

  fetch(`${API}/produtos`)
  .then(res => res.json())
  .then(produtos => {
    const produtosFiltrados = produtos.filter(p => categoriaCompativel(p.categoria, categoria));

    div.innerHTML = "";

    if (produtosFiltrados.length === 0) {
      div.innerHTML = "<p>Nenhum produto encontrado nesta categoria.</p>";
      return;
    }

    produtosFiltrados.forEach(p => {
      const tamanhos = String(p.tamanhos || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

      const cores = String(p.cores || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

      const tamanhosHtml = tamanhos.map(tamanho => `
        <label>
          <input type="radio" name="tam${p.id}" value="${tamanho}">
          <span>${tamanho}</span>
        </label>
      `).join("");

      const coresHtml = cores.map(cor => `
        <label>
          <input type="radio" name="cor${p.id}" value="${cor}">
          <span>${cor}</span>
        </label>
      `).join("");

      div.innerHTML += `
        <div class="produto">
          <img src="${montarUrlImagem(p.imagem_url)}" alt="${p.nome}">
          <h3>${p.nome}</h3>
          ${montarPrecoProduto(p)}
          <div class="tamanhos">${tamanhosHtml}</div>
          <div class="cores">${coresHtml}</div>
          <button onclick="addCarrinho('${p.nome.replace(/'/g, "\\'")}', ${Number(p.preco)}, ${p.id}, '${String(p.imagem_url || "").replace(/'/g, "\\'")}')">
            Adicionar ao carrinho
          </button>
        </div>
      `;
    });
  })
  .catch(err => {
    console.error("Erro ao carregar produtos:", err);
  });
}

// ===============================
// ADICIONAR AO CARRINHO
// ===============================
function addCarrinho(nome, preco, id, imagem) {
  let tam = document.querySelector(`input[name="tam${id}"]:checked`);
  let cor = document.querySelector(`input[name="cor${id}"]:checked`);

  if (!tam || !cor) {
    alert("Escolha tamanho e cor!");
    return;
  }

  carrinho.push({
    nome,
    preco,
    tamanho: tam.value,
    cor: cor.value,
    imagem_url: imagem,
    qtd: 1
  });

  salvarCarrinho();
  mostrarToast("Produto adicionado ao carrinho 🛍️");
}

// ===============================
// SALVAR
// ===============================
function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  atualizarContador();
}

// ===============================
// CONTADOR
// ===============================
function atualizarContador() {
  const contador = document.querySelector(".home-contador");
  if (!contador) return;

  let total = carrinho.reduce((s, i) => s + (i.qtd || 1), 0);
  contador.innerText = total;
}

// ===============================
// CARRINHO
// ===============================
function carregarCarrinho() {
  const div = document.getElementById("itens-carrinho");
  const totalSpan = document.getElementById("total");
  if (!div) return;

  div.innerHTML = "";
  let total = 0;

  carrinho.forEach((item, i) => {
    let qtd = item.qtd || 1;
    total += item.preco * qtd;

    div.innerHTML += `
      <div class="cart-item">
        <img src="${montarUrlImagem(item.imagem_url)}" alt="${item.nome}">
        <div class="cart-info">
          <h3>${item.nome}</h3>
          <p>${item.tamanho} | ${item.cor}</p>
          <p class="cart-preco">R$ ${item.preco.toFixed(2)}</p>
          <div class="cart-controles">
            <button onclick="diminuir(${i})" class="btn-qtd">−</button>
            <span class="qtd">${qtd}</span>
            <button onclick="aumentar(${i})" class="btn-qtd">+</button>
          </div>
          <button onclick="remover(${i})" class="btn-remover">Remover</button>
        </div>
      </div>
    `;
  });

  if (totalSpan) totalSpan.innerText = total.toFixed(2);
}

// ===============================
// CONTROLE QTD
// ===============================
function aumentar(i) {
  carrinho[i].qtd = (carrinho[i].qtd || 1) + 1;
  salvarCarrinho();
  carregarCarrinho();
}

function diminuir(i) {
  if ((carrinho[i].qtd || 1) > 1) {
    carrinho[i].qtd--;
  }
  salvarCarrinho();
  carregarCarrinho();
}

function remover(i) {
  carrinho.splice(i, 1);
  salvarCarrinho();
  carregarCarrinho();
}

function limparCarrinho() {
  carrinho = [];
  salvarCarrinho();
  carregarCarrinho();
}

// ===============================
// WHATSAPP
// ===============================
function finalizarCompra() {
  if (carrinho.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  let msg = "Pedido:%0A%0A";

  carrinho.forEach(p => {
    msg += `• ${p.nome}%0A`;
    msg += `Tamanho: ${p.tamanho}%0A`;
    msg += `Cor: ${p.cor}%0A`;
    msg += `Qtd: ${p.qtd || 1}%0A`;
    msg += `Preço: R$ ${p.preco}%0A%0A`;
  });

  window.open(`https://wa.me/5585981182983?text=${msg}`);
}

// ===============================
// TOAST
// ===============================
function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ===============================
// ADMIN
// ===============================
function carregarAdmin() {
  const lista = document.getElementById("lista");
  if (!lista) return;

  fetch(`${API}/produtos`)
    .then(res => res.json())
    .then(produtos => {
      lista.innerHTML = "";

      if (!produtos.length) {
        lista.innerHTML = "<p>Nenhum produto cadastrado.</p>";
        return;
      }

      produtos.forEach(produto => {
        const emPromocao = temPromocaoAtiva(produto);
        const imagem = montarUrlImagem(produto.imagem_url);

        lista.innerHTML += `
          <div class="card">
            <img src="${imagem}" alt="${produto.nome}">
            <h4>${produto.nome}</h4>
            ${
              emPromocao
                ? `<div class="admin-precos">
                    <p class="admin-preco-promocional">R$ ${formatarPreco(produto.preco)}</p>
                    <p class="admin-preco-antigo">De: <s>R$ ${formatarPreco(produto.preco_antigo)}</s></p>
                  </div>`
                : `<p class="admin-preco-normal">R$ ${formatarPreco(produto.preco)}</p>`
            }
            <input id="preco-atual-${produto.id}" type="number" min="0" step="0.01" value="${Number(produto.preco || 0)}" placeholder="Alterar preço atual">
            <button onclick="alterarPrecoAtual(${produto.id})">Alterar preço atual</button>
            <input id="cores-atual-${produto.id}" type="text" value="${String(produto.cores || "")}" placeholder="Alterar cores atuais">
            <button onclick="alterarCorAtual(${produto.id})">Alterar cor atual</button>
            <input id="tamanhos-atual-${produto.id}" type="text" value="${String(produto.tamanhos || "")}" placeholder="Alterar tamanhos atuais">
            <button onclick="alterarTamanhoAtual(${produto.id})">Alterar tamanho atual</button>
            <input id="promo-${produto.id}" type="number" min="0" step="0.01" placeholder="Preço da promoção">
            <button class="admin-btn" onclick="aplicarPromocao(${produto.id})">Adicionar promoção</button>
            <button class="admin-btn-sec" onclick="removerPromocao(${produto.id})">Remover promoção</button>
            <button onclick="deletarProduto(${produto.id})">Excluir produto</button>
          </div>
        `;
      });
    })
    .catch(err => {
      console.error("Erro ao carregar admin:", err);
      mostrarToast("Erro ao carregar produtos do admin");
    });
}

function add() {
  const nome = document.getElementById("nome")?.value.trim();
  const preco = document.getElementById("preco")?.value.trim();
  const imagem_url = document.getElementById("img")?.value.trim();
  const categoria = document.getElementById("cat")?.value;
  const tamanhos = document.getElementById("tamanhos")?.value.trim() || "";
  const cores = document.getElementById("cores")?.value.trim() || "";
  const estoque = document.getElementById("estoque")?.value.trim() || "0";

  if (!nome || !preco || !imagem_url || !categoria) {
    alert("Preencha nome, preço, imagem e categoria.");
    return;
  }

  fetch(`${API}/produtos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nome,
      preco: Number(preco),
      imagem_url,
      categoria,
      tamanhos,
      cores,
      estoque: Number(estoque)
    })
  })
    .then(res => res.json())
    .then(resposta => {
      if (!resposta.ok) throw new Error("Falha ao adicionar produto");

      ["nome", "preco", "img", "tamanhos", "cores", "estoque"].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
      });

      mostrarToast("Produto adicionado com sucesso");
      carregarAdmin();
    })
    .catch(err => {
      console.error("Erro ao adicionar produto:", err);
      mostrarToast("Erro ao adicionar produto");
    });
}

function aplicarPromocao(id) {
  const input = document.getElementById(`promo-${id}`);
  const precoPromocional = Number(input?.value);

  if (!precoPromocional || precoPromocional <= 0) {
    alert("Digite um preço promocional válido.");
    return;
  }

  fetch(`${API}/produtos/promocao/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ preco: precoPromocional })
  })
    .then(res => res.json())
    .then(resposta => {
      if (!resposta.ok) throw new Error("Falha ao aplicar promoção");
      mostrarToast("Promoção adicionada");
      carregarAdmin();
      carregarProdutos();
    })
    .catch(err => {
      console.error("Erro ao aplicar promoção:", err);
      mostrarToast("Erro ao adicionar promoção");
    });
}

function removerPromocao(id) {
  fetch(`${API}/produtos/remover-promocao/${id}`, {
    method: "PUT"
  })
    .then(res => res.json())
    .then(resposta => {
      if (!resposta.ok) throw new Error("Falha ao remover promoção");
      mostrarToast("Promoção removida");
      carregarAdmin();
      carregarProdutos();
    })
    .catch(err => {
      console.error("Erro ao remover promoção:", err);
      mostrarToast("Erro ao remover promoção");
    });
}

function atualizarCampoProduto(id, campo, valor, mensagemSucesso, mensagemErro) {
  fetch(`${API}/produtos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ [campo]: valor })
  })
    .then(res => res.json())
    .then(resposta => {
      if (!resposta.ok) throw new Error(mensagemErro);
      mostrarToast(mensagemSucesso);
      carregarAdmin();
      carregarProdutos();
    })
    .catch(err => {
      console.error(mensagemErro + ":", err);
      mostrarToast(mensagemErro);
    });
}

function alterarPrecoAtual(id) {
  const input = document.getElementById(`preco-atual-${id}`);
  const preco = Number(input?.value);

  if (!preco || preco <= 0) {
    alert("Digite um preço válido.");
    return;
  }

  atualizarCampoProduto(id, "preco", preco, "Preço atualizado", "Erro ao atualizar preço");
}

function alterarCorAtual(id) {
  const input = document.getElementById(`cores-atual-${id}`);
  const cores = input?.value.trim();

  if (!cores) {
    alert("Digite ao menos uma cor.");
    return;
  }

  atualizarCampoProduto(id, "cores", cores, "Cores atualizadas", "Erro ao atualizar cores");
}

function alterarTamanhoAtual(id) {
  const input = document.getElementById(`tamanhos-atual-${id}`);
  const tamanhos = input?.value.trim();

  if (!tamanhos) {
    alert("Digite ao menos um tamanho.");
    return;
  }

  atualizarCampoProduto(id, "tamanhos", tamanhos, "Tamanhos atualizados", "Erro ao atualizar tamanhos");
}

function deletarProduto(id) {
  fetch(`${API}/produtos/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(resposta => {
      if (!resposta.ok) throw new Error("Falha ao excluir produto");
      mostrarToast("Produto removido");
      carregarAdmin();
      carregarProdutos();
    })
    .catch(err => {
      console.error("Erro ao excluir produto:", err);
      mostrarToast("Erro ao excluir produto");
    });
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  iniciarCarrosselHome();
  carregarProdutos();
  carregarCarrinho();
  atualizarContador();
  carregarAdmin();
});
