# Sistema de Rastreamento de Entregas

Aplicacao estatica para cadastrar entregas, gerenciar lotes, calcular rota, rastrear status em tempo real e confirmar entregas usando Firebase Hosting e Cloud Firestore.

## Paginas

| Pagina | Quem usa | Para que serve |
|---|---|---|
| `index.html` | Loja (operador) | Painel para cadastrar entregas e criar lotes |
| `lote.html` | Loja / Motoboy | Gerenciar um lote: "Saiu da Loja", "Em Rota" e "Entregue" por entrega |
| `rota.html` | Motoboy | Calcula ordem sugerida para entregas pendentes |
| `entrega.html` | Loja / Motoboy | Visualizar detalhes e confirmar entrega individual |
| `rastrear.html` | Cliente | Acompanha status da entrega em tempo real |

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
│   ├── index.js           # Orquestrador do painel (criar/lotar)
│   ├── CepController.js   # Consulta de CEP (ViaCEP, AbortController)
│   ├── EntregaForm.js     # Formulario: criar/editar/limpar
│   ├── EntregaList.js     # Lista: renderizar, excluir, contadores, controle de lote
│   ├── entrega.js         # Pagina de confirmacao individual
│   ├── lote.js            # Pagina do lote (status batch + individual)
│   ├── rota.js            # Pagina de calculo de rota
│   └── rastrear.js        # Pagina de acompanhamento do cliente
├── services/
│   ├── AuthService.js         # Autenticacao anonima Firebase
│   ├── GeocodingService.js    # Geocodificacao (Photon, Nominatim, cache LRU)
│   ├── RoutingAlgorithm.js    # Haversine, TSP Nearest Neighbor (puro, sem rede)
│   ├── RotaService.js         # Orquestracao de rota (geocode + TSP)
│   ├── EntregaService.js      # Regras de negocio das entregas
│   ├── LoteService.js         # Regras de negocio dos lotes (batch atomico)
│   └── ViaCepService.js       # Consulta de CEP via ViaCEP
├── repositories/
│   ├── EntregaRepository.js   # Acesso ao Firestore (entregas)
│   └── LoteRepository.js      # Acesso ao Firestore (lotes)
└── utils/
    ├── dom.js              # Helpers de DOM (toast, loading, escape, contador aninhado)
    ├── format.js           # Formatacao (CEP, telefone, data, status)
    ├── constants.js        # Strings e valores fixos (STATUS, TIMELINE, COLECOES)
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

Com Firebase CLI:

```bash
npx -y firebase-tools@latest emulators:start --only hosting
```

Ou com qualquer servidor estatico apontando para a raiz do projeto.

## Deploy

O Firebase Hosting esta configurado em `firebase.json`. A pasta publica atual e a raiz do projeto (`"."`), mas arquivos de ferramenta, logs, credenciais locais e metadados sao ignorados no deploy.

```bash
npx -y firebase-tools@latest deploy --only hosting
```

## Regras de seguranca

As regras do Firestore estao definidas em `firestore.rules`:

- **Leitura por ID** (`get`): publica — cliente consegue rastrear sem autenticacao.
- **Listagem** (`list`): restrita a usuarios autenticados.
- **Escrita**: restrita a usuarios autenticados (`allow write: if request.auth != null`).

Aplique com:

```bash
npx -y firebase-tools@latest deploy --only firestore
```

## Observacoes

- `.agents/` contem instrucoes locais de ferramentas de IA e nao faz parte da aplicacao.
- `.firebase/` e cache/metadado local do Firebase Hosting.
- `firebase-debug.log` e `skills-lock.json` tambem nao sao necessarios para o codigo da aplicacao.
