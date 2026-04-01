// ===============================
// CONFIG API
// ===============================
const API = "http://localhost:3000";

// ===============================
// CARRINHO (localStorage)
// ===============================
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

// ===============================
// PEGAR CATEGORIA DA URL
// ===============================
const params = new URLSearchParams(window.location.search);
const categoria = params.get("cat");

// ===============================
// LISTAR PRODUTOS
// ===============================
function carregarProdutos() {
  fetch(API + "/produtos")
    .then(res => res.json())
    .then(produtos => {
      const div = document.getElementById("produtos");
      if (!div) return;

      div.innerHTML = "";

      produtos
        .filter(p => p.categoria === categoria)
        .forEach(p => {

          let tamanhos = p.tamanhos ? p.tamanhos.split(",") : [];
          let cores = p.cores ? p.cores.split(",") : [];

          let htmlTam = tamanhos.map(t => `
            <label>
              <input type="radio" name="tam${p.id}" value="${t}">
              ${t}
            </label>
          `).join("");

          let htmlCor = cores.map(c => `
              <label title="${c}">
    <input type="radio" name="cor${p.id}" value="${c}">
    ${c}
  </label>
`).join("");

          div.innerHTML += `
            <div class="produto">
              <img src="${p.imagem_url}">
              <h3>${p.nome}</h3>
              <p>R$ ${p.preco}</p>

              <div class="tamanhos">${htmlTam}</div>
              <div class="cores">${htmlCor}</div>

              <button onclick="addCarrinho('${p.nome}', ${p.preco}, ${p.id}, '${p.imagem_url}')">
                Comprar
              </button>
            </div>
          `;
        });
    })
    .catch(() => {
      console.log("Erro ao carregar produtos");
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
    imagem,
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
  <img src="${item.imagem}">

  <div class="cart-info">
    <h3>${item.nome}</h3>
    <p>${item.tamanho} | ${item.cor}</p>
    <p class="cart-preco">R$ ${item.preco}</p>

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
// ADMIN
// ===============================
function add() {
  fetch(API + "/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: nome.value,
      preco: preco.value,
      imagem_url: img.value,
      categoria: cat.value,
      tamanhos: tam.value,
      cores: cor.value
    })
  }).then(() => {
    alert("Produto cadastrado!");
    location.reload();
  });
}

function aplicarPromocao() {
  const id = Number(document.getElementById("idPromo").value);
  const novoPreco = Number(document.getElementById("novoPreco").value);

  if (!id || !novoPreco) {
    alert("Preencha os campos corretamente!");
    return;
  }

  let produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  let encontrou = false;

  produtos = produtos.map(p => {
    if (p.id === id) {
      encontrou = true;
      return {
        ...p,
        precoPromocional: novoPreco
      };
    }
    return p;
  });

  if (!encontrou) {
    alert("Produto não encontrado!");
    return;
  }

  localStorage.setItem("produtos", JSON.stringify(produtos));

  alert("Promoção aplicada com sucesso!");
  listarProdutos();
}

function removerPromocao() {
  const id = Number(document.getElementById("idRemoverPromo").value);

  if (!id) {
    alert("Digite um ID válido!");
    return;
  }

  let produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  let encontrou = false;

  produtos = produtos.map(p => {
    if (p.id === id) {
      encontrou = true;
      delete p.precoPromocional;
    }
    return p;
  });

  if (!encontrou) {
    alert("Produto não encontrado!");
    return;
  }

  localStorage.setItem("produtos", JSON.stringify(produtos));

  alert("Promoção removida!");
  listarProdutos();
}

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
// CARROSSEL
// ===============================
let slideIndex = 0;

function iniciarCarrossel() {
  const slides = document.querySelectorAll(".home-slide");
  const dots = document.querySelectorAll(".home-dot");

  if (slides.length === 0) return;

  function mostrarSlide(i) {
    slides.forEach((s, idx) => {
      s.style.display = idx === i ? "block" : "none";
    });

    dots.forEach((d, idx) => {
      d.classList.toggle("active", idx === i);
    });
  }

  function proximo() {
    slideIndex++;
    if (slideIndex >= slides.length) slideIndex = 0;
    mostrarSlide(slideIndex);
  }

  mostrarSlide(slideIndex);
  setInterval(proximo, 3000);
}

// ===============================
// INIT
// ===============================
carregarProdutos();
carregarCarrinho();
atualizarContador();
iniciarCarrossel();