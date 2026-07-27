# Hellhounds Sistema V4.1 — acesso por passaporte

Esta versão remove o login por e-mail e não usa Firebase Authentication.

## Primeiro uso

1. Substitua os arquivos do GitHub pelos arquivos deste pacote.
2. No Firebase, abra Firestore Database > Rules.
3. Cole o conteúdo de `firestore.rules` e clique em **Publish**.
4. Abra o site. A primeira tela será **Criar primeiro Líder**.
5. Informe seu nome, seu passaporte e crie sua senha. Você entrará imediatamente.
6. Dentro do painel, abra **Acessos** e autorize os passaportes dos membros.
7. Cada membro usa **Primeiro acesso** para criar a própria senha.

## Observação de segurança

Esta é uma versão simples para colocar o painel em funcionamento sem o problema do Firebase Authentication. As senhas são protegidas com PBKDF2, mas as regras do Firestore ficam abertas porque não existe autenticação de servidor. Não divulgue o endereço publicamente até migrar o login para um backend seguro.
