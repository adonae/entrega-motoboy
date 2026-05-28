# Sistema de Rastreamento de Entregas

Aplicacao estatica para cadastrar entregas, calcular uma rota simples, rastrear status e confirmar entregas usando Firebase Hosting e Cloud Firestore.

## Arquivos principais

| Arquivo | Quem usa | Para que serve |
|---|---|---|
| `index.html` | Empresa | Painel para cadastrar e visualizar entregas |
| `rota.html` | Empresa/motoboy | Calcula uma ordem sugerida para entregas pendentes |
| `entrega.html` | Motoboy | Confirma uma entrega pelo ID |
| `rastrear.html` | Cliente | Acompanha o status de uma entrega |

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
