# Cosmos Maker

Criador de avatares em pixel art que combina o estilo do Picrew com o gerador de personagens do RPG Maker MV. Enquanto você escolhe as peças (corpo, cabelo, roupa, acessórios...), o app monta ao mesmo tempo **três versões** do personagem:

| Tipo | Tamanho | Descrição |
|---|---|---|
| **Portrait** | 120×160 | Retrato detalhado. Preview ampliado em escala inteira para ficar nítido. |
| **Overworld** | 96×128 (frames de 32×32) | Sprite de mapa: 3 colunas (frames de caminhada) × 4 linhas (direções). |
| **Battle** | 576×96 (frames de 96×96) | Sprite de batalha: 6 frames em uma única linha. |

Cada peça tem uma **paleta de cores** (as cores-chave pintadas no PNG) e você troca cada cor livremente, com roda de cores, RGB, HEX e paletas prontas. Sombras podem ser automáticas (calculadas a partir da cor principal) ou manuais.

> **Versão da documentação:** veja o [histórico de alterações](#20-histórico-de-alterações-da-documentação) no final.

---

## Índice

1. [Stack e instalação](#1-stack-e-instalação)
2. [Estrutura do projeto](#2-estrutura-do-projeto)
3. [Conceitos fundamentais](#3-conceitos-fundamentais)
4. [Tamanhos dos sprites (`sizes.json`)](#4-tamanhos-dos-sprites-sizesjson)
5. [Categorias (`categories.json`)](#5-categorias-categoriesjson)
6. [Peças (`src/data/assets/*.json`)](#6-peças-srcdataassetsjson)
7. [Paleta de cores da peça (`palette`)](#7-paleta-de-cores-da-peça-palette)
8. [Resolução dos arquivos de imagem (`src`)](#8-resolução-dos-arquivos-de-imagem-src)
9. [Camadas (`layers`) e ordem de empilhamento](#9-camadas-layers-e-ordem-de-empilhamento)
10. [Categorias dependentes (`dependsOn` + `variants`)](#10-categorias-dependentes-dependson--variants)
11. [Reaproveitar sprites entre corpos e entre tipos](#11-reaproveitar-sprites-entre-corpos-e-entre-tipos)
12. [Peças pareadas (`pairs`)](#12-peças-pareadas-pairs)
13. [Cores ligadas (`syncTo`)](#13-cores-ligadas-syncto)
14. [Sistema de cores: sombras, cadeado e recolor](#14-sistema-de-cores-sombras-cadeado-e-recolor)
15. [Paletas prontas (`palettes.json`)](#15-paletas-prontas-palettesjson)
16. [Comportamento da interface](#16-comportamento-da-interface)
17. [Exportação](#17-exportação)
18. [Receitas: como adicionar coisas novas](#18-receitas-como-adicionar-coisas-novas)
19. [Validações, avisos do console e solução de problemas](#19-validações-avisos-do-console-e-solução-de-problemas)
20. [Histórico de alterações da documentação](#20-histórico-de-alterações-da-documentação)

---

## 1. Stack e instalação

- **Vite + React** (JavaScript)
- **Canvas 2D** para composição, recolor, animação e exportação
- **Zustand** para o estado global
- Bibliotecas: `zustand`, `react-router-dom`, `@uiw/react-color-wheel`, `@uiw/react-color-shade-slider`, `@uiw/color-convert`, `jszip`, `lucide-react`, `gifenc`

```bash
npm create vite@latest cosmos-maker -- --template react
cd cosmos-maker
npm install
npm install zustand react-router-dom @uiw/react-color-wheel @uiw/react-color-shade-slider @uiw/color-convert jszip lucide-react gifenc
npm run dev
```

---

## 2. Estrutura do projeto

```
public/logo.png                 ← logo do app (favicon, referenciado no index.html)
public/assets/                  ← suas imagens (PNG). A organização das pastas é livre.
  portrait/ ...
  overworld/ ...
  battle/ ...

src/
  main.jsx
  App.jsx                       ← só monta o roteador (RouterProvider)
  router.jsx                    ← rotas (HashRouter): / e /avatar
  screens/
    HomeScreen.jsx              ← tela inicial
    AvatarScreen.jsx            ← criador de avatar (desktop e mobile)
    index.js
  index.css                     ← todos os estilos
  data/
    sizes.json                  ← tamanhos dos três tipos de sprite
    categories.json             ← categorias de peças (ordem = ordem do dropdown)
    palettes.json               ← paletas prontas (conjuntos de cores)
    credits.json                ← créditos dos assets (mostrados no modal "Créditos")
    random.json                 ← regras do botão Aleatório para cores (paletas permitidas, cores fixas)
    manifest.js                 ← junta os arquivos, valida e avisa no console
    assets.js                   ← índices e funções de regra (supports, getLayers, applyPairs...)
    assets/                     ← uma ou mais listas de peças (.json), em qualquer subpasta
      body.json
      outfit.json
      ...
  lib/
    color.js                    ← conversões HEX/RGB/HSL
    slots.js                    ← resolve a cor final de cada slot (sombras automáticas)
    layers.js                   ← carrega PNG, mapeia pixels → paleta, recolore (camada sem imagem = vazia)
    compose.js                  ← empilha as camadas de todas as peças em um canvas
    useComposite.js             ← hook React: gera o canvas final de um tipo
    useViewport.js              ← largura/altura da janela (layout mobile e escalas)
    presets.js                  ← aplica paletas prontas
    randomColors.js             ← sorteio de cores do Aleatório, guiado pelo random.json
    anim.js                     ← lê a config de animação do sizes.json, monta os quadros (animado/estático)
    frames.js                   ← tamanho dos quadros de cada tipo (frameInfo, hasFrames)
    exportImage.js              ← PNG/WebP/JPEG, frames, GIF, ZIP
  store/
    useStore.js                 ← estado, histórico, aleatório, salvar/carregar
  components/
    AssetPicker.jsx             ← grade de peças + lista de camadas (categorias múltiplas)
    CategorySelect.jsx          ← dropdown de categorias
    Thumb.jsx                   ← miniatura de uma peça
    ColorPanel.jsx              ← lista de cores da categoria ativa
    ColorPicker.jsx             ← roda, brilho, HEX, RGB
    PresetSwatches.jsx          ← paletas prontas
    CanvasView.jsx              ← mostra um canvas em escala inteira
    OpenableImage.jsx           ← imagem invisível sobre o preview (botão direito / segurar abre ou salva)
    SpriteCard.jsx              ← card de overworld/battle (animado/bruto)
    SpritePreview.jsx           ← animação do sprite
    ExportBar.jsx               ← exportação
    Toolbar.jsx                 ← desfazer, refazer, aleatório, salvar, carregar
    CreditsModal.jsx            ← botão "Créditos" (canto da tela) e o modal
```

---

## 3. Conceitos fundamentais

**Categoria** – um "tipo de peça" (Corpo, Roupa, Cabelo, Acessórios...). Definida em `categories.json`.

**Peça (asset)** – um item escolhível dentro de uma categoria (ex.: "Cabelo 2"). Definida em `src/data/assets/*.json`.

**Camada (layer)** – cada peça tem uma ou mais camadas de imagem (ex.: cabelo de trás e cabelo da frente). Todas são desenhadas em ordem de `zIndex`.

**Slot de cor** – um "botão de cor" editável pelo usuário (ex.: `pele`, `cabelo`, `roupa_sombra`). Vários pixels de cores-chave diferentes podem apontar para o mesmo slot, e várias peças podem usar o mesmo slot (então mudam de cor juntas).

**Cor-chave (`key`)** – a cor **exata** pintada no PNG. O app procura pixels com essa cor e a substitui pela cor atual do slot.

**Sombra** – um slot com `parent`. Enquanto estiver travada (cadeado fechado) é calculada a partir do slot pai. Destravada, é uma cor manual.

**Tipo** – `portrait`, `overworld` ou `battle`. Cada peça precisa de imagens para os três tipos.

**Fluxo geral:**

```
estado (peças escolhidas + cores + sombras destravadas)
   │
   ├─ para cada tipo (portrait, overworld, battle):
   │     para cada peça equipada → getLayers() → caminho do PNG
   │        loadLayer() → lê pixels, mapeia para a paleta (1 vez, com cache)
   │        recolorLayer() → aplica as cores atuais dos slots
   │     compose() → empilha por zIndex em um canvas
   │
   └─ canvases → previews, miniaturas, exportação
```

---

## 4. Tamanhos dos sprites (`sizes.json`)

```json
{
  "portrait":  { "w": 120, "h": 160 },
  "overworld": { "w": 96,  "h": 128, "frame": 32, "fps": 6, "sequence": [0, 1, 2, 1], "staticFrame": 0 },
  "battle":    { "w": 576, "h": 96,  "frame": 96, "fps": 8 }
}
```

| Campo | Significado |
|---|---|
| `w`, `h` | Largura e altura do PNG **inteiro** (a sheet completa). Em tipos com `frame`, `w` define a quantidade **padrão** de colunas (`w / largura do quadro`); peças podem ter outra quantidade (ver abaixo). |
| `frame` | Tamanho de cada quadro. **Número = quadrado** (ex.: `32` → 32×32). Para quadros retangulares, como o portrait, use `{ "w": 120, "h": 160 }`. Colunas = `w / largura do quadro`, linhas = `h / altura do quadro`. Atenção: `"frame": 120` significa 120×120; se a altura da sheet for 160, a imagem aparece cortada e o quadro quadrado (o manifest avisa no console). **Se omitido, o tipo é uma imagem única**: não há animação e os botões Animado/Estático/Bruto não aparecem (nem os botões de frames e GIF na exportação). |
| `fps` | Opcional. Velocidade **padrão** da animação, em quadros por segundo. Sem ele, usa 6. O usuário pode trocar no card do sprite. |
| `sequence` | Opcional. Ordem das **colunas** na animação. Sem ele, toca todas em ordem (0, 1, 2...). Ex.: `[0, 1, 2, 1]` para caminhada de ida e volta. Só vale quando a sheet combinada tem a quantidade padrão de colunas; com outra quantidade, toca todas em ordem. |
| `staticFrame` | Opcional. Coluna mostrada no modo **Estático**. Padrão `0` (primeiro quadro). |

**Overworld:** 3 colunas × 4 linhas. Ordem das linhas (padrão RPG Maker MV): **baixo, esquerda, direita, cima**.

**Battle:** 6 colunas × 1 linha.

**Portrait animado (futuro):** para animar o portrait, aumente `w`/`h` para o tamanho da sheet e adicione `frame`. Ex.: 4 quadros lado a lado: `"portrait": { "w": 480, "h": 160, "frame": { "w": 120, "h": 160 }, "fps": 6 }`. Refaça os PNGs do portrait com o novo tamanho. Os botões de visualização e exportação aparecem sozinhos.

> Tipos **sem** `frame` (hoje o portrait): todos os PNGs devem ter **exatamente** `w × h`. O app desenha cada imagem no canto superior esquerdo (0,0): imagem maior é cortada, menor deixa o resto vazio. Em tipos **com** `frame`, a **altura** deve ser `h` e a **largura** pode variar por peça (ver abaixo). Tamanhos inesperados geram aviso no console.

### Quantidade de quadros por peça

Em tipos com `frame`, as peças **não precisam** ter a mesma quantidade de colunas. O app descobre quantos quadros cada PNG tem pela **largura da imagem** (`largura / largura do quadro`), sem configuração nenhuma.

- Corpo do battle com 6 quadros: PNG de 576×96. Olho com 12 quadros: PNG de 1152×96.
- A **altura** é a do tipo (`h`). A largura deve ser múltipla da largura do quadro (senão há aviso no console).
- A **sheet combinada** (a que aparece em **Bruto**, anima e é exportada) tem o **menor múltiplo comum** das quantidades das peças equipadas: 6 e 12 → 12 colunas. Peças com menos quadros **se repetem**: o corpo toca 2 vezes enquanto o olho toca os 12. Com 6 e 8 quadros, são 24 colunas (6 repete 4 vezes, 8 repete 3).
- Uma peça de **1 quadro** (largura = largura do quadro) fica parada e combina com qualquer quantidade (útil para acessórios estáticos).
- Limite de **64 colunas**. Acima disso, o app usa a maior quantidade e avisa no console (algumas peças deixam de repetir de forma exata).
- O FPS é o mesmo para todas as peças. A `sequence` do `sizes.json` só vale quando a sheet combinada tem a quantidade padrão de colunas.
- Camadas vazias (`""`) não entram na conta.

---

## 5. Categorias (`categories.json`)

Lista (array). **A ordem do array é a ordem no dropdown** e também a ordem de desempate de empilhamento.

```json
[
  { "id": "body",      "label": "Corpo",      "zIndex": 10, "required": true },
  { "id": "outfit",    "label": "Roupa",      "zIndex": 20, "required": false, "dependsOn": "body" },
  { "id": "hair",      "label": "Cabelo",     "zIndex": 30, "thumb": { "x": 20, "y": 0, "w": 80, "h": 80 } },
  { "id": "accessory", "label": "Acessórios", "zIndex": 40, "multiple": true }
]
```

| Atributo | Obrigatório | Significado |
|---|---|---|
| `id` | sim | Identificador único. É o valor usado em `category` nas peças. |
| `label` | sim | Nome mostrado no dropdown. |
| `zIndex` | sim | Altura padrão de empilhamento das camadas da categoria. Maior = mais à frente. Cada camada pode sobrescrever (ver [seção 9](#9-camadas-layers-e-ordem-de-empilhamento)). |
| `required` | não | `true` = sempre há uma peça equipada (começa com a primeira da lista) e não existe a opção "Nenhum". Só vale para categorias **únicas** (sem `multiple`). Não use `required` junto com `dependsOn` (ver [seção 10](#10-categorias-dependentes-dependson--variants)). |
| `multiple` | não | `true` = é possível equipar **várias** peças ao mesmo tempo (ex.: acessórios). Clicar em uma peça liga/desliga; aparece o botão "Remover todos" e uma lista de camadas reordenável. |
| `dependsOn` | não | `id` de outra categoria da qual esta depende. Faz a categoria só listar peças compatíveis com o que está equipado na categoria indicada e carregar a variação certa do PNG. A categoria indicada **precisa vir antes** neste arquivo e deve ser de escolha única. Detalhes na [seção 10](#10-categorias-dependentes-dependson--variants). |
| `thumb` | não | Recorte (em pixels de **um quadro** do portrait) usado nas miniaturas da categoria, para dar zoom. Campos `x`, `y`, `w`, `h`. Vale só para peças **sem** `thumbnail` próprio; sem `thumb`, a miniatura mostra o quadro inteiro. |

---

## 6. Peças (`src/data/assets/*.json`)

Qualquer `.json` dentro de `src/data/assets/` (inclusive subpastas) é carregado **automaticamente**. Cada arquivo é um array de peças (ou um objeto `{ "assets": [...] }`). Os arquivos são lidos em ordem alfabética do caminho, e essa é a ordem das peças na grade. Para controlar a ordem, prefixe os nomes (`01_casual.json`).

Você pode organizar como quiser: `body.json`, `outfit/casual.json`, `outfit/formal.json`...

### Atributos de uma peça

| Atributo | Obrigatório | Significado |
|---|---|---|
| `id` | sim | Identificador **único em todo o projeto**. Duplicados são ignorados (mantém o primeiro) com aviso no console. |
| `category` | sim | `id` de uma categoria existente. Categoria desconhecida → peça ignorada com aviso. |
| `name` | sim | Nome mostrado na grade e na lista de camadas. |
| `palette` | sim | Lista de cores da peça. Ver [seção 7](#7-paleta-de-cores-da-peça-palette). |
| `src` | recomendado | Caminho dos PNGs por tipo. Ver [seção 8](#8-resolução-dos-arquivos-de-imagem-src). |
| `layers` | não | Várias camadas de imagem. Ver [seção 9](#9-camadas-layers-e-ordem-de-empilhamento). |
| `variants` | não | Lista de `id`s de peças da categoria `dependsOn` com as quais esta peça funciona. Ver [seção 10](#10-categorias-dependentes-dependson--variants). |
| `variantAs` | não | (em peças de **corpo**) "para este tipo, as peças dependentes me tratam como outro corpo". Ver [seção 11](#11-reaproveitar-sprites-entre-corpos-e-entre-tipos). |
| `pairs` | não | Equipa automaticamente peças de outras categorias ao escolher esta. Ver [seção 12](#12-peças-pareadas-pairs). |
| `thumbnail` | não | Imagem usada na **miniatura** da peça na grade de escolha, relativa a `public/assets/` (ex.: `"miniatures/head/head_1.png"`). Aceita texto ou mapa por corpo `{ idDoCorpo: caminho, "*": caminho }`. É recolorida com a `palette` da peça (pixels com as cores-chave mudam; os demais ficam como estão) e mostrada inteira, em qualquer tamanho. Vazio (`""`), ausente ou arquivo inexistente: usa o portrait. |
| `sprites` | legado | Atalho antigo para reaproveitar arquivos de outra peça (só vale quando o `src` do tipo **não** é declarado). Prefira `src` + `variantAs`. |
| `folder` | legado | Subpasta usada pela convenção antiga de nomes (só vale quando o `src` do tipo **não** é declarado). |

### Exemplo mínimo

```json
{
  "id": "hair_01", "category": "hair", "name": "Cabelo 1",
  "src": {
    "portrait":  "portrait/hair/curto.png",
    "overworld": "overworld/hair/curto.png",
    "battle":    "battle/hair/curto.png"
  },
  "palette": [
    { "key": "#8b4513", "slot": "cabelo", "label": "Cabelo", "preset": { "group": "hair", "id": 1 } },
    { "key": "#5c2e0a", "slot": "cabelo_sombra", "label": "Cabelo (sombra)", "parent": "cabelo", "preset": { "group": "hair", "id": 2 } }
  ]
}
```

---

## 7. Paleta de cores da peça (`palette`)

Cada entrada liga **uma cor-chave do PNG** a **um slot editável**.

```json
{
  "key": "#cbcbcb",
  "keys": { "overworld": "#c8c8c8" },
  "slot": "pele_sombra_1",
  "label": "Pele (sombra 1)",
  "parent": "pele",
  "preset": { "group": "skin", "id": 2 },
  "syncTo": "pele_direita_sombra"
}
```

| Atributo | Obrigatório | Significado |
|---|---|---|
| `key` | sim | Cor HEX **exata** (6 dígitos) pintada nos PNGs. Pixels com essa cor são substituídos pela cor do slot. |
| `keys` | não | Cores-chave diferentes por tipo, quando um PNG usa outro tom. Ex.: `{ "overworld": "#f0c090", "battle": "#f0c090" }`. Tipos não listados usam `key`. |
| `slot` | sim | Nome do slot de cor. **Slots são globais**: dois itens com o mesmo `slot` compartilham a cor. Para cores independentes, use nomes diferentes. |
| `label` | sim | Nome mostrado no painel de cores. |
| `parent` | não | Torna este slot uma **sombra** do slot indicado. Enquanto travada, a cor é calculada a partir do pai. Aceita cadeia (sombra 2 com parent = sombra 1). Ver [seção 14](#14-sistema-de-cores-sombras-cadeado-e-recolor). |
| `preset` | não | Liga a cor às paletas prontas. Forma completa: `{ "group": "skin", "id": 1 }` (grupo e posição no conjunto). Forma curta: `"preset": "hair"` (equivale a `id: 1`). Sem `preset`: slots comuns usam o grupo `generic`; sombras (com `parent`) herdam o grupo do pai. Ver [seção 15](#15-paletas-prontas-palettesjson). |
| `syncTo` | não | Slot (ou lista de slots) que recebe a mesma cor quando **este** slot é alterado. Ligação de mão única. Ver [seção 13](#13-cores-ligadas-syncto). |

**Regras importantes:**

- **Cor padrão do slot** = a `key` da **primeira** vez que o slot aparece (lida na ordem dos arquivos). Se duas peças usam o mesmo slot com `key` diferentes, vale a primeira. Mantenha o mesmo `key` ao compartilhar slots.
- **`parent` por slot é global:** se o mesmo slot tiver `parent` diferente em peças distintas, vale o último lido. Mantenha consistente. O manifest avisa quando encontra esse conflito.
- **Cuidado com a numeração de slots em peças esquerda/direita.** Se usar `_1` para o olho esquerdo e `_2` para o direito, não reutilize `_2` como "segunda sombra" do esquerdo (ex.: `iris_sombra_2` já é a sombra do olho **direito**). Para uma segunda sombra do esquerdo use outro nome, como `iris_sombra_1b`, e ligue-a a `iris_sombra_2b` no direito.
- Um `syncTo` não deve apontar para um slot da **mesma peça** (o manifest avisa).
- Todas as camadas e variações de uma peça compartilham **a mesma `palette`**.
- O recolor só afeta pixels cuja cor seja **exatamente** uma `key`. Qualquer outra cor (contornos, detalhes fixos) permanece como está.

### Requisitos dos PNGs

- Fundo transparente.
- **Sem anti-aliasing** e com as cores-chave exatas (um tom ligeiramente diferente não será recolorido).
- Pixels totalmente transparentes (alpha 0) são ignorados. Pixels com alpha parcial e cor exata são recoloridos mantendo o alpha original.
- Tamanho exatamente igual ao definido em `sizes.json` para o tipo.

---

## 8. Resolução dos arquivos de imagem (`src`)

O app **não monta nomes de arquivo sozinho** quando o `src` está declarado. Os caminhos são **relativos a `public/assets/`** e você escolhe nomes e pastas livremente.

### Formas de `src[tipo]`

```json
"src": {
  "portrait":  "portrait/hair/curto.png",
  "overworld": { "body_slim": "overworld/arms/slim.png", "*": "overworld/arms/padrao.png" },
  "battle":    "battle/hair/curto.png"
}
```

| Valor de `src[tipo]` | Resultado |
|---|---|
| **string** | Esse arquivo, para qualquer corpo. |
| **mapa** `{ idDoCorpo: caminho }` | Usa a entrada do corpo equipado (ver `variantAs`); se não houver, usa a entrada `"*"` (curinga). Sem nenhuma das duas → camada vazia. |
| **`""`** (texto vazio) | **Camada vazia**, sem aviso. Use para um tipo que ainda não existe (ex.: `"overworld": ""`). |
| **chave ausente** | Cai na **convenção antiga** (ver abaixo). Se o arquivo não existir → camada vazia com aviso no console. |

### Onde fica o `src`

- **Peça sem `layers`:** `src` na própria peça.
- **Peça com `layers`:** `src` dentro de **cada camada**. O `src` da peça é ignorado quando há `layers`.

### Convenção antiga (fallback)

Só é usada para os tipos em que o `src` **não** foi declarado:

```
{tipo}/{folder ?? categoria}/{id}[_{camada}][__{idDoCorpo}].png
```

| Peça tem... | Arquivo |
|---|---|
| nada | `hair_01.png` |
| só `layers` | `hair_02_back.png` |
| só `variants` | `outfit_01__body_01.png` |
| os dois | `arms_1_back__body_slim.png` |

Com o campo legado `sprites`, o `{id}` e o `{idDoCorpo}` dessa convenção são trocados pelos ids indicados. Quando todas as peças tiverem `src`, esse fallback pode ser removido.

### Camadas vazias (sem placeholder)

Uma camada **sem imagem** simplesmente não é desenhada. O app não preenche mais nada no lugar (os antigos blocos coloridos de teste foram removidos).

| Situação | Resultado |
|---|---|
| `src.<tipo>` é `""` | Camada vazia, **sem aviso**. |
| Mapa sem entrada para o corpo e sem `"*"` | Camada vazia (o manifest avisa ao carregar). |
| Chave do tipo **ausente** no `src` | Tenta a convenção antiga; se o arquivo não existir, camada vazia com aviso no console. |
| Caminho preenchido, mas o arquivo não existe | Camada vazia, com aviso no console mostrando a URL esperada. |

Uma peça com um tipo vazio continua aparecendo na lista e funcionando nos outros tipos. Ex.: com `"overworld": ""` ela aparece no portrait, e o overworld fica sem a peça.

---

## 9. Camadas (`layers`) e ordem de empilhamento

Uma peça pode ter várias camadas. Exemplo: cabelo com parte de trás (atrás do corpo) e parte da frente.

```json
{
  "id": "hair_02", "category": "hair", "name": "Cabelo 2",
  "layers": [
    { "name": "back", "zIndex": 5,
      "src": { "portrait": "portrait/hair/h2_tras.png",   "overworld": "overworld/hair/h2_tras.png",   "battle": "battle/hair/h2_tras.png" } },
    { "name": "front",
      "src": { "portrait": "portrait/hair/h2_frente.png", "overworld": "overworld/hair/h2_frente.png", "battle": "battle/hair/h2_frente.png" } }
  ],
  "palette": [ ... ]
}
```

| Atributo da camada | Significado |
|---|---|
| `name` | Nome da camada (usado na convenção antiga de nomes e em mensagens de aviso). |
| `zIndex` | Altura da camada. Se omitido, usa o `zIndex` da categoria. |
| `src` | Caminhos dos PNGs desta camada (mesmas formas da [seção 8](#8-resolução-dos-arquivos-de-imagem-src)). |

### Regra de ordenação

Todas as camadas de todas as peças equipadas entram numa lista única, ordenada por:

1. `z` (menor = mais atrás). Em **categorias múltiplas**, `z = zIndex da camada + posição na lista × 0,01`, então o último item da lista fica na frente dos anteriores, mas sem passar de camadas com `zIndex` bem diferente.
2. Em empate, a ordem da categoria em `categories.json`.

No exemplo acima: corpo (z 10) → cabelo `back` (z 5) fica **atrás** do corpo; cabelo `front` (z 30, da categoria) fica **na frente**.

### Reordenar em categorias múltiplas

Na aba de uma categoria com `multiple`, a **lista de camadas** mostra os itens equipados: o **topo da lista é o que fica na frente**. Reordene arrastando a linha ou com as setas (▲ traz para frente, ▼ envia para trás). O X remove o item. A ordem entra no JSON salvo e na exportação.

---

## 10. Categorias dependentes (`dependsOn` + `variants`)

Use quando uma peça precisa de **uma imagem diferente para cada corpo** (ex.: roupa, braços). Na lista aparece **uma peça só** (ex.: "Roupa 1"), mas o PNG muda conforme o corpo.

### Três peças de configuração

| Onde | Campo | Significado |
|---|---|---|
| `categories.json` | `"dependsOn": "body"` | A categoria depende da categoria `body`. |
| Peça | `"variants": ["body_slim", "body_normal"]` | `id`s dos corpos com os quais esta peça funciona. |
| Peça | `src` com **mapa** por corpo | Qual PNG usar para cada corpo (ver [seção 8](#8-resolução-dos-arquivos-de-imagem-src)). |

### Comportamento

- A aba da categoria lista **apenas** as peças cujo `variants` inclui o corpo equipado.
- Trocar o corpo troca os PNGs das peças dependentes automaticamente, sem reselecionar.
- Se a peça equipada **não** existe para o novo corpo, ela é **removida** da seleção (ação `prune`).
- Peça sem `variants` é **universal**: aparece para qualquer corpo e usa um único PNG.
- `variants` em uma categoria sem `dependsOn` é **ignorado** (aviso no console).
- Desfazer (`Ctrl+Z`) restaura o corpo e as peças removidas juntos.

### Exemplo completo

`categories.json`:

```json
[
  { "id": "body", "label": "Corpo",  "zIndex": 10, "required": true },
  { "id": "arms", "label": "Braços", "zIndex": 15, "dependsOn": "body" }
]
```

`assets/arms.json`:

```json
[
  {
    "id": "arms_masc_1", "category": "arms", "name": "Braços masc. 1",
    "variants": ["body_masc_slim", "body_masc_normal"],
    "layers": [
      {
        "name": "back", "zIndex": 5,
        "src": {
          "portrait": {
            "body_masc_slim":   "portrait/arms/arms_masc_1_back__body_masc_slim.png",
            "body_masc_normal": "portrait/arms/qualquer_nome_back.png"
          },
          "overworld": { "*": "overworld/arms/ow_arms_back.png" },
          "battle":    { "*": "battle/arms/bt_arms_back.png" }
        }
      },
      {
        "name": "front",
        "src": {
          "portrait": {
            "body_masc_slim":   "portrait/arms/arms_masc_1_front__body_masc_slim.png",
            "body_masc_normal": "portrait/arms/outro_nome_front.png"
          },
          "overworld": { "*": "overworld/arms/ow_arms_front.png" },
          "battle":    { "*": "battle/arms/bt_arms_front.png" }
        }
      }
    ],
    "palette": [
      { "key": "#eeeeee", "slot": "pele", "label": "Pele", "preset": { "group": "skin", "id": 1 } },
      { "key": "#cbcbcb", "slot": "pele_sombra_1", "label": "Pele (sombra 1)", "parent": "pele", "preset": { "group": "skin", "id": 2 } }
    ]
  }
]
```

### Regras e cuidados

- A categoria da qual se depende (`dependsOn`) deve vir **antes** em `categories.json`.
- A categoria referenciada deve ser de **escolha única**. Se ela for `multiple`, a variação não é resolvida corretamente.
- **Não use `dependsOn` em categorias com `required: true`.** O `prune` pode esvaziar a categoria e deixá-la sem peça.
- Os `id`s em `variants` e nas chaves do mapa devem ser **exatamente** os `id`s das peças de corpo (não os nomes).
- O mapa de `src` deve cobrir **todos** os corpos de `variants` (ou ter `"*"`). Faltando algum, o manifest avisa.
- Uma categoria pode depender de outra que não seja o corpo (ex.: acessório que depende do cabelo), desde que a ordem das categorias seja respeitada.

---

## 11. Reaproveitar sprites entre corpos e entre tipos

### Vários corpos do portrait compartilhando um overworld/battle (`variantAs`)

Se os corpos 1, 2 e 3 têm portraits diferentes mas o mesmo sprite de mapa, aponte os `src` do overworld/battle para o mesmo PNG **e** use `variantAs` para que as peças dependentes (braços, roupas) os tratem como um único corpo nesses tipos:

```json
{
  "id": "body_masc_normal", "category": "body", "name": "Masculino - Normal",
  "variantAs": { "overworld": "body_masc_slim", "battle": "body_masc_slim" },
  "src": {
    "portrait":  "portrait/body/normal.png",
    "overworld": "overworld/body/slim.png",
    "battle":    "battle/body/slim.png"
  },
  "palette": [ ... ]
}
```

Efeito: com `body_masc_normal` equipado, as peças dependentes buscam, no overworld e no battle, a entrada `body_masc_slim` do mapa (ou `"*"`). Você desenha **um** overworld de braços por tipo de sprite, e não um por corpo do portrait.

Alternativa sem `variantAs`: usar o curinga `"*"` nos mapas de `src`.

### Duas peças usando o mesmo PNG

Sem problema: basta apontar o `src` das duas para o mesmo arquivo. Cada peça usa a **própria** `palette`, então as cores independem do arquivo. Se o PNG compartilhado usa cores-chave diferentes das da peça, use `keys` por tipo na `palette`.

### Portrait compartilhado entre vários overworlds

O inverso funciona do mesmo jeito: vários overworlds (peças diferentes) apontando o `src.portrait` para o mesmo arquivo.

---

## 12. Peças pareadas (`pairs`)

Ao **equipar** uma peça X, o app equipa automaticamente peças de **outras categorias** definidas em `pairs`. A ligação é de **mão única**: escolher uma peça Y nunca altera X.

Exemplo: olho esquerdo equipa o direito correspondente.

`categories.json`:

```json
{ "id": "eye_left",  "label": "Olho esquerdo", "zIndex": 25 },
{ "id": "eye_right", "label": "Olho direito",  "zIndex": 25 }
```

`assets/eye_left.json`:

```json
{
  "id": "eye_left_3", "category": "eye_left", "name": "Olho E 3",
  "pairs": { "eye_right": "eye_right_3" },
  "src": { ... },
  "palette": [ ... ]
}
```

`assets/eye_right.json` (sem `pairs`, então o direito não altera o esquerdo):

```json
{ "id": "eye_right_3", "category": "eye_right", "name": "Olho D 3", "src": { ... }, "palette": [ ... ] }
```

### Formato

`"pairs": { "idDaCategoriaAlvo": "idDaPeçaAlvo", ... }`. Aceita várias categorias: `{ "eye_right": "eye_right_3", "eyebrow_right": "brow_right_2" }`.

### Comportamento

- Roda **somente ao equipar** (não ao remover). "Nenhum" no olho esquerdo não remove o direito.
- Em categoria **única**, substitui a peça atual da categoria alvo. Em categoria **múltipla**, adiciona se ainda não estiver equipada.
- **Sem cascata:** os `pairs` da peça alvo só valem quando **você** a escolhe diretamente (evita laços infinitos).
- Vale no clique, no botão **Aleatório** e na miniatura (a miniatura da peça X já mostra o par).
- **Não** vale ao **carregar um JSON** salvo: o arquivo já guarda o estado exato, inclusive olhos diferentes.
- Tudo vira **um único passo** do desfazer.
- Se a peça alvo não tem variante para o corpo atual, ela é removida pelo `prune`.
- O alvo precisa existir e pertencer à categoria indicada (o manifest avisa se não).
- Não existe espelhamento automático de imagem: o olho direito precisa ter o próprio PNG (pode apontar para qualquer arquivo).

---

## 13. Cores ligadas (`syncTo`)

Ao mudar a cor de um slot de origem, o app copia a cor para outros slots. Também é de **mão única**: mudar a cor do slot de destino não altera a origem.

Exemplo: cor do olho esquerdo acompanha o direito.

`assets/eye_left.json`:

```json
"palette": [
  { "key": "#3a7bd5", "slot": "olho_e", "label": "Olho", "syncTo": "olho_d" },
  { "key": "#2a5ba5", "slot": "olho_e_sombra", "label": "Olho (sombra)", "parent": "olho_e", "syncTo": "olho_d_sombra" }
]
```

`assets/eye_right.json` (sem `syncTo`):

```json
"palette": [
  { "key": "#3a7bd5", "slot": "olho_d", "label": "Olho" },
  { "key": "#2a5ba5", "slot": "olho_d_sombra", "label": "Olho (sombra)", "parent": "olho_d" }
]
```

### Regras

- Os slots de origem e destino precisam ser **diferentes**. Com o mesmo slot a ligação seria de mão dupla.
- `syncTo` aceita um slot ou uma lista: `"syncTo": ["olho_d", "olho_extra"]`.
- Dispara em: mudar a cor (roda, HEX, RGB, amostras), **aplicar um preset** e **Aleatório**.
- **Sem cascata:** se o destino também tiver `syncTo`, isso só vale quando o destino for alterado diretamente.
- Uma cor definida **explicitamente** na mesma operação nunca é sobrescrita pela ligação.
- Se o destino for uma **sombra**, ela é destravada para receber a cor copiada. Se a sombra de origem estiver travada (automática), nada é copiado: a sombra de destino segue o pai dela.
- Mudar a cor do destino depois a mantém; mudar a origem de novo sobrescreve.
- Se o destino ainda não está equipado, a cor fica guardada no slot e aparece quando a peça for equipada.
- **Não dispara** em: restaurar cor (reset), alternar cadeado e carregar JSON.
- Tudo vira **um único passo** do desfazer.

---

## 14. Sistema de cores: sombras, cadeado e recolor

### Recolor

1. Ao carregar um PNG, o app lê os pixels **uma vez** e cria um mapa pixel → índice da paleta (cache por peça + camada + caminho + tipo).
2. A cada mudança de cor, só substitui os pixels mapeados pelas cores atuais. É rápido o suficiente para atualizar em tempo real enquanto você arrasta a roda.
3. Se você trocar um PNG por outro com o app aberto, recarregue a página (Ctrl+F5) para limpar o cache.

### Sombras automáticas (cadeado)

Um slot com `parent` é uma sombra. Estados:

| Estado | Cadeado | Comportamento |
|---|---|---|
| **Automática** | fechado | A cor é calculada a partir da cor do pai. Roda, HEX, RGB e amostras ficam desativados. |
| **Manual** | aberto | A cor é livre. Começa na cor que a sombra já tinha. |

Clicar no cadeado alterna entre os estados. Voltar ao automático apaga a cor manual.

**Como a sombra automática é calculada:** o app preserva a *intenção do artista*, mantendo a mesma diferença que existe entre a cor do pai e a da sombra no PNG original.

- Se o pai está na cor original → a sombra usa exatamente a cor original dela.
- Caso contrário → pega a cor atual do pai em HSL e soma as diferenças originais (matiz em ciclo; saturação e luminosidade somadas e limitadas a 0–100).
- **Cores quase cinzas (acromáticas):** se o pai **ou** a sombra originais têm saturação menor que 8%, o matiz delas não é confiável (um cinza com leve tom azulado tem "matiz 240" mesmo parecendo cinza). Nesse caso a diferença de matiz é **ignorada** e a sombra usa o mesmo matiz do pai. Isso evita, por exemplo, uma esclera branca (`#f5f5f5`) com sombra levemente azulada (`#c9c9cc`) virar uma sombra de outra cor quando a esclera é pintada.

Funciona em **cadeia** (sombra 2 com `parent` = sombra 1 = sombra do pele). Uma sombra pode ter quantos irmãos quiser (`sombra`, `sombra_escura`...).

> Se a cor principal ficar quase preta, a sombra pode ficar igual a ela, porque a luminosidade não passa de 0.

### Painel de cores

- Mostra **somente** as cores das peças equipadas na **categoria da aba aberta** (no cabelo, só cores do cabelo).
- Em categorias múltiplas, as cores aparecem **agrupadas por peça**.
- Slots repetidos entre peças da mesma categoria aparecem uma vez.
- Sombras aparecem recuadas, com o cadeado ao lado.
- **Restaurar cor original** (no seletor) restaura o slot ativo. **Restaurar cores de {categoria}** restaura todos os slots listados. Ambos também travam sombras de volta ao automático.

### Seletor de cor

Roda de cor (matiz/saturação), slider de brilho, campo **HEX** e campos **R, G, B**. Todos sincronizados. Arrastar o seletor vira um único passo do desfazer.

---

## 15. Paletas prontas (`palettes.json`)

Conjuntos de cores aplicados com um clique. Um preset define a cor principal **e** as sombras de uma vez.

```json
{
  "skin": {
    "label": "Tons de pele",
    "global": true,
    "palettes": [
      { "name": "Porcelana", "colors": { "1": "#ffead3", "2": "#f3bf9f", "3": "#da916f" } },
      { "name": "Ébano",     "colors": { "1": "#5c3a21", "2": "#452814", "3": "#301a0c" } }
    ]
  },
  "generic": {
    "label": "Cores",
    "palettes": [
      { "name": "Vermelho", "colors": { "1": "#e03c3c" } }
    ]
  }
}
```

| Atributo | Significado |
|---|---|
| Chave do grupo (`skin`, `hair`...) | Nome do grupo, referenciado em `preset.group` na `palette` da peça. |
| `label` | Título mostrado acima das amostras. |
| `global` | `true` = o preset vale para **todas** as entradas do grupo em **todas as peças do projeto**, equipadas ou não (ex.: pele do corpo, braços e rosto juntos; cabelo com e sem brilho). Sem isso, vale só para a **família** do slot selecionado (também em qualquer peça). **Família** = o slot raiz (sem `parent`) e todas as suas sombras. Slots avulsos (sem `parent`) só são atingidos em grupos `global`. |
| `palettes[].name` | Nome do preset (aparece embaixo da amostra e na dica). |
| `palettes[].colors` | Mapa `id → HEX` (sempre `#` + 6 dígitos). Os ids casam com `preset.id` das entradas da `palette` das peças. Um `#` esquecido é corrigido ao aplicar, mas corrija o arquivo. |

### Como o preset é aplicado

- Cada entrada da `palette` aponta `{ "group": "skin", "id": 2 }`. Ao clicar em "Porcelana", o slot cujo `preset.id` é 1 recebe `#ffead3`, o de id 2 recebe `#f3bf9f`, e assim por diante.
- **Sombras** que o preset define são aplicadas e **destravadas** (cor manual). Se o preset **não** define o id de uma sombra, ela continua **automática**.
- Preset com menos ids do que a peça tem cores é válido: as cores não cobertas ficam como estão.
- **Grupos não globais afetam só a família do slot ativo.** Ex.: esclera, linha da íris e linha do olho não têm `preset` e caem no grupo `generic` (id 1). Escolher um preset genérico com a **esclera** selecionada colore apenas a esclera e as sombras dela, e não as linhas, mesmo que elas também sejam do grupo `generic`.
- **Aplicar um preset preenche também slots de peças não equipadas.** Ex.: o grupo `hair` tem `cabelo_brilho` (id 1) só em alguns cabelos. Ao escolher "Ruivo" com um cabelo **sem** brilho equipado, a cor do brilho também é definida. Ao trocar depois para um cabelo **com** brilho, ele já aparece na cor do preset. Como slots são globais, guardar a cor de um slot que ainda não está em uso não tem efeito colateral.
- O **destaque** do preset ativo considera só os slots das peças equipadas.
- Todo grupo usado em `preset.group` precisa existir em `palettes.json`. Se não existir (ex.: `eyes`), as amostras simplesmente não aparecem para aquela cor.
- O grupo de um slot é o do seu `preset`. Se o slot não tem, sobe pelos `parent` até achar um grupo.
- As amostras aparecem nas cores principais e nas sombras **destravadas**. Ficam escondidas em sombras automáticas.
- A amostra mostra todas as cores do conjunto em faixa. O preset fica **destacado** quando todas as cores que ele define coincidem com o estado atual.
- Aplicar um preset é **um único passo** do desfazer e respeita `syncTo`.
- Uma peça pode ter cores de grupos diferentes (ex.: cinto `metal` numa roupa `clothes`).
- Editar o `palettes.json` atualiza o app sozinho (hot reload).

---

## 16. Comportamento da interface

### Telas e navegação

O app usa `HashRouter` (`createHashRouter`), então funciona em hospedagem estática (GitHub Pages etc.) sem configuração de servidor. As rotas ficam em `src/router.jsx`:

| Rota | Tela |
|---|---|
| `/` | **Tela inicial** (`HomeScreen`): menu com as ferramentas. Hoje só "Criador de Avatar". |
| `/avatar` | **Criador de avatar** (`AvatarScreen`). |
| `*` (qualquer outra) | Redireciona para `/`. |

Endereços reais: `https://seusite/#/` e `https://seusite/#/avatar`.

- O estado do personagem (peças, cores, histórico, FPS, modos de visualização) mora no Zustand, **fora das telas**. Sair para a tela inicial e voltar mantém o personagem.
- A tela inicial é montada a partir da lista `TOOLS` em `HomeScreen.jsx`. Para adicionar uma ferramenta, acrescente um item (`to`, `title`, `desc`, `Icon`) e uma rota em `router.jsx`.
- O botão **Créditos** aparece nas duas telas.
- No criador, o botão de seta (canto superior esquerdo) volta para a tela inicial.

### Layout

**Desktop (largura ≥ 1100px):** três colunas: **peças** (esquerda), **portrait + sprites** (centro), **cores + exportação** (direita). As colunas laterais rolam por dentro; o centro foi pensado para caber sem rolar a página.

**Mobile e tablet (largura < 1100px):** layout vertical.

- Uma faixa de **preview fixa no topo** (portrait à esquerda; overworld e battle empilhados à direita), sempre visível enquanto você escolhe.
- Abaixo dela, **abas**: **Peças**, **Cores** e **Exportar**. O conteúdo da aba rola com a página.
- Os cards de preview ficam compactos: o modo (Animado/Estático/Bruto) vira um seletor e o FPS aparece ao lado.
- As escalas do portrait e dos sprites são inteiras e calculadas para caber na largura e na altura da janela (mínimo 1x).
- Os botões da barra de ferramentas mostram só ícones em telas estreitas (< 700px).
- O botão **Créditos** fica no final da aba Exportar.
- Em celular deitado (altura < 560px) a faixa de preview deixa de ser fixa, para não ocupar a tela toda.
- **Toque:** a roda de cor e o slider não rolam a página. Arrastar camadas pelo mouse (drag and drop) **não funciona no toque**: use as setas ▲▼ da lista de camadas.
- Os campos de texto e seletores usam 16px no mobile, para o iPhone não ampliar a página ao focar.

### Preview

Cada tipo (portrait, overworld, battle) tem um card de preview.

- **Tipo com `frame` no `sizes.json`** (hoje overworld e battle): três modos no card.
  - **Animado:** toca a sequência de quadros. No overworld, as 4 direções caminham lado a lado (Baixo, Esquerda, Direita, Cima).
  - **Estático:** mostra só um quadro, parado: a coluna `staticFrame` (padrão: a primeira). No overworld, mostra essa coluna das 4 direções lado a lado.
  - **Bruto:** a sheet completa, sem recorte.
- **Tipo sem `frame`** (hoje o portrait): mostra só a imagem. Os botões de modo e o seletor de FPS não aparecem.
- O **portrait** é ampliado por **fator inteiro** (o maior entre 2x e 6x que cabe na janela), sempre nítido; o fator aparece no card. Se ganhar `frame`, a conta usa o tamanho de um quadro.
- A animação não reinicia ao mudar uma cor nem ao trocar o FPS.
- **Abrir ou salvar a imagem do preview:** clique com o **botão direito** (ou **segure o dedo**, no celular) sobre o preview e escolha "Abrir imagem em nova guia" ou "Salvar imagem". O arquivo é gerado em tamanho ampliado (pelo menos a escala do preview e ~384px no maior lado), sem suavização. O que abre depende do modo: **Animado** → GIF animado (com o FPS escolhido); **Estático** → PNG do quadro parado; **Bruto** ou tipo sem `frame` → PNG da imagem. A imagem é gerada ~0,3 s depois da última alteração; nesse intervalo, o botão direito ainda abre a versão anterior.

### Velocidade (FPS) das animações

No modo **Animado**, o card mostra o seletor **Velocidade** (1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20 e 24 FPS). A opção padrão do tipo aparece marcada com "(padrão)".

- **Velocidade padrão:** `fps` do tipo em `sizes.json` (sem `fps`, vale 6).
- **Opções do seletor:** lista `FPS_OPTIONS` em `src/lib/anim.js`. O valor padrão do tipo é incluído automaticamente, mesmo que não esteja na lista.
- O FPS escolhido vale também para os **GIFs exportados** (e para o `.zip`). Cada tipo tem o seu FPS.
- O FPS **não** entra no histórico (desfazer) nem no `personagem.json`; volta ao padrão ao recarregar a página.
- **Sequência e quadro estático:** `sequence` e `staticFrame` em `sizes.json` (ver [seção 4](#4-tamanhos-dos-sprites-sizesjson)).

### Seleção de categoria

Dropdown próprio. Mostra um **contador** de itens equipados por categoria, tem **busca** quando há mais de 8 categorias, e fecha com `Esc` ou clicando fora.

### Grade de peças

Miniaturas de 64px. Se a peça tem `thumbnail`, a miniatura é essa imagem, recolorida com as cores atuais da peça. Sem `thumbnail`, é o **portrait** com aquela peça equipada (e o par aplicado), respeitando o `thumb` da categoria. Se o portrait tem quadros (`frame` no `sizes.json`), a miniatura usa **um quadro só**: o do modo Estático (`staticFrame`, padrão: o primeiro), não a sheet inteira. Categorias únicas não obrigatórias têm o botão "Nenhum". Categorias múltiplas têm "Remover todos" e clicar em uma peça liga/desliga.

### Barra de ferramentas

| Botão | Ação |
|---|---|
| Desfazer / Refazer | `Ctrl+Z` e `Ctrl+Y` (ou `Ctrl+Shift+Z`). Ignora atalhos quando o foco está em um campo de texto. |
| Aleatório | Sorteia peças e cores (ver abaixo). |
| Salvar | Baixa `personagem.json`. |
| Carregar | Lê um `personagem.json`. |

### Histórico (desfazer/refazer)

- Guarda até **50 passos** de: peças escolhidas, cores e sombras destravadas.
- Alterações rápidas na **mesma cor** (arrastar o seletor, em até 600 ms) são agrupadas em um passo.
- Escolher peça (com pares/`prune`), aplicar preset, aleatório, carregar e restaurar cores são um passo cada.
- Qualquer nova ação limpa o "refazer".
- Aba ativa, slot ativo e modo de visualização (animado/bruto) **não** entram no histórico.

### Aleatório

- **Categorias únicas:** sorteia uma peça compatível com o que já foi sorteado (respeita `variants`). Categorias não obrigatórias têm 15% de chance de ficar vazias.
- **Categorias múltiplas:** sorteia de 0 a 3 peças.
- Aplica `pairs` e `prune`.
- **Cores:** sorteadas segundo as regras do `src/data/random.json` (ver abaixo). O sorteio é um passo do desfazer.

### Sorteio de cores (`random.json`)

O sorteio decide **uma cor por "família"**: o slot principal (sem `parent`) e as sombras dele. Para cada família equipada, o app procura uma regra nesta ordem:

| Prioridade | Regra | Resultado |
|---|---|---|
| 1 | `slots.<slot>: false` | **Fixa**: mantém a cor que está agora (não sorteia). |
| 2 | `slots.<slot>.colors: ["#...", ...]` | Sorteia **uma cor** dessa lista para o slot principal. As sombras ficam automáticas. |
| 3 | Grupo de paleta (`slots.<slot>.group`, ou o `preset.group` declarado na peça) | Sorteia um **preset completo** do grupo: cor principal e sombras de uma vez, usando o `id` de cada cor. Sombras definidas pelo preset ficam destravadas. |
| 4 | Nenhuma das anteriores | **Cor livre** em HSL, dentro de `default.hsl` (ou `slots.<slot>.hsl`). Sombras automáticas. |

```json
{
  "default": { "hsl": { "h": [0, 360], "s": [40, 90], "l": [30, 65] } },
  "groups": {
    "hair": { "only": ["Preto", "Castanho", "Loiro", "Ruivo"] },
    "skin": { "exclude": ["Ébano"] }
  },
  "slots": {
    "iris_1": { "group": "eyes", "only": ["Preto", "Castanho", "Verde", "Azul"] },
    "bolsa":  { "colors": ["#8b5a2b", "#222222"] },
    "chapeu": { "hsl": { "s": [60, 100], "l": [40, 60] } },
    "esclera_1": false,
    "linha_olho_1": false
  }
}
```

| Campo | Significado |
|---|---|
| `default.hsl` | Faixas `[mín, máx]` de `h` (0–360), `s` e `l` (0–100) da cor livre. Campos omitidos usam o padrão (h 0–360, s 40–90, l 30–65). |
| `groups.<grupo>.only` | Só sorteia presets desse grupo cujo **nome** está na lista (sem diferenciar maiúsculas). |
| `groups.<grupo>.exclude` | Nunca sorteia os presets com esses nomes. |
| `slots.<slot>` | Regra para um slot **principal**. Valor `false` = fixa. Objeto aceita `group`, `only`, `exclude`, `colors` e `hsl`. |
| `slots.<slot>.group` | Usa as paletas de **outro** grupo para esse slot. O `id` de cada cor da peça escolhe a cor do preset. |
| `slots.<slot>.only` / `exclude` | Restringem os presets do grupo só para este slot. |

Detalhes:

- **Grupos `global`** (ex.: pele, cabelo) sorteiam **um preset para o grupo todo**, para manter tudo coerente (corpo, braços e rosto na mesma pele). Nesses grupos, restrinja por `groups.<grupo>`; `only`/`exclude` dentro de `slots` não valem.
- **Grupos não globais** (ex.: olhos) sorteiam um preset por família.
- Sem regra, uma cor que declara `preset` sorteia dos presets do grupo dela. Uma cor sem `preset` cai na cor livre (HSL).
- **Espelhos (`syncTo`):** um slot que recebe a cor de outro por `syncTo` não é sorteado: copia a da origem (olhos iguais).
- Regras em sombras (slots com `parent`) são ignoradas; configure o slot principal.
- O arquivo é validado ao carregar: slot inexistente, grupo inexistente e nomes de preset que não existem geram avisos `[random]` no console.

### Créditos

Um botão **Créditos** fica fixo no canto inferior esquerdo da tela. Ao clicar, abre um modal com a lista de créditos de quem criou os assets usados. Fecha com o **X**, com `Esc` ou clicando fora do modal. A lista vem de `src/data/credits.json`:

```json
[
  { "name": "Fields of Mistria Picrew", "by": "not_darkly", "link": "https://picrew.me/en/image_maker/2750165" },
  { "name": "One More Multiverse", "by": "Multiverse, Inc.", "link": "https://www.playmultiverse.com", "note": "Opcional: o que foi usado" }
]
```

| Campo | Obrigatório | Significado |
|---|---|---|
| `name` | sim | Nome da obra/fonte dos assets. |
| `by` | sim | Autor ou empresa. |
| `link` | não | Endereço. Abre em nova aba. Também serve de chave da lista (use links diferentes). |
| `note` | não | Observação curta exibida abaixo (ex.: quais assets vieram dali, licença). |

### Salvar e carregar

Formato de `personagem.json`:

```json
{
  "version": 1,
  "selected": { "body": "body_01", "outfit": null, "hair": "hair_02", "accessory": ["acc_01", "acc_03"] },
  "colors": { "pele": "#ffe0bd", "cabelo": "#b5502b" },
  "unlocked": { "cabelo_sombra": true }
}
```

- `selected`: categorias únicas guardam um id (ou `null`); múltiplas guardam um array, na ordem fundo → frente.
- `colors`: só os slots alterados.
- `unlocked`: sombras destravadas.

Ao carregar, o app **valida** tudo: ignora ids inexistentes, categorias erradas, cores que não são HEX de 6 dígitos e `unlocked` de slots que não são sombras; remove peças incompatíveis com o corpo (`prune`). **Não** aplica `pairs` nem `syncTo`, porque o arquivo já guarda o estado exato. Carregar é um passo do desfazer.

---

## 17. Exportação

### Imagens

Seletor de formato (**PNG**, WebP, JPEG) e escala (**1x, 2x, 3x, 4x, 6x, 8x, 10x, 12x**). A ampliação é sempre por fator inteiro, sem suavização. JPEG não tem transparência, então usa fundo branco.

| Botão | Arquivo |
|---|---|
| Portrait | `portrait.png` |
| Overworld | `overworld_sheet.png` (sheet completa) |
| Battle | `battle_sheet.png` (sheet completa) |
| Frames OW | `overworld_frames.zip` com 12 imagens: `baixo_1` … `cima_3` |
| Frames Battle | `battle_frames.zip` com 6 imagens: `frame_1` … `frame_6` |

Os botões de **frames** e de **GIF** só aparecem para tipos que têm `frame` no `sizes.json`. O portrait sem `frame` é exportado como uma imagem única (`portrait.png`); com `frame`, vira `portrait_sheet.png`, com `portrait_frames.zip` e `portrait.gif`.

### GIF animado

- Seletor de escala próprio (**1x a 10x**) com o tamanho final em pixels mostrado abaixo.
- **Overworld:** 4 direções lado a lado, ou uma direção só (baixo, esquerda, direita, cima). Arquivos: `overworld.gif` ou `overworld_baixo.gif` etc.
- **Battle:** `battle.gif` (6 frames).
- Usa a `sequence` do `sizes.json` e o **FPS escolhido** no card do sprite (o padrão vem do `fps` do `sizes.json`).
- O GIF guarda o tempo de cada quadro em centésimos de segundo, então o FPS real é aproximado (ex.: 12 FPS vira 12,5 e 15 FPS vira 14,3). Acima de 24 FPS os navegadores podem desacelerar o GIF.
- Transparência de 1 bit: pixels com alpha menor que 50% somem. Para pixel art sem anti-aliasing não muda nada.
- A paleta do GIF é montada a partir das cores reais dos quadros (até 255 cores + transparente). Acima disso, usa a cor mais próxima.

### Baixar tudo (.zip)

`avatar.zip` contém:

```
portrait.png
overworld_sheet.png
battle_sheet.png
overworld.gif
battle.gif
overworld_frames/   (12 imagens)
battle_frames/      (6 imagens)
personagem.json
```

As imagens usam a escala e o formato selecionados em "Imagens"; os GIFs usam a escala de "GIF animado".

---

## 18. Receitas: como adicionar coisas novas

### 18.1 Adicionar uma peça simples

1. Pinte os 3 PNGs (portrait, overworld, battle) com cores-chave exatas, fundo transparente, nos tamanhos de `sizes.json`.
2. Coloque-os em `public/assets/...` (qualquer nome/pasta).
3. Adicione a peça em um arquivo de `src/data/assets/` (ex.: `hair.json`):

```json
{
  "id": "hair_03", "category": "hair", "name": "Cabelo 3",
  "src": {
    "portrait":  "portrait/hair/h3.png",
    "overworld": "overworld/hair/h3.png",
    "battle":    "battle/hair/h3.png"
  },
  "palette": [
    { "key": "#8b4513", "slot": "cabelo", "label": "Cabelo", "preset": { "group": "hair", "id": 1 } },
    { "key": "#5c2e0a", "slot": "cabelo_sombra", "label": "Cabelo (sombra)", "parent": "cabelo", "preset": { "group": "hair", "id": 2 } }
  ]
}
```

4. Salve. O app recarrega sozinho. Confira o console por avisos.

> Para que um slot (ex.: `cabelo`) seja compartilhado com outras peças, use o **mesmo nome de slot e a mesma `key`**.

### 18.2 Adicionar uma peça com várias camadas

Use `layers` e coloque o `src` em cada camada (ver [seção 9](#9-camadas-layers-e-ordem-de-empilhamento)). Dê `zIndex` menor que o do corpo (ex.: 5) para a camada que fica **atrás** dele. Todas as camadas usam a mesma `palette`, então uma cor recolore a peça inteira.

### 18.3 Adicionar uma nova categoria

1. Adicione em `categories.json` (a posição define a ordem no dropdown). Se ela depender de outra, a outra precisa vir antes.
2. Crie `src/data/assets/<categoria>.json` com as peças.
3. (Opcional) Adicione `thumb` para dar zoom nas miniaturas.
4. (Opcional) Defina `multiple`, `required` ou `dependsOn` conforme a [seção 5](#5-categorias-categoriesjson).

### 18.4 Adicionar uma categoria de seleção múltipla (ex.: acessórios)

1. Em `categories.json`: `{ "id": "accessory", "label": "Acessórios", "zIndex": 40, "multiple": true }`.
2. Peças normais em `assets/accessory.json`.
3. Para dois acessórios mudarem de cor juntos, use o **mesmo slot**. Para cores independentes, slots diferentes.
4. Opcional: `thumbnail` em cada peça, para uma miniatura própria (ver 18.14).

### 18.5 Adicionar uma peça que depende do corpo (roupa, braços...)

1. Em `categories.json`, adicione `"dependsOn": "body"` na categoria (e mantenha `body` antes dela).
2. Na peça, liste os corpos em `variants`.
3. No `src` de cada tipo, use um **mapa** `idDoCorpo → arquivo` (ou `"*"` para um arquivo único).
4. Ver exemplo completo na [seção 10](#10-categorias-dependentes-dependson--variants).

### 18.6 Adicionar um corpo novo

1. Crie a peça de corpo em `assets/body.json` com `src` e `palette`.
2. Em cada peça dependente que o suporte, adicione o `id` do corpo em `variants` e inclua a entrada correspondente nos mapas de `src` (ou use `"*"`).
3. Se ele reaproveita overworld/battle de outro corpo, use `variantAs` e aponte o `src` para o mesmo PNG ([seção 11](#11-reaproveitar-sprites-entre-corpos-e-entre-tipos)).

### 18.7 Adicionar peças com par (olho esquerdo → direito)

1. Duas categorias independentes (`eye_left`, `eye_right`).
2. Em cada peça do olho esquerdo: `"pairs": { "eye_right": "<id do olho direito>" }`.
3. Peças do olho direito **sem** `pairs`.
4. Ver [seção 12](#12-peças-pareadas-pairs).

### 18.8 Fazer a cor do esquerdo acompanhar o direito

1. Slots **diferentes** em cada olho (`olho_e`, `olho_d`).
2. No olho esquerdo: `"syncTo": "olho_d"` em cada cor (e `"syncTo": "olho_d_sombra"` nas sombras).
3. No olho direito: sem `syncTo`.
4. Ver [seção 13](#13-cores-ligadas-syncto).

### 18.9 Combinar par de peça + par de cor (olhos completos)

Use as duas coisas juntas: `pairs` na peça (equipa o olho direito junto) e `syncTo` na paleta (a cor acompanha). Cada uma funciona independentemente da outra.

### 18.10 Adicionar uma paleta pronta

1. Em `palettes.json`, adicione um preset em um grupo existente (ou crie um grupo novo).
2. Use os mesmos ids (`1`, `2`, `3`...) que as peças apontam em `preset.id`.
3. Para um grupo novo, aponte as cores das peças com `"preset": { "group": "<novo>", "id": 1 }`.
4. Use `"global": true` se o preset deve valer para todas as peças que usam o grupo (como na pele).

### 18.11 Reaproveitar um PNG em várias peças

Aponte o `src` de todas para o mesmo arquivo. Se as cores-chave do PNG forem diferentes das da `palette`, use `keys` por tipo.

### 18.12 Mudar tamanhos, animações ou exportação

- Tamanhos: `sizes.json` (e redimensione os PNGs).
- Velocidade padrão (`fps`), sequência de quadros (`sequence`) e quadro estático (`staticFrame`): `sizes.json`. Opções do seletor de FPS: `FPS_OPTIONS` em `src/lib/anim.js`.
- Escalas de exportação: constantes `IMG_SCALES` e `GIF_SCALES` em `ExportBar.jsx`.
- Cores do aleatório: `src/data/random.json`.

### 18.13 Adicionar um crédito

1. Abra `src/data/credits.json`.
2. Adicione `{ "name": "...", "by": "...", "link": "https://..." }` (e `note` se quiser).
3. Salve. O modal já mostra a nova entrada.

### 18.14 Definir a miniatura de uma peça

1. Crie a imagem da miniatura (qualquer tamanho; use as **mesmas cores-chave** da `palette` se quiser que ela mude de cor).
2. Salve em `public/assets/` (ex.: `public/assets/miniatures/head/head_1.png`).
3. Na peça: `"thumbnail": "miniatures/head/head_1.png"`.
4. Para peças com `variants`, use um mapa: `"thumbnail": { "body_slim": "miniatures/arms/slim.png", "*": "miniatures/arms/padrao.png" }`.
5. Sem `thumbnail` (ou com `""`), a miniatura é o portrait.

### 18.15 Deixar um tipo de imagem vazio

Preencha o caminho com `""`. A peça aparece normalmente nos outros tipos e fica sem imagem naquele tipo, sem avisos e sem blocos de teste:

```json
"src": { "portrait": "portrait/eyes/eye_1.png", "overworld": "", "battle": "" }
```

### 18.16 Adicionar uma tela ou ferramenta nova

1. Crie `src/screens/MinhaTela.jsx` e exporte em `src/screens/index.js`.
2. Adicione a rota em `src/router.jsx` (antes da rota `*`).
3. Adicione um item na lista `TOOLS` de `HomeScreen.jsx`.

### 18.17 Peça com quantidade de quadros diferente

1. Desenhe o PNG com a quantidade de quadros que quiser, na **mesma altura** do tipo e largura = quadros × largura do quadro (ex.: 12 quadros no battle: 1152×96).
2. Aponte o `src` normalmente. Não há campo para a quantidade: ela vem da largura.
3. Equipe junto de peças com outra quantidade. A sheet combinada usa o menor múltiplo comum e as peças menores se repetem. Ver [seção 4](#4-tamanhos-dos-sprites-sizesjson).
4. Peça parada (acessório estático): PNG com **1 quadro** de largura.

### 18.18 Restringir as cores do Aleatório

1. Abra `src/data/random.json`.
2. Para limitar os presets de um grupo: `"groups": { "hair": { "only": ["Preto", "Castanho"] } }`.
3. Para um slot específico: `"slots": { "iris_1": { "group": "eyes", "only": ["Azul", "Verde"] } }`.
4. Para uma lista própria de cores: `"slots": { "bolsa": { "colors": ["#8b5a2b", "#222222"] } }`.
5. Para impedir que um slot seja sorteado: `"slots": { "linha_olho_1": false }`.
6. Ver [seção 16](#16-comportamento-da-interface), "Sorteio de cores".

---

## 19. Validações, avisos do console e solução de problemas

### Avisos do console (`[manifest]` e `[assets]`)

| Aviso | Causa |
|---|---|
| `id duplicado "X" em <arquivo> (já existe em ...)` | Duas peças com o mesmo `id`. A segunda é ignorada. Renomeie ou apague uma. |
| `usa categoria desconhecida "X"` | `category` da peça não existe em `categories.json`. |
| `dependsOn "X" não existe` | Categoria dependente aponta para categoria inexistente. |
| `categoria "X" precisa vir ANTES de "Y"` | Ordem errada em `categories.json`. |
| `tem "variants", mas a categoria não tem "dependsOn"` | `variants` será ignorado. Adicione `dependsOn` na categoria. |
| `variante "X" não existe` / `é da categoria ...` | Id em `variants` errado ou de outra categoria. |
| `variantAs.<tipo> aponta para "X", que não existe` | Id inexistente em `variantAs`. |
| `src.<tipo> não é um tipo válido` | Use `portrait`, `overworld` ou `battle`. |
| `src.<tipo> não tem arquivo para o corpo "X"` | O mapa de `src` não cobre uma variante e não tem `"*"`. |
| `pairs aponta para a própria categoria` / `usa categoria desconhecida` / `aponta para "X", que não existe` / `é da categoria ...` | Erros de configuração de `pairs`. |
| `slot "X" tem "parent" diferente em "A" e "B"` | O mesmo nome de slot foi usado com pais diferentes (ex.: `iris_sombra_2` como sombra do olho esquerdo e do direito). Renomeie um deles. |
| `slot "X": parent "Y" não existe` | O `parent` aponta para um slot que não está em nenhuma peça. |
| `"A": syncTo de "X" aponta para "Y", que é da própria peça` | Origem e destino na mesma peça. Use slots de peças diferentes. |
| `"A": syncTo de "X" aponta para "Y", que não existe em nenhuma peça` | Slot de destino inexistente (nome errado ou peça ainda não criada). |
| `arquivo não encontrado (camada vazia): <url>` | O PNG não existe nesse caminho. A URL mostra o caminho esperado, relativo a `public/`. A camada simplesmente não é desenhada. |
| `<url>: largura Npx não é múltiplo da largura do quadro (Mpx)` | O PNG de um tipo com `frame` tem largura que não fecha com os quadros. Confira o tamanho da imagem. |
| `<url>: altura Npx, esperado Mpx` / `tamanho ... esperado ...` | PNG com altura (ou tamanho, em tipos sem `frame`) diferente do `sizes.json`. |
| `[frames] quantidades de quadros (...) dão N colunas, acima do limite de 64` | Combinação de quantidades com múltiplo comum grande. Use quantidades que dividam umas às outras (6, 12, 24...). |
| `[random] slot "X" não existe` / `grupo "G" não existe` / `preset "N" não existe no grupo` | Regra do `random.json` apontando para algo inexistente. |
| `[random] "X" é uma sombra` | Regras de sorteio valem só para o slot principal (sem `parent`). |
| `"A": thumbnail deve ser um caminho (texto) ou um mapa` / `thumbnail tem a chave "X", que não é uma peça existente` | `thumbnail` com formato errado ou com chave de corpo inexistente. |

> As referências de `preset` (grupo inexistente em `palettes.json`) ainda não têm validação no manifest. Se um preset não aparece, confira o nome do grupo.

### Problemas comuns

| Sintoma | O que verificar |
|---|---|
| Uma peça **não aparece** no preview (mas está equipada) | A camada está vazia: o `src` do tipo é `""`, o arquivo não existe ou o mapa não cobre o corpo. Veja o console (`arquivo não encontrado`) e a seção 8. |
| A miniatura da peça vem em branco ou com o portrait | Com `thumbnail`: caminho errado (aviso no console) → usa o portrait. Sem `thumbnail`: é o portrait; se o portrait está vazio, a miniatura fica vazia. |
| No celular, a roda de cor rola a página | Atualize o CSS (`.picker-body { touch-action: none; }`). |
| A imagem aparece mas **não muda de cor** | A cor pintada no PNG não bate **exatamente** com a `key` (anti-aliasing, cor ligeiramente diferente, perfil de cor). |
| Parte da imagem muda e outra parte não | Pixels com cor diferente das `key` ficam fixos (esperado para contornos e detalhes). |
| A peça **não aparece** na lista | Se a categoria tem `dependsOn`: o corpo equipado está em `variants`? Confira o id exato. |
| Peça some ao trocar de corpo | Ela não tem o novo corpo em `variants` (comportamento esperado do `prune`). |
| Lista com itens **duplicados** / aviso de key repetida do React | `id` repetido nos JSONs. |
| Mudei o PNG e **não atualizou** | Cache do navegador/app: recarregue com Ctrl+F5. |
| Sombra não acompanha a cor principal | O cadeado está aberto (manual). Feche-o para voltar ao automático. |
| Sombra "estranha" | A sombra automática preserva a diferença entre as cores originais do PNG. Revise as `key` da sombra e do pai. Para cores quase cinzas (esclera, metais) o matiz é ignorado de propósito (ver seção 14). Se a sombra é de **outra cor** ao mudar a cor principal, verifique também se o nome do slot não está repetido com outro `parent` (aviso `[manifest]` no console). |
| Um preset genérico mudou **outras cores** além da selecionada | Em versões antigas, o preset valia para todas as cores do grupo. Agora vale só para a família do slot ativo (exceto grupos com `global: true`). |
| Troquei de cabelo e o **brilho** (ou outro slot extra) ficou fora da paleta escolhida | O preset só é aplicado ao clicar. Desde a v1.2 ele preenche também os slots de peças não equipadas, mas só se o grupo for `global: true` (slots avulsos) e se a entrada tiver `preset: { group, id }`. Cores ajustadas à mão (roda/HEX) continuam valendo só para o slot editado. |
| O botão **Créditos** cobre algo | Ele fica fixo no canto inferior esquerdo. Mude a posição na classe `.credits-btn` do `index.css`. |
| Preset não aparece | O slot está travado (sombra automática) ou o grupo do `preset` não existe em `palettes.json`. |
| Preset não colore uma sombra | O preset não tem esse `id`, ou a entrada da `palette` não aponta para ele. |
| Cor do olho direito não acompanha | O olho esquerdo não tem `syncTo`, os slots são o mesmo, ou a sombra de origem está travada. |
| Olho direito não é equipado junto | A peça esquerda não tem `pairs`, ou o id do alvo/categoria está errado (veja o console). |
| Imagem cortada ou deslocada | O PNG não tem o tamanho exato do tipo (`sizes.json`). |
| Os botões **Animado / Estático / Bruto** não aparecem | O tipo não tem `frame` no `sizes.json` (ou só tem um quadro). Adicione `frame` e refaça o PNG com o tamanho da sheet. |
| A animação está rápida ou lenta demais | Use o seletor **Velocidade** do card, ou mude o `fps` padrão do tipo em `sizes.json`. |
| O GIF não tem o mesmo ritmo do preview | O GIF arredonda o tempo por quadro para centésimos de segundo. Diferenças pequenas são normais, principalmente em FPS altos. |
| Aviso `sizes.<tipo>: ...` no console | Config de `sizes.json` inválida: quadro que não divide a sheet, coluna inexistente em `sequence`/`staticFrame` ou `fps` menor ou igual a 0. |
| Uma peça anima mais rápido/devagar que a outra, ou repete | Normal quando as quantidades de quadros diferem: a peça com menos quadros se repete até fechar o ciclo (menor múltiplo comum). |
| O **Bruto** ficou mais largo que antes | Alguma peça equipada tem mais colunas que o padrão; a sheet combinada cresce (ver seção 4). |
| O Aleatório pinta algo de uma cor "errada" (linha do olho, esclera) | Sem regra, cor sem `preset` cai em HSL livre. Fixe com `"slot": false` ou limite com `colors` no `random.json`. |
| Os dois olhos saem com cores diferentes no Aleatório | O espelho precisa de `syncTo` do slot principal esquerdo para o direito (ver seção 13). Slots que recebem `syncTo` não são sorteados. |
| O preview (ex.: portrait animado) aparece cortado e com quadro **quadrado** | `"frame": 120` é um quadrado 120×120. Use `"frame": { "w": 120, "h": 160 }` (largura e altura do quadro) no `sizes.json`. |
| A miniatura da peça mostra a sheet inteira do portrait | Atualize `Thumb.jsx` (v1.6): com quadros no portrait, a miniatura usa só o quadro estático. Ou defina `thumbnail` na peça. |
| O botão direito / segurar não oferece "abrir imagem" | A imagem invisível sobre o preview é gerada ~0,3 s após a última alteração; espere um instante. Se o navegador não mostrar o menu de imagem, use "Baixar tudo (.zip)" ou os botões de exportação. |
| Animação do overworld com direções trocadas | A ordem das linhas deve ser baixo, esquerda, direita, cima. Ajuste `DIR_NAMES` em `anim.js` e `LABELS` em `App.jsx` se a sua for outra. |

---

## 20. Histórico de alterações da documentação

Cada nova funcionalidade ou ajuste do sistema entra aqui, com as seções afetadas.

| Versão | Mudança | Seções |
|---|---|---|
| 1.0 | Documentação inicial cobrindo todo o sistema: tamanhos (portrait 120×160, overworld 32×32 com 3×4, battle 96×96 com 6 frames), categorias (`required`, `multiple`, `dependsOn`, `thumb`), peças (`layers`, `src`, `variants`, `variantAs`, `pairs`, `placeholder`), paleta (`key`, `keys`, `slot`, `parent`, `preset`, `syncTo`), sombras com cadeado, paletas prontas em conjunto, exportação (imagens, frames, GIF, ZIP), histórico, aleatório, salvar/carregar e solução de problemas. | todas |
| 1.1 | Modal e botão **Créditos** (`credits.json`, `CreditsModal.jsx`). Correção da sombra automática para cores quase cinzas (matiz ignorado quando a saturação original é menor que 8%). Presets de grupos não globais agora afetam só a **família** do slot ativo (slot raiz + sombras). Novos avisos do manifest: conflito de `parent` por slot, `parent` inexistente e `syncTo` para slot da própria peça ou inexistente. Dica de nomes de slot para peças esquerda/direita. | 2, 7, 14, 15, 16, 18, 19 |
| 1.2 | Presets agora são aplicados a **todas as peças do manifest**, não só às equipadas: slots que existem apenas em algumas peças (ex.: `cabelo_brilho`) recebem a cor do preset mesmo quando a peça atual não os tem. Cores de preset sem `#` são normalizadas. | 15, 19 |
| 1.3 | Modo de visualização **Estático** (um quadro parado). Os botões Animado/Estático/Bruto aparecem em qualquer tipo com `frame` no `sizes.json` (incluindo o portrait, para o futuro) e somem nos tipos sem `frame`. `frame` aceita número ou `{ w, h }`. Seletor de **FPS** por tipo, também usado nos GIFs. Config de animação (`fps`, `sequence`, `staticFrame`) movida de `anim.js` para o `sizes.json`. Exportação de frames/GIF generalizada para qualquer tipo com `frame`. Novos avisos de validação de `sizes.json`. | 2, 4, 16, 17, 18, 19 |
| 1.4 | **Miniatura própria** por peça (`thumbnail`, recolorida pela paleta; sem ele usa o portrait). **Camadas vazias**: `""` ou arquivo ausente não desenha nada; **placeholders removidos** (e o campo `placeholder`). **Layout mobile** vertical (preview fixo no topo + abas Peças/Cores/Exportar). **Tela inicial** e **rotas** com `HashRouter` (`/` e `/avatar`); `App.jsx` virou só o roteador e o criador foi para `screens/AvatarScreen.jsx`. | 1, 2, 5, 6, 8, 16, 18, 19 |
| 1.5 | Projeto renomeado para **Cosmos Maker** (nome e logo). **Quantidade de quadros por peça**: cada PNG pode ter quantidade diferente de colunas (detectada pela largura); a sheet combinada usa o menor múltiplo comum e peças menores se repetem; avisos de tamanho. **Aleatório de cores configurável** (`random.json`): cor fixa, lista de cores, presets permitidos por grupo/slot e cor livre em HSL; espelhos (`syncTo`) não são sorteados; sorteio usa presets completos (sombras incluídas). Removido o atalho de tons de pele fixo. | 2, 4, 16, 18, 19 |
| 1.6 | **Abrir/salvar o preview** com botão direito ou segurando o dedo (`OpenableImage`): GIF no modo Animado, PNG nos demais. **Miniatura fallback** de portrait com quadros usa só o quadro estático. Esclarecido que `frame` numérico é quadrado e que retangulares usam `{ w, h }`; aviso do manifest ficou mais explícito. | 2, 5, 4, 16, 19 |