# Hellhounds Sistema v2

Painel web com Firebase Authentication, Firestore, cargos e permissões.

## Primeiro acesso

1. No Firebase Console, abra **Authentication > Usuários**.
2. Clique em **Adicionar usuário**.
3. Cadastre seu e-mail e uma senha com pelo menos 6 caracteres.
4. Publique estes arquivos no GitHub/Vercel.
5. Entre no site com essa conta.
6. Como ainda não existe nenhum perfil em `users`, o primeiro login vira **Dono** automaticamente.

## Cargos

- **Dono:** acesso total, usuários, cargos e histórico.
- **Gerente:** gerencia membros, parcerias e avisos.
- **Membro:** somente leitura.

## Segurança importante

O Firestore foi criado em modo de teste. Depois do primeiro login, copie o conteúdo de `firestore.rules`, abra:

**Firebase > Firestore Database > Regras**

Cole as regras e clique em **Publicar**.

## Arquivos

- `index.html`: estrutura do site.
- `styles.css`: visual preto/roxo.
- `app.js`: autenticação, dados e permissões.
- `firebase-config.js`: conexão com o projeto Firebase.
- `firestore.rules`: regras de segurança.
- `hellhounds-logo.jpeg`: identidade visual.
- `vercel.json`: configuração da Vercel.
