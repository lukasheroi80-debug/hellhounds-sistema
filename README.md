# Hellhounds — Central de Comando v4

Painel estático para Vercel, usando Firebase Authentication e Firestore.

## Login correto

O membro nunca digita e-mail. O site transforma o passaporte em um e-mail técnico interno, por exemplo `1234@hellhounds.local`.

### Primeiro acesso de um membro

1. O Líder abre **Acessos → Autorizar passaporte**.
2. Informa nome, passaporte da cidade e cargo no painel.
3. O membro abre **Primeiro acesso? Criar minha senha**.
4. Digita o passaporte autorizado e cria a própria senha.
5. Nos próximos acessos, usa passaporte + senha criada.

## Primeiro Líder

A primeira conta que conseguir entrar e ainda não tiver perfil será configurada como Líder. Para aproveitar a conta já criada no Firebase, entre com o passaporte correspondente e a senha conhecida. Depois disso, o painel passa a exigir autorizações.

## Instalação

1. Substitua os arquivos do repositório pelos desta pasta.
2. No Firebase, confirme **Authentication → Sign-in method → Email/Password** ativado.
3. Em **Firestore Database → Rules**, cole todo o conteúdo de `firestore.rules` e clique em **Publicar**.
4. Faça o commit no GitHub. A Vercel fará o deploy automaticamente.

## Painéis

Dashboard, membros, missões, parcerias, avisos, calendário, relatórios, pontos/ranking, disciplina, equipamentos, acessos e histórico.

## Observação sobre senha

Cada usuário pode alterar a própria senha pelo botão **Alterar senha**. Como este projeto é somente front-end, o Líder pode bloquear uma conta, mas não pode trocar diretamente a senha de outra pessoa sem um backend administrativo. Isso evita uma falsa função de “reset” que não funcionaria.
