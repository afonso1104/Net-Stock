# Sala · Inventário

Aplicação web mobile-first para gerir materiais distribuídos por caixas, com levantamentos, devoluções parciais, transferências, baixas, correções, histórico completo, exportação para Excel e QR Code por caixa. Pode ser instalada no telemóvel como app.

## Desenvolvimento local

Requisitos: Node.js 22 e npm.

```bash
npm install
cp .env.example .env.local   # preenche com a configuração da Web App Firebase
npm run dev
```

```bash
npm test             # testes unitários
npm run test:rules   # testa firestore.rules no emulador (precisa de Java)
npm run lint
npm run build
```

## Configurar o Firebase (uma vez)

1. Cria um projeto na [Firebase Console](https://console.firebase.google.com/) (plano gratuito Spark).
2. Em **Project settings → Your apps**, adiciona uma Web App e copia a configuração para `.env.local`.
3. Em **Authentication → Sign-in method**, ativa **Google**.
4. Cria o **Cloud Firestore** em modo de produção, numa região europeia (ex.: `europe-west1`).
5. Publica regras e índices:

   ```bash
   npx firebase login
   npx firebase use --add
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```

6. **Primeiro administrador**: em **Firestore → Data**, cria a coleção `allowedUsers` com um documento cujo ID é o teu email Google **em minúsculas** e os campos `name` (string) e `admin` (boolean, `true`).
7. A partir daí, gere quem tem acesso na página **Equipa** da app (ícone de pessoas no topo).

## Acesso e equipa

- Cada pessoa entra com a sua conta Google. Só entra quem está em `allowedUsers`.
- Administradores adicionam/removem pessoas e dão permissões de administrador na página Equipa.
- Cada movimento guarda o nome e o email de quem o registou; as regras do Firestore garantem que o email corresponde à conta autenticada.
- Ao retirar material, indica-se quem fica com ele (por omissão, quem regista).

## Publicar no GitHub Pages

O workflow está em `.github/workflows/deploy.yml`, na raiz do repositório (o GitHub ignora workflows dentro de subpastas). Em cada push para `main` corre os testes, as regras, o lint, compila `SALANUCLEOS/` e publica.

1. O repositório tem de ser **público** (GitHub Pages em repositórios privados exige plano pago).
2. Em **Settings → Pages → Build and deployment → Source**, escolhe **GitHub Actions**.
3. Em **Settings → Secrets and variables → Actions → separador Variables**, cria:
   `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`.
   (A configuração Web do Firebase não é secreta; a segurança está nas regras.)
4. Faz merge para `main` (ou em **Actions → Build and deploy → Run workflow**).
5. A app fica em `https://<utilizador>.github.io/<repositório>/`. Adiciona `<utilizador>.github.io` em **Firebase → Authentication → Settings → Authorized domains**.

O build usa caminhos relativos e `HashRouter`, por isso funciona com qualquer nome de repositório sem configuração extra. Exemplo de QR: `https://utilizador.github.io/Net-Stock/#/box/ID_IMUTAVEL`.

## Funcionalidades

- **Ler QR**: botão no topo e no início; abre a câmara e vai diretamente para a caixa.
- **Etiquetas**: em Caixas → Etiquetas, imprime os QR de várias caixas numa folha A4 (3 por linha).
- **Exportar para Excel**: inventário (Materiais → Exportar) e histórico filtrado (Histórico → Exportar). CSV com `;`, abre diretamente no Excel em português.
- **Histórico completo**: os últimos 100 movimentos chegam em tempo real; os mais antigos carregam a pedido ou automaticamente ao filtrar por data.
- **Instalar como app**: no Android, menu do Chrome → *Instalar app*; no iPhone, Safari → Partilhar → *Adicionar ao ecrã principal*.

## Variáveis

| Variável | Descrição |
|---|---|
| `VITE_FIREBASE_*` | Configuração pública da Web App Firebase |
| `VITE_PUBLIC_APP_URL` | Opcional. Por omissão os QR Codes usam o endereço onde a app está aberta |

## Custos

Para 10–20 pessoas o plano gratuito (Spark) do Firebase chega com folga: 50 000 leituras e 20 000 escritas por dia. O GitHub Pages é gratuito em repositórios públicos.

## Primeiros dados

A forma mais segura é criar as primeiras caixas e materiais na interface e adicionar stock através das ações normais. Assim, os movimentos iniciais ficam auditados.

## Modelo de dados

- `allowedUsers`: contas com acesso (ID = email em minúsculas);
- `materials`: catálogo de materiais;
- `boxes`: caixas físicas;
- `stocks`: relação material/caixa e quantidade;
- `checkouts`: levantamentos abertos ou fechados;
- `movements`: histórico imutável.

Todas as ações de stock usam transações Firestore e gravam o movimento correspondente na mesma operação.

## Limitações conscientes

- consultar dados já carregados funciona sem Internet, mas guardar alterações não;
- a pesquisa é local, adequada a inventários pequenos/médios;
- a validação das quantidades é feita no cliente e nas regras; proteção contra manipulação deliberada por membros da equipa exigiria Cloud Functions.
