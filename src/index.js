// DEPENDENCIAS
const {Client, MessageAttachment, MessageEmbed, MessageReaction, ReactionCollector, Intents} = require('discord.js');
const path = require('path');
const {timems, getTime, getTimeLong, forDate, getRemainTime} = require('./helpers/timems');
const {servidores, data, initHelperDB} = require('./database');
const init = new initHelperDB();
const {embed, converterArray} = require('./helpers/necesarios.js');
// let Intss = new Intents(Intents.ALL);
const bot = new Client({disableEveryone: true, partials: ['USER', 'REACTION', 'MESSAGE']});
const configs = require('./../config.json');
const canvacord = require('canvacord');

function messagePrivate(message, memb, mensaje){
  if(!message.guild) return;
  if(!message.guild.member(memb)) return;

  const miembro = message.guild.member(memb)
  miembro.send(mensaje)
}

// READY ? READY : ERROR
bot.on('ready', () => {
	console.log(`El bot esta encendido en los servidores ${bot.user.tag}`);
	bot.user.setActivity({
		status: 'IDLE',
		name: `New bot version 1.0`
	});
});

bot.on('guildMemberAdd', async (member) => {
	let servidor = await init.servidor(member.guild.id);
	let usuario = await init.usuario(servidor, member.user.id);

	let comando = forDate(new Date());
	const footer = {
		text: `Ejecutado por ${member.user.username}#${member.user.discriminator}`,
		icon: member.user.avatarURL()
	};

	let canal = member.guild.channels.cache.get(servidor.bienvenida);
	if(member.guild.channels.cache.get(servidor.superbienvenida)){
		const welcome = await new canvacord.Welcomer()
		.setUsername(member.user.username)
    .setDiscriminator(member.user.discriminator)
    .setGuildName(member.guild.name)
    .setAvatar(member.user.displayAvatarURL({ format: "png" }))
    .setText("title", "Bienvenido")
    .setText("message", "Disfruta del servidor")
    .toAttachment();

		let canal = member.guild.channels.cache.get(servidor.superbienvenida);
		canal.send(new MessageAttachment(welcome.toBuffer(), "welcome.png"));
	}
	if(!canal) return;

	let messagewelcome = servidor.bienvenidatexto ? servidor.bienvenidatexto : `<@!${member.user.id}> bienvenido a ${member.guild.name}.`;
	let realmessage = messagewelcome.replace('{user}', `<@!${member.user.id}>`);
	canal.send(embed({
		title: "Bienvenido al servidor",
		description: realmessage,
		footer
	}))
	let rolgive = member.guild.roles.cache.get(servidor.bienvenidarol);
	if(rolgive){
		member.roles.add(servidor.bienvenidarol)
	}
})

bot.on('guildMemberRemove', async (member) => {
	let servidor = await init.servidor(member.guild.id);
	let usuario = await init.usuario(servidor, member.user.id);

	let comando = forDate(new Date());
	const footer = {
		text: `Ejecutado por ${member.user.username}#${member.user.discriminator}`,
		icon: member.user.avatarURL()
	};

	let canal = member.guild.channels.cache.get(servidor.adios);
	if(member.guild.channels.cache.get(servidor.superdespedida)){
		const welcome = await new canvacord.Leaver()
		.setUsername(member.user.username)
    .setDiscriminator(member.user.discriminator)
    .setGuildName(member.guild.name)
    .setAvatar(member.user.displayAvatarURL({ format: "png" }))
    .setText("title", "Adios")
    .setText("message", "Esperamos que vuelvas")
    .toAttachment();

		let canal = member.guild.channels.cache.get(servidor.superdespedida);
		canal.send(new MessageAttachment(welcome.toBuffer(), "leave-user.png"));
	}
	if(!canal) return;

	let messagewelcome = servidor.despedidatexto ? servidor.despedidatexto : `<@!${member.user.id}> acaba de abandonar el servidor.`;
	let realmessage = messagewelcome.replace('{user}', `<@!${member.user.id}>`);
	canal.send(embed({
		title: "Despedida del servidor",
		description: realmessage,
		footer
	}))
})

bot.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (oldMember.premiumSince !== newMember.premiumSince) {
    let servidor = await init.servidor(newMember.guild.id);
		let usuario = await init.usuario(servidor, newMember.user.id);

		if(newMember.guild.channels.cache.get(servidor.boost)){
			newMember.guild.channels.cache.get(servidor.boost).send(embed({
				title: "Mejora del servidor",
				description: `<@!${newMember.user.id}> ha mejorado el servidor.`
			}))
		}
  }
});

bot.on('comandos', async (message) => {
	let comandodata = forDate(new Date());
	const footer = {
		text: `Ejecutado por ${message.author.username}#${message.author.discriminator}`,
		icon: message.author.avatarURL()
	};
	let cmd = message.content.split(' ', 1)[0].toLowerCase();

	let servidor = await init.servidor(message.guild.id);
	servidor.commandsper = converterArray(servidor.commandsper?servidor.commandsper:{});
	let comando = servidor.commandsper.find(ch => `${servidor.prefix}${ch.comando}` == cmd);
	if(comando){
		if(!comando.permisos){
			if(!comando.tipo){
				message.channel.send(comando.respuesta ? comando.respuesta : "No tiene respuesta.");
			}else {
				comando.embed.footer = footer;
				message.channel.send(embed(comando.embed));
			}
		}else {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta ? pregunta : message.member.hasPermission('MANAGE_MESSAGES');
			if(!comando.tipo) return message.channel.send(comando.respuesta ? comando.respuesta : "No tiene respuesta.");
			if(!permisos) return;

			comando.embed.footer = footer;
			message.channel.send(embed(comando.embed));
		}
	}
})

bot.on('messageReactionAdd', async (reaction, userreaction) => {
	if(userreaction.id === bot.user.id) return;
	if(reaction._emoji.name != 'checkmark') return;

	let message = reaction.message;
	const servidor = await init.servidor(message.guild.id);
	servidor.verification = servidor.verification ? servidor.verification : {};
	message.channel.fetch(servidor.verificationmsg);
	if(message.id == servidor.verificationmsg){
		let member = message.guild.member(userreaction.id);
		let registros = message.guild.channels.cache.get(servidor.registros);
		if(member){
			member.roles.add(servidor.verification.rol).then(() => {
				if(registros) return registros.send(embed({
					title: "Usuario verificado.",
					description: `El usuario <@!${member.id}> ha sido verificado.`
				}));
			}).catch(() => {
				if(registros) return registros.send(embed({
					title: "Verificación",
					description: `<@!${member.id}> se verifico.`
				}));
			})
		}
	}
})

require('./helpers/comandos')(bot);
require('./helpers/website.js')

bot.login(configs.bot_token);