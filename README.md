# Sistema de Rastreamento de Entregas

Aplicacao estatica para cadastrar entregas, gerenciar lotes, calcular rota, rastrear status em tempo real e confirmar entregas usando Firebase Hosting e Cloud Firestore.

## Paginas

| Pagina | Quem usa | Para que serve |
|---|---|---|
| `index.html` | Loja (operador) | Painel para cadastrar entregas, editar (`?editar=id`) e criar lotes |
| `lotes.html` | Loja / Motoboy | Lista todos os lotes; permite abrir, excluir ou liberar pedidos de volta ao painel |
| `lote.html` | Loja / Motoboy | Gerenciar um lote: "Saiu da Loja", "Em Rota" e "Entregue" por entrega |
| `rota.html` | Motoboy | Calcula ordem sugerida para entregas pendentes |
| `entrega.html` | Loja / Motoboy | Visualizar detalhes e confirmar entrega individual (`?modo` oculta acoes da loja) |
| `rastrear.html` | Cliente | Acompanha status da entrega em tempo real |
| `404.html` | — | Pagina padrao do Firebase Hosting para rotas inexistentes |

## Fluxo de status

Cada entrega percorre 4 etapas distintas:

```
Pendente → Saiu da Loja → Em Rota → Entregue
```

1. **Pendente** — criada no painel, aguardando alocacao em lote
2. **Saiu da Loja** — lote despachado (batch-level, todas as entregas do lote)
3. **Em Rota** — motoboy iniciou deslocamento para aquela entrega (individual)
4. **Entregue** — confirmada pelo motoboy (individual)

A timeline de rastreamento do cliente reflete exatamente essas 4 etapas.

## Estrutura do codigo

```
js/
├── pages/
│   ├── index.js           # Orquestrador do painel (criar/lotar/editar)
│   ├── CepController.js   # Consulta de CEP (ViaCEP, AbortController)
│   ├── EntregaForm.js     # Formulario: criar/editar/limpar
│   ├── EntregaList.js     # Lista: renderizar, excluir, contadores, controle de lote
│   ├── entrega.js         # Pagina de confirmacao individual (aceita ?modo)
│   ├── lote.js            # Pagina do lote (status batch + individual)
│   ├── lotes.js           # Listagem de todos os lotes (excluir/liberar)
│   ├── rota.js            # Pagina de calculo de rota
│   └── rastrear.js        # Pagina de acompanhamento do cliente
├── services/
│   ├── AuthService.js         # Autenticacao anonima Firebase (com timeout 10s)
│   ├── GeocodingService.js    # Geocodificacao (Photon, Nominatim, cache LRU 200)
│   ├── RoutingAlgorithm.js    # Haversine, TSP Nearest Neighbor (puro, sem rede)
│   ├── RotaService.js         # Orquestracao de rota (geocode + TSP)
│   ├── EntregaService.js      # Regras de negocio das entregas
│   ├── LoteService.js         # Regras de negocio dos lotes (batch atomico)
│   └── ViaCepService.js       # Consulta de CEP via ViaCEP (com AbortSignal)
├── repositories/
│   ├── EntregaRepository.js   # Acesso ao Firestore (entregas)
│   └── LoteRepository.js      # Acesso ao Firestore (lotes)
└── utils/
    ├── store.js            # Store reativo pub/sub (get, set, subscribe)
    ├── dom.js              # Helpers de DOM (toast, loading, escape, contador aninhado)
    ├── format.js           # Formatacao (CEP, telefone, data, status)
    ├── constants.js        # Strings e valores fixos (STATUS, TIMELINE, COLECOES, LOJA)
    └── errorHandler.js     # Tratamento centralizado de erros
```

### Arquitetura em camadas

`pages/` → `services/` → `repositories/` → `firebase.js` (SDK init)

Cada modulo em `pages/` exporta uma funcao `init*` que recebe um objeto `state` compartilhado, mantendo o `index.js` como orquestrador enxuto.

`RoutingAlgorithm.js` nao possui dependencia de rede nem de DOM — pode ser testado isoladamente com entradas de coordenadas fixas.

### Lotes (batch)

A operacao "Saiu da Loja" usa `WriteBatch` do Firestore para atualizar atomicamente o documento do lote e todas as entregas vinculadas em uma unica requisicao.

## Configuracao

1. Crie um projeto no Firebase.
2. Ative o Cloud Firestore e o Authentication (anonimo).
3. Registre um app Web no Firebase.
4. Copie `js/config.example.js` para `js/config.js`.
5. Preencha `firebaseConfig` em `js/config.js` com os dados do seu app Web.

O arquivo `js/config.js` fica fora do Git por conter dados de configuracao do projeto.

## Desenvolvimento local

Como os arquivos JavaScript usam `type="module"`, abra o projeto por um servidor local, nao direto pelo arquivo no navegador.

Com Firebase CLI (emulador configurado na porta 5000):

```bash
npx -y firebase-tools@latest emulators:start --only hosting
```

Ou com qualquer servidor estatico apontando para a raiz do projeto.

## Deploy

O Firebase Hosting esta configurado em `firebase.json`. A pasta publica atual e a raiz do projeto (`"."`), mas arquivos de ferramenta, logs, credenciais locais e metadados sao ignorados no deploy.

```bash
npx -y firebase-tools@latest deploy --only hosting
```

## Autenticacao

Todas as paginas usam autenticacao anonima do Firebase (`signInAnonymously`). O `AuthService.init()` e chamado no `DOMContentLoaded` de cada pagina e tem timeout de 10s. O cliente de rastreamento tambem passa por esse fluxo — nao ha acesso nao autenticado.

## Regras de seguranca

As regras do Firestore estao definidas em `firestore.rules`:

- **Leitura e listagem**: restritas a usuarios autenticados (`allow read: if request.auth != null`).
- **Escrita**: restrita a usuarios autenticados.
- **Validacao de campos em create**: `nome`, `telefone`, `endereco`, `status` obrigatorios com limites de tamanho.
- **Imutabilidade do `criadoEm`**: nao pode ser alterado apos a criacao.
- **Lotes**: `entregaIds` nao pode ser modificado apos criacao; `saiuEm` permite apenas transicao de `null` para um timestamp.

Aplique com:

```bash
npx -y firebase-tools@latest deploy --only firestore
```

## Indices do Firestore

`firestore.indexes.json` define um indice composto na colecao `entregas`:

| Campos | Ordenacao |
|---|---|
| `status` ASC, `criadoEm` DESC | Listar entregas por status da mais recente |

```bash
npx -y firebase-tools@latest deploy --only firestore
```

## Cache offline

O Firebase Firestore `enablePersistence()` e ativado automaticamente na inicializacao (`firebase.js`). Se o navegador nao suportar ou houver varias abas abertas, o fallback e silencioso (apenas um aviso no console).

## Endereco padrao da loja

O endereco de origem usado no calculo de rota esta definido em `js/utils/constants.js`:

```
Avenida Tabajaras, 848, Centro, Joao Pessoa - PB, CEP 58013-270
```

O operador pode sobrescrever esse endereco via painel; o valor personalizado fica salvo no `localStorage` (chave `endereco_loja`).

## Projeto Firebase

O arquivo `.firebaserc` mapeia o projeto padrao como `sebo-entregas`. Para usar outro projeto:

```bash
npx -y firebase-tools@latest use <outro-projeto>
```

## Configuracao do hosting

O `firebase.json` define a raiz do projeto como pasta publica (`"."`) e ignora no deploy: `firebase.json`, `.firebaserc`, `.gitignore`, `skills-lock.json`, `firebase-debug.log`, `**/.*` e `**/node_modules/**`.

O emulador local de hosting esta pre-configurado na porta 5000 com UI habilitada (veja "Desenvolvimento local").

## Observacoes

- `.agents/` contem instrucoes locais de ferramentas de IA e nao faz parte da aplicacao.
- `.firebase/` e cache/metadado local do Firebase Hosting.
- `firebase-debug.log` e `skills-lock.json` tambem nao sao necessarios para o codigo da aplicacao.
