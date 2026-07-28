export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
  const webhook=process.env.DISCORD_META_WEBHOOK_URL;
  if(!webhook)return res.status(503).json({error:'Webhook de metas não configurado'});
  try{
    const {bags,weightKg,description,imageData,userName,userPassport,submittedAt}=req.body||{};
    if(!bags||!imageData||!userName||!userPassport)return res.status(400).json({error:'Dados incompletos'});
    const match=String(imageData).match(/^data:(image\/\w+);base64,(.+)$/);
    if(!match)return res.status(400).json({error:'Imagem inválida'});
    const ext=match[1].split('/')[1].replace('jpeg','jpg');
    const form=new FormData();
    const embed={title:'📦 META CONCLUÍDA – HELLHOUNDS',color:9126646,fields:[{name:'👤 Membro',value:String(userName),inline:true},{name:'🆔 Passaporte',value:String(userPassport),inline:true},{name:'🎒 Entrega',value:`${bags} mochila(s)`,inline:true},{name:'⚖️ Peso total',value:`${weightKg||Number(bags)*100} kg`,inline:true},{name:'📝 Descrição',value:String(description||'Sem descrição'),inline:false},{name:'📅 Data',value:new Date(submittedAt||Date.now()).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),inline:false}],image:{url:`attachment://meta.${ext}`},footer:{text:'Central de Comando Hellhounds'}};
    form.append('payload_json',JSON.stringify({username:'HELLHOUNDS • Metas',embeds:[embed]}));
    form.append('files[0]',new Blob([Buffer.from(match[2],'base64')],{type:match[1]}),`meta.${ext}`);
    const out=await fetch(webhook,{method:'POST',body:form});
    if(!out.ok)throw Error(`Discord respondeu ${out.status}`);
    return res.status(200).json({ok:true});
  }catch(err){console.error(err);return res.status(500).json({error:'Não foi possível enviar ao Discord'});}
}
