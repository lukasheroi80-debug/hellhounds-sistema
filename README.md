# Sistema Hellhounds

Painel web responsivo para gerenciar parcerias da facção Hellhounds.

## O que já funciona

- Tela de login no estilo do site de referência.
- Painel preto e roxo.
- Cadastro, edição e exclusão de parcerias.
- Pesquisa e filtro por categoria.
- Botões para copiar Dark, senha e telefone.
- Funcionamento no celular e no computador.
- Dados iniciais das parcerias já cadastrados.
- Publicação gratuita na Vercel.

## Testar no computador

Abra o arquivo `index.html` no navegador.

A tela de demonstração aceita qualquer ID e senha não vazios.

## Publicar na Vercel

1. Crie uma conta em https://vercel.com
2. Crie uma conta em https://github.com
3. No GitHub, crie um repositório chamado `hellhounds-sistema`.
4. Envie todos os arquivos desta pasta para o repositório.
5. Na Vercel, clique em **Add New > Project**.
6. Selecione o repositório `hellhounds-sistema`.
7. Clique em **Deploy**.

A Vercel vai gerar um link semelhante a:

`https://hellhounds-sistema.vercel.app`

## Fazer todos verem e editarem os mesmos dados

Sem banco de dados, cada navegador salva sua própria cópia. Para os dados ficarem
compartilhados em tempo real, conecte o Firebase:

1. Entre em https://console.firebase.google.com
2. Clique em **Adicionar projeto**.
3. Crie um aplicativo Web dentro do projeto.
4. Ative **Realtime Database**.
5. Durante os testes, use estas regras:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

6. Copie a configuração Web fornecida pelo Firebase.
7. Abra `firebase-config.js`.
8. Substitua `null` pela configuração copiada, seguindo o exemplo já presente.
9. Envie novamente o arquivo para o GitHub. A Vercel atualizará o site.

## Atenção sobre segurança

As regras abertas são adequadas apenas para teste. Para uso definitivo, configure
Firebase Authentication e regras que permitam edição apenas para líderes e gerentes.
A tela de login atual é visual e não substitui autenticação segura no servidor.
