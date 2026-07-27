# Hellhounds Sistema v3

## Login por passaporte

O Firebase usa e-mail internamente, mas o usuário só digita o passaporte.

Exemplo:

- Passaporte: `1234`
- E-mail interno criado pelo sistema: `1234@hellhounds.local`

## Primeiro acesso

Como você já criou uma conta usando Gmail na versão anterior, crie agora uma nova conta no Firebase Authentication usando:

- E-mail: `1234@hellhounds.local`
- Senha: escolha uma senha com pelo menos 6 caracteres

Depois entre no site com:

- Passaporte: `1234`
- Senha: a mesma cadastrada

No primeiro login, a primeira conta vira **Líder** automaticamente.

## Cargos

- Líder: acesso total.
- Gerente: edita membros, parcerias e avisos.
- Membro: somente consulta.

## Regras do Firestore

Depois do primeiro login:

1. Abra Firebase > Firestore Database > Regras.
2. Copie o conteúdo do arquivo `firestore.rules`.
3. Cole e clique em Publicar.
