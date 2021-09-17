const {Client, MessageAttachment, MessageEmbed, MessageReaction, ReactionCollector} = require('discord.js');

function embed(objectInfo, logs){
  if(!objectInfo){
    console.log('Inserte un objeto de embed');
  }else {
    const embed = new MessageEmbed();
    embed.setColor(0x2f3136);
    !objectInfo.title || embed.setTitle(objectInfo.title);
    !objectInfo.description || embed.setDescription(objectInfo.description);
    !objectInfo.url || embed.setURL(objectInfo.url)
    !objectInfo.color || embed.setColor(objectInfo.color);
    !objectInfo.timestamp || embed.setTimestamp(objectInfo.timestamp);
    !objectInfo.thumbnail || embed.setThumbnail(objectInfo.thumbnail);
    !objectInfo.image || embed.setImage(objectInfo.image);
    !objectInfo.author || embed.setAuthor(objectInfo.author.name, objectInfo.author.icon, objectInfo.author.url);
    !objectInfo.footer || embed.setFooter(objectInfo.footer.text || objectInfo.footer, objectInfo.footer.icon)
    
    if(objectInfo.fields){
      for (let i = 0; i < objectInfo.fields.length; i++) {
        embed.addField(objectInfo.fields[i].title, objectInfo.fields[i].text, objectInfo.fields[i].inline);
      }
    }

    embed.setTimestamp();

    return embed;
  }
}
function timeout(tiempo, muteUser, mutedRole) {
  setTimeout(() => {
    muteUser.roles.remove(mutedRole, `Temporary mute expired.`);
  }, tiempo); // time in ms
}

function converterArray(object){
  let data = Object.getOwnPropertyNames(object);
  let all_info = [];
  data.forEach((element, i, array) => {
    all_info.push(Object.getOwnPropertyDescriptor(object, element).value)
  })

  return all_info;
}

async function leveling(message, init, servidor){
  const iniciacon = message.content.split(' ', 1)[0].toLowerCase();
  const usuario = await init.usuario(servidor, message.author.id);
  let footer = `Ejecutado por ${message.author.tag}`;
  usuario.mensajes = usuario.mensajes + 1;
  usuario.xp = usuario.xp + Math.floor(message.content.length * 0.3);
  usuario.tag = message.author.tag;
  if(usuario.xp >= usuario.xpnext){
    usuario.nivel = usuario.nivel + 1;
    usuario.xp = 0;
    usuario.xpnext = Math.floor(121 * usuario.nivel);
    let canal = message.guild.channels.cache.get(servidor.niveles);
    if(canal){
      canal.send(`<@!${message.author.id}>`);
      canal.send(embed({
        title: `Niveles ${message.author.tag}`,
        description: `<@!${message.author.id}> acabas de subir al nivel ${usuario.nivel} con ${usuario.mensajes} mensajes.`,
        footer
      }));
    };
  }
  servidor.usuarios[message.author.id] = usuario;
  init.setServidor(servidor);
  return usuario;
}

module.exports = {embed, timeout, converterArray, leveling};
