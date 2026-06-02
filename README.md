# Sistema de Rastreamento de Entregas

Aplicacao estatica para cadastrar entregas, calcular uma rota simples, rastrear status e confirmar entregas usando Firebase Hosting e Cloud Firestore.

## Arquivos principais

| Arquivo | Quem usa | Para que serve |
|---|---|---|
| `index.html` | Empresa | Painel para cadastrar e visualizar entregas |
| `rota.html` | Empresa/motoboy | Calcula uma ordem sugerida para entregas pendentes |
| `entrega.html` | Motoboy | Confirma uma entrega pelo ID |
| `rastrear.html` | Cliente | Acompanha o status de uma entrega |

## Estrutura do codigo

```
js/
├── pages/
│   ├── index.js          # Orquestrador das paginas de cadastro
│   ├── CepController.js  # Consulta de CEP (ViaCEP, AbortController)
│   ├── EntregaForm.js    # Formulario: criar/editar/limpar
│   ├── EntregaList.js    # Lista: renderizar, excluir, contadores
│   ├── entrega.js        # Pagina de confirmacao de entrega
│   ├── rota.js           # Pagina de calculo de rota
│   └── rastrear.js       # Pagina de acompanhamento
├── services/
│   ├── GeocodingService.js   # Geocodificacao (Photon, Nominatim, cache)
│   ├── RoutingAlgorithm.js   # Haversine, TSP Nearest Neighbor (sem rede)
│   ├── RotaService.js        # Orquestracao de rota (geocode + TSP)
│   ├── EntregaService.js     # Regras de negocio das entregas
│   └── ViaCepService.js      # Consulta de CEP via ViaCEP
├── repositories/
│   └── EntregaRepository.js  # Acesso ao Firestore
└── utils/
    ├── dom.js             # Helpers de DOM (toast, loading, escape)
    ├── format.js          # Formatacao (CEP, telefone, data, status)
    ├── constants.js       # Strings e valores fixos
    └── errorHandler.js    # Tratamento centralizado de erros
```

Cada modulo em `pages/` exporta uma funcao `init*` que recebe um objeto `state`
compartilhado, mantendo o `index.js` como orquestrador enxuto (~40 linhas).

`RoutingAlgorithm.js` nao possui dependencia de rede nem de DOM — pode ser
testado isoladamente com entradas de coordenadas fixas.

`GeocodingService.js` e `RoutingAlgorithm.js` substituiram o antigo `routing.js`,
que ainda existe como barrel de compatibilidade.

## Configuracao

1. Crie um projeto no Firebase.
2. Ative o Cloud Firestore.
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

Durante testes, use regras permissivas apenas temporariamente. Antes de usar em producao, configure autenticacao e restrinja escrita/leitura conforme o papel de cada usuario.

Exemplo temporario para testes:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /entregas/{entregaId} {
      allow read, write: if true;
    }
  }
}
```

## Observacoes

- `.agents/` contem instrucoes locais de ferramentas de IA e nao faz parte da aplicacao.
- `.firebase/` e cache/metadado local do Firebase Hosting.
- `firebase-debug.log` e `skills-lock.json` tambem nao sao necessarios para o codigo da aplicacao.
