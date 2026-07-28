# Hellhounds — Painel V5 (atualização segura)

Esta versão foi preparada para ser publicada **sobre o projeto atual**, mantendo o mesmo Firebase e os dados já cadastrados.

## Dados preservados

- Usuários, senhas e acessos da coleção `users`
- Membros e cargos da coleção `members`
- Missões, parcerias, avisos, pontos, disciplina e histórico existentes

O painel não executa limpeza, migração destrutiva nem recriação automática dessas coleções.

## Proteção adicional

Ao editar ou autorizar um passaporte que já existe, o sistema atualiza somente nome, cargo, função e status. A senha, o salt, a data de criação e os demais dados do usuário são preservados.

## Publicação

1. Faça um backup do Firestore antes de qualquer atualização em produção.
2. Mantenha o arquivo `firebase-config.js` apontando para o mesmo projeto Firebase usado atualmente.
3. Substitua os arquivos do site no GitHub/Vercel.
4. Não apague coleções no Firebase e não crie um projeto Firebase novo.
5. Teste primeiro com uma conta da liderança e com um membro já existente.

## Novas coleções

A V5 apenas acrescenta dados nas coleções `products` e `vault`, além de usar `events` para o calendário. O produto padrão Metanfetamina só é criado quando ainda não existe.

## Integração de Metas com Discord

A página **Metas** salva as entregas no Firestore e envia o comprovante ao canal do Discord por uma função segura da Vercel.

Na Vercel, abra **Settings → Environment Variables** e crie:

- `DISCORD_META_WEBHOOK_URL`: cole o webhook do canal de Metas Concluídas.

Depois, faça um novo deploy. O webhook não fica exposto no código do navegador.
