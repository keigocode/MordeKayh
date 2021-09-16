// DEPENDENCIAS
const {Client, MessageAttachment, MessageEmbed, MessageReaction, ReactionCollector, Message, WebhookClient} = require('discord.js');
const bot = new Client({ disableEveryone: true });
const path = require('path');
const {timems, getTime, getTimeLong, forDate, getRemainTime} = require('./timems');
const {initHelperDB} = require('./../database');
const init = new initHelperDB();
const {embed, timeout, converterArray, leveling} = require('./necesarios.js');
const canvacord = require('discord-canvas');
const configs = require('../config.json');

function messagePrivate(message, memb, mensaje){
  if(!message.guild) return;
  if(!message.guild.member(memb)) return;

  const miembro = message.guild.member(memb)
  miembro.send(mensaje).then(()  => {
  	return;
  }).catch(console.log)
}

function comandos(bot){
	function nopermsdelete(message) {
		const nopermisos = embed({
			title: `Permisos insuficientes`,
			description: 'No tienes permisos para ejecutar este comando.',
			footer: {
				text: `Ejecutado por ${message.author.tag} - Se eliminara en 5 segundos`,
				icon: message.author.avatarURL()
			}
		});
		message.delete();
		return message.channel.send(nopermisos).then(msg => {
			setTimeout(() => {
				msg.delete();
			}, 5000);
		});
	}
	
	bot.on('message', async (message) => {
		let botinterrogative = message.author;
		if (!botinterrogative) return;
		if (botinterrogative.bot == true) return;
		if (!message.guild) return;
		// VARIABLES NECESARIAS

		const iniciacon = message.content.split(' ', 1)[0].toLowerCase();
		const servidor = await init.servidor(message.guild.id);
		const usuario = await leveling(message, init, servidor);
		servidor.sugs = converterArray(servidor.sugs?servidor.sugs:{});
		servidor.tickets = converterArray(servidor.tickets?servidor.tickets:{});
		let comando = forDate(new Date());
		const footer = {
			text: `Ejecutado por ${message.author.tag}`,
			icon: message.author.avatarURL()
		};
		const noesta = embed({
			title: 'Un simple error',
			description: 'Este usuario no esta en el servidor.',
			footer: footer
		});

		bot.emit('comandos', message);
		servidor.usuarios[message.author.id] = usuario;
		// COMANDOS NORMALES
		if (iniciacon.startsWith(servidor.prefix)) {
			if (message.guild.channels.cache.get(servidor.comandos)) {
				let pregunta = message.member.roles.cache.get(servidor.staff);
				const permisos = pregunta ? pregunta : message.member.hasPermission('MANAGE_MESSAGES');
				if (message.channel.parentID == servidor.categorytickets) {
					servidor;
				} else if (message.channel.id != servidor.comandos) {
					if (!permisos) {
						let canal = message.guild.channels.cache.get(servidor.comandos);
						return message.channel.send(embed({
									title: 'Aqui pasa algo',
									description: `➜ Ejecuta este comando en el canal <#${canal.id}> \n Este mensaje se eliminara en 5 segundos.`,
									footer
							})).then(msg => {
								message.delete();
								setTimeout(() => {
									msg.delete();
								}, 5000);
							});
					}
				}
			}
		}

		if (iniciacon.includes(bot.user.id)) {
			message.channel.send(
				embed({
					title: `${bot.user.username}`,
					description: `${bot.user.username} ¿Necesitas ayuda?`,
					fields: [
						{ title: 'Prefijo en este servidor', text: servidor.prefix },
					],
					footer
				})
			);
		}

		if(iniciacon == `${servidor.prefix}rename`){
			let managechannels = message.member.hasPermission('MANAGE_CHANNELS')
			let permisos = managechannels ? managechannels : message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else {
				let objetos = message.content.split(' ', 2);
				let canal = message.guild.channels.cache.get(objetos[1]);
				if(!canal){
					message.channel.send(embed({
						title: "Renombrar canales",
						description: "Parece que este canal no existe.",
						footer
					}))
				}else {
					let newname = message.content.slice(objetos[0].length + objetos[1].length + 1);
					if(!newname) return message.channel.send(embed({
						title: "Renombrar canales",
						description: "Inserte el nuevo nombre para el canal.",
						footer
					}));

					canal.setName(newname).then(() => {
						message.channel.send(embed({
							title: "Renombrar canales",
							description: `Se ha cambiado el nombre del canal ${canal.id} por: ${newname}`,
							footer
						}))
					})
				}
			}
		}

		if(iniciacon == `${servidor.prefix}ping`){
			message.channel.send(embed({
				title: "Ping servicio",
				description: `**Tu Ping:** ${Date.now() - message.createdTimestamp}ms \n\n **SuperIPM Ping: ** ${Math.round(bot.ws.ping)}ms`,
				footer
			}))
		}

		if(iniciacon == `${servidor.prefix}play`){
			if(message.author.id != "788533828188635148") return;
			let data_search = message.content.slice(iniciacon.length + 1);
			let apikey = configs.api_youtube;
			let url_youtube = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${data_search}&maxResults=5&key=`+apikey;

			if(!data_search) return message.channel.send(embed({
				title: "Error",
				description: "Ingrese el nombre de la canción que quiere reproducir.",
				footer
			}));

			const fetch = require('node-fetch');
			const data_get = await fetch(url_youtube);
			let json_data = await data_get.json();
			let Canalvoz = message.member.voice.channel;


	    if (!Canalvoz || Canalvoz.type != 'voice') {
	   		message.channel.send(embed({
	   			title: "Error",
	   			description: "Necesitas unirte a un canal de musica primero.",
	   			footer
	   		}))
	    }else if (message.guild.voiceConnection) {
		    message.channel.send(embed({
		    	title: "Error",
		    	description: "Ya estoy en otro canal de voz.",
		    	footer
		    }));
	    } else {
	     	const ytdl = require('ytdl-core');
	      const url_video = ytdl(`https://www.youtube.com/watch?v=${json_data.items[0].id.videoId}`, { filter : 'audioonly' });
	      const data_video = json_data.items[0].snippet;
	      Canalvoz.join().then((connection) => {
      		if(!servidor.musiclist){
      			servidor.musiclist = [];
      			servidor.musiclist.push(json_data.items[0]);
      			let dispatcher = connection.play(url_video);

      			message.channel.send(embed({
			        title: "Reproduciendo",
			        description: `${data_video.title} [<@!${message.author.id}>]`,
			        footer
			      }));
			      const repeatdatavideo = async (data) => {
			      	let data_server = await init.servidor(message.guild.id);
			      	data_server.musiclist = converterArray(data_server.musiclist?data_server.musiclist:{});
			      	data_server.musiclist.splice(0, 1);
			      	init.setServidor(data_server);
			      	if(!data_server.musiclist[0]){
			      		Canalvoz.leave()
			      		return message.channel.send(embed({
			      			title: "Musica terminada",
			      			description: "Se acabo la lista de musica que habia en este servidor.",
			      			footer
			      		}))
			      	};
			      	let video = ytdl(`https://www.youtube.com/watch?v=${data_server.musiclist[0].id.videoId}`);
			      	dispatcher = connection.play(video);
			      	dispatcher.on('finish', repeatdatavideo);
			      	message.channel.send(embed({
			      		title: "Reproduciendo",
			      		description: `${data_server.musiclist[0].snippet.title}`,
			      		footer
			      	}))
			      };
      			init.setServidor(servidor);
			      dispatcher.on('finish', repeatdatavideo);
      		}else {
      			servidor.musiclist = converterArray(servidor.musiclist);
      			servidor.musiclist.push(json_data.items[0]);
      			message.channel.send(embed({
      				title: "Agregado a la cola",
      				description: `La canción: ${data_video.title}. Ha sido agregada a la cola.`,
      				footer
      			}))
      			init.setServidor(servidor);
      		}
	     })
	    }
		}

		if(iniciacon == `${servidor.prefix}mod.niveles`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				const mencion = message.mentions.channels.first();
				const staff = message.guild.channels.cache.get(servidor.niveles);

				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.niveles = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El canal de niveles ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) return message.channel.send(embed({
					title: `Configuraciones`,
					description: `El canal de niveles guardado es este: \n\n ${staff ? staff : 'No hay canal de niveles.'}`,
					footer
				}));

				servidor.niveles = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El canal <#${mencion.id}> ha sido guardado como canal de niveles.`,
					footer
				});
				message.channel.send(mensaje);
				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if(iniciacon == `${servidor.prefix}mod.bienvenida`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				const mencion = message.mentions.channels.first();
				const staff = message.guild.channels.cache.get(servidor.bienvenida);

				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.bienvenida = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El canal de bienvenida ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(
						embed({
							title: `Configuraciones`,
							description: `El canal de bienvenida guardado es este: \n\n ${staff ? staff : 'No hay canal de bienvenida.'}`,
							footer
						})
					);
				}

				servidor.bienvenida = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El canal <#${mencion.id}> ha sido guardado como canal de bienvenida.`,
					footer
				});
				message.channel.send(mensaje);
				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if(iniciacon == `${servidor.prefix}superbienvenida`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				const mencion = message.mentions.channels.first();
				const staff = message.guild.channels.cache.get(servidor.superbienvenida);
				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.superbienvenida = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El canal de super bienvenida ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(
						embed({
							title: `Configuraciones`,
							description: `El canal de super bienvenida guardado es este: \n\n ${staff ? staff : 'No hay canal de super bienvenida.'}`,
							footer
						})
					);
				}

				servidor.superbienvenida = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El canal <#${mencion.id}> ha sido guardado como canal de super bienvenida.`,
					footer
				});
				message.channel.send(mensaje);
				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if(iniciacon == `${servidor.prefix}superdespedida`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				const mencion = message.mentions.channels.first();
				const staff = message.guild.channels.cache.get(servidor.superdespedida);
				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.superdespedida = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El canal de super despedida ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(
						embed({
							title: `Configuraciones`,
							description: `El canal de super despedida guardado es este: \n\n ${staff ? staff : 'No hay canal de super despedida.'}`,
							footer
						})
					);
				}

				servidor.superdespedida = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El canal <#${mencion.id}> ha sido guardado como canal de super despedida.`,
					footer
				});
				message.channel.send(mensaje);
				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if(iniciacon == `${servidor.prefix}bienvenida`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				let user = servidor.bienvenidatexto ? servidor.bienvenidatexto : `<@!${message.author.id}> bienvenido a ${message.guild.name}.`;
				let realmessage = user.replace('{user}', `<@!${message.author.id}>`);
				let rolbienvenida = message.guild.roles.cache.get(servidor.bienvenidarol) ? message.guild.roles.cache.get(servidor.bienvenidarol) : 'No hay de bienvenida.';
				message.channel.send(embed({
					title: "Bienvenido al servidor",
					description: realmessage,
					fields:[{title: "Rol de bienvenida", text: rolbienvenida.toString()}],
					footer
				}))
			}
		}

		if(iniciacon == `${servidor.prefix}bienvenida.texto`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				let contenido = message.content.slice(iniciacon.length + 1);
				if(!contenido){
					message.channel.send(embed({
						title: "Mensaje de bienvenida",
						description: "Ingresa el mensaje de bienvenida para los usuarios.",
						footer
					}))
				}else {
					servidor.bienvenidatexto = contenido;
					init.setServidor(servidor);
					let realmessage = servidor.bienvenidatexto.replace('{user}', `<@!${message.author.id}>`);
					message.channel.send(embed({
						title: "Mensaje de bienvenida",
						description: `Se guardo el mensaje de bievenida: \n\n ${realmessage}`,
						footer
					}))
				}
			}
		}

		if(iniciacon == `${servidor.prefix}bienvenida.rol`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				let contenido = message.mentions.roles.first();
				if(message.content.slice(`${servidor.prefix}bienvenida.rol`.length + 1) == "false"){
					servidor.bienvenidarol = undefined;
					init.setServidor(servidor);
					return message.channel.send(embed({
						title: "Rol de bienvenida",
						description: "El rol ha sido reseteado.",
						footer
					}))
				}
				if(!contenido){
					message.channel.send(embed({
						title: "Rol de bienvenida",
						description: "Ingresa el rol de bienvenida para los usuarios.",
						footer
					}))
				}else {
					servidor.bienvenidarol = contenido.id;
					init.setServidor(servidor);
					message.channel.send(embed({
						title: "Rol de bienvenida",
						description: `Se guardo el rol de bievenida: \n\n <@&${contenido.id}>`,
						footer
					}))
				}
			}
		}

		if(iniciacon == `${servidor.prefix}despedida`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				let user = servidor.despedidatexto ? servidor.despedidatexto : `<@!${message.author.id}> acaba de abandonar el servidor.`;
				let realmessage = user.replace('{user}', `<@!${message.author.id}>`);
				message.channel.send(embed({
					title: "Despedida del servidor",
					description: realmessage,
					footer
				}))
			}
		}

		if(iniciacon == `${servidor.prefix}despedida.texto`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				let contenido = message.content.slice(iniciacon.length + 1);
				if(!contenido){
					message.channel.send(embed({
						title: "Mensaje de despedida",
						description: "Ingresa el mensaje de despedida para los usuarios.",
						footer
					}))
				}else {
					servidor.despedidatexto = contenido;
					init.setServidor(servidor);
					let realmessage = servidor.despedidatexto.replace('{user}', `<@!${message.author.id}>`);
					message.channel.send(embed({
						title: "Mensaje de despedida",
						description: `Se guardo el mensaje de despedida: \n\n ${realmessage}`,
						footer
					}))
				}
			}
		}

		if(iniciacon == `${servidor.prefix}mod.despedida`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if(!permisos){
				nopermsdelete(message);
			}else{
				const mencion = message.mentions.channels.first();
				const staff = message.guild.channels.cache.get(servidor.adios);

				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.adios = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El canal de despedida ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(embed({
						title: `Configuraciones`,
						description: `El canal de despedida guardado es este: \n\n ${staff ? staff : 'No hay canal de despedida.'}`,
						footer
					}));
				}

				servidor.adios = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El canal <#${mencion.id}> ha sido guardado como canal de despedida.`,
					footer
				});
				message.channel.send(mensaje);
				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if (iniciacon == `${servidor.prefix}mod.staff`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				const mencion = message.mentions.roles.first();
				const staff = message.guild.roles.cache.get(servidor.staff);

				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.staff = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El rol de staff ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(
						embed({
							title: `Configuraciones`,
							description: `El rol staff guardado es este: \n\n ${staff ? staff : 'No hay rol staff'}`,
							footer
						})
					);
				}

				servidor.staff = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El rol <@&${mencion.id}> ha sido guardado como rol staff.`,
					footer
				});
				message.channel.send(mensaje);

				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if (iniciacon == `${servidor.prefix}verificar.titulo`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			let realpermisos = permisos;
			if (!realpermisos) {
				nopermsdelete(message);
			} else {
				let texto = message.content.slice(iniciacon.length + 1);
				let verification = servidor.verification
					? servidor.verification
					: {
							title: message.guild.name,
							text: 'Reacciona al emoji de abajo para verificarte',
							rol: undefined
					  };
				servidor.verification = verification;
				if (!texto)
					return message.channel.send(
						embed({
							title: 'Verificación',
							description: `El titulo de la verificación es este: ${
								servidor.verification.title
							}`,
							footer
						})
					);

				servidor.verification.title = texto;
				init.setServidor(servidor);
				message.channel.send(
					embed({
						title: 'Verificación titulo',
						description:
							'se guardo el titulo `' +
							servidor.verification.title +
							'` en el mensaje de verificación',
						footer
					})
				);
			}
		}

		if (iniciacon == `${servidor.prefix}verificar.texto`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			let realpermisos = permisos;
			if (!realpermisos) {
				nopermsdelete(message);
			} else {
				let texto = message.content.slice(iniciacon.length + 1);
				let verification = servidor.verification
					? servidor.verification
					: {
							title: message.guild.name,
							text: 'Reacciona al emoji de abajo para verificarte',
							rol: undefined
					  };
				servidor.verification = verification;
				if (!texto)
					return message.channel.send(
						embed({
							title: 'Verificación',
							description: `El texto de la verificación es este: ${
								servidor.verification.text
							}.`,
							footer
						})
					);

				servidor.verification.text = texto;
				init.setServidor(servidor);
				message.channel.send(
					embed({
						title: 'Verificación texto',
						description:
							'se guardo el texto `' +
							servidor.verification.text +
							'` en el mensaje de verificación',
						footer
					})
				);
			}
		}

		if (iniciacon == `${servidor.prefix}verificar.info`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			let realpermisos = permisos;
			if (!realpermisos) {
				nopermsdelete(message);
			} else {
				servidor.verification = servidor.verification ? servidor.verification : {}
				let rol = message.guild.roles.cache.get(servidor.verification.rol) ? message.guild.roles.cache.get(servidor.verification.rol) : 'No hay rol';
				message.channel.send(
					embed({
						title: servidor.verification.title ? servidor.verification.title : "No tiene titulo.",
						description: servidor.verification.text ? servidor.verification.text : "Verificate reaccionando al emoji de abajo.",
						fields: [{ title: 'Rol Verificado', text: rol.toString() }]
					})
				);
			}
		}

		if (iniciacon == `${servidor.prefix}verificar.rol`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			let realpermisos = permisos;
			if (!realpermisos) {
				nopermsdelete(message);
			} else {
				let texto = message.mentions.roles.first();
				let verification = servidor.verification
					? servidor.verification
					: {
							title: message.guild.name,
							text: 'Reacciona al emoji de abajo para verificarte',
							rol: undefined
					  };
				servidor.verification = verification;
				let rolverificado = message.guild.roles.cache.get(servidor.verification.rol) ? message.guild.roles.cache.get(servidor.verification.rol) : `No hay rol verificado`;
				if (!texto)
					return message.channel.send(
						embed({
							title: 'Verificación',
							description: `El rol de la verificación es este: ${rolverificado.toString()}.`,
							footer
						})
					);

				servidor.verification.rol = texto.id;
				init.setServidor(servidor);
				message.channel.send(
					embed({
						title: 'Verificación texto',
						description:
							'se guardo el rol ' +
							texto.toString() +
							' en el mensaje de verificación.',
						footer
					})
				);
			}
		}

		if (iniciacon == `${servidor.prefix}verificar.enviar`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				let canal = message.mentions.channels.first();
				if (!canal)
					return message.channel.send(
						embed({
							title: 'Verificación',
							description:
								'Pon el canal al que quieres enviar la respuesta de verificación.',
							footer
						})
					);

				let verification = servidor.verification ? servidor.verification : {
							title: message.guild.name,
							text: 'Reacciona al emoji de abajo para verificarte',
							rol: undefined
					  };
				servidor.verification = verification;
				message.guild.channels.cache.get(canal.id).send(embed({
							title: servidor.verification.title,
							description: servidor.verification.text
						})).then(msg => {
						message.channel.send(
							embed({
								title: 'Verificación',
								description:
									'Se ha enviado la verificación al canal. <#' + canal.id + '>',
								footer
							})
						);
						servidor.verificationmsg = msg.id;
						msg.react('<:checkmark:874712277247467581>').then(() => {});
						init.setServidor(servidor);
					}).catch(() => {
						message.channel.send(
							embed({
								title: 'Ha ocurrido un error',
								description: 'Parece que el destino del mensaje ya no existe.',
								footer
							})
						);
					});
			}
		}

		if(iniciacon == `${servidor.prefix}verificar`){
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				message.channel.send(embed({
					title: "Sistema de verificación",
					description: "Puedes crear un sistema de verificación muy complejo para tus usuarios. \n\n comando para iniciar: "+servidor.prefix+"verificar.info {}",
					footer
				}))
			}
		}

		if (iniciacon == `${servidor.prefix}mod.mute`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				const mencion = message.mentions.roles.first();
				const staff = message.guild.roles.cache.get(servidor.mute);

				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.mute = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El rol de silenciado ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(
						embed({
							title: `Configuraciones`,
							description: `El rol silenciado guardado es este: \n\n ${
								staff ? staff : 'No hay rol silenciado'
							}`,
							footer
						})
					);
				}

				servidor.mute = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El rol <@&${
						mencion.id
					}> ha sido guardado como rol silenciado.`,
					footer
				});
				message.channel.send(mensaje);

				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if (iniciacon == `${servidor.prefix}mod.comandos`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				const mencion = message.mentions.channels.first();
				const staff = message.guild.channels.cache.get(servidor.comandos);

				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.comandos = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El canal de comandos ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(
						embed({
							title: `Configuraciones`,
							description: `El canal de comandos guardado es este: \n\n ${
								staff ? staff : 'No hay canal de comandos'
							}`,
							footer
						})
					);
				}

				servidor.comandos = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El canal <#${
						mencion.id
					}> ha sido guardado como canal de comandos.`,
					footer
				});
				message.channel.send(mensaje);
				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if (iniciacon == `${servidor.prefix}mod.sugerencias`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				const mencion = message.mentions.channels.first();
				const staff = message.guild.channels.cache.get(servidor.sugerencias);

				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.sugerencias = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El canal de sugerencias ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(
						embed({
							title: `Configuraciones`,
							description: `El canal de sugerencias guardado es este: \n\n ${
								staff ? staff : 'No hay canal de sugerencia'
							}`,
							footer
						})
					);
				}

				servidor.sugerencias = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El canal <#${
						mencion.id
					}> ha sido guardado como canal sugerencias.`,
					footer
				});
				message.channel.send(mensaje);
				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if (iniciacon == `${servidor.prefix}mod.registros`) {
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				const mencion = message.mentions.channels.first();
				const staff = message.guild.channels.cache.get(servidor.registros);

				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.registros = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `El canal de registros ha sido reseteado.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET

				if (!mencion) {
					return message.channel.send(
						embed({
							title: `Configuraciones`,
							description: `El canal de registros guardado es este: \n\n ${
								staff ? staff : 'No hay canal de registros'
							}`,
							footer
						})
					);
				}

				servidor.registros = mencion.id;
				init.setServidor(servidor);
				let mensaje = embed({
					title: 'Configuraciones',
					description: `El canal <#${
						mencion.id
					}> ha sido guardado como canal registros.`,
					footer
				});
				message.channel.send(mensaje);

				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if (iniciacon == `${servidor.prefix}mod.info`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				let info = {
					sugs: message.guild.channels.cache.get(servidor.sugerencias) ? message.guild.channels.cache.get(servidor.sugerencias) : 'No hay canal de sugerencias',
					comandos: message.guild.channels.cache.get(servidor.comandos)
						? message.guild.channels.cache.get(servidor.comandos)
						: 'No hay canal de comandos',
					registros: message.guild.channels.cache.get(servidor.registros)
						? message.guild.channels.cache.get(servidor.registros)
						: 'No hay canal de registros',
					tickets: message.guild.channels.cache.get(servidor.categorytickets)
						? message.guild.channels.cache.get(servidor.categorytickets)
						: 'No hay categoria de tickets.',
					silenciado: message.guild.roles.cache.get(servidor.mute)
						? message.guild.roles.cache.get(servidor.mute)
						: 'No hay rol silenciado.',
					staff: message.guild.roles.cache.get(servidor.staff)
						? message.guild.roles.cache.get(servidor.staff)
						: 'No hay rol de staff.',
					niveles: message.guild.channels.cache.get(servidor.niveles) ? message.guild.channels.cache.get(servidor.niveles) : "No hay canal de niveles.",
					bienvenida: message.guild.channels.cache.get(servidor.bienvenida) ? message.guild.channels.cache.get(servidor.bienvenida) : "No hay canal de bienvenida.",
					adios: message.guild.channels.cache.get(servidor.adios) ? message.guild.channels.cache.get(servidor.adios) : "No hay canal de despedida.",
					superbienvenida: message.guild.channels.cache.get(servidor.superbienvenida) ? message.guild.channels.cache.get(servidor.superbienvenida) : "No hay canal de super bienvenida.",
					superdespedida: message.guild.channels.cache.get(servidor.superdespedida)?message.guild.channels.cache.get(servidor.superdespedida) : "No hay canal de super despedida."
				};
				message.channel.send(
					embed({
						title: 'Información',
						description:
							'Aqui se encuentran los datos que se han guardado en este servidor.',
						fields: [
							{ title: 'Canal de sugerencias', text: info.sugs.toString() },
							{ title: 'Canal de comandos', text: info.comandos.toString() },
							{ title: 'Canal de registros', text: info.registros.toString() },
							{ title: 'Categoria de tickets', text: info.tickets.toString() },
							{ title: 'Rol de staff', text: info.staff.toString() },
							{ title: 'Rol Silenciado', text: info.silenciado.toString() },
							{ title: 'Canal de niveles', text: info.niveles.toString() },
							{ title: 'Canal de bienvenida', text: info.bienvenida.toString() },
							{ title: 'Canal de despedida', text: info.adios.toString() },
							{ title: 'Canal de superbienvenida', text: info.superbienvenida.toString() },
							{ title: 'Canal de superdespedida', text: info.superdespedida.toString() },
						],
						footer
					})
				);
			}
		}

		if (iniciacon == `${servidor.prefix}prefix`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Prefijo',
							description: `El prefijo de este servidor es: ${servidor.prefix}`,
							footer
						})
					);

				const prefijo = message.content.slice(iniciacon.length + 1);
				servidor.prefix = prefijo;
				init.setServidor(servidor);
				message.channel.send(
					embed({
						title: 'Prefijo',
						description: `El prefijo en este servidor ha sido cambiado: ${
							servidor.prefix
						}`,
						footer
					})
				);

				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(
						embed({
							title: 'Prefijo',
							description: `El prefijo en este servidor ha sido cambiado: ${
								servidor.prefix
							}`,
							footer
						})
					);
				}
			}
		}

		if (iniciacon == `${servidor.prefix}top`) {
			let top = converterArray(servidor.usuarios);
			let ssniveles = top.sort((a, b) => a.nivel - b.nivel);
			let msg = {
				title: `Top | ${message.guild.name}`,
				description:
					'Aqui se encuentra el top nivel y mensajes de este servidor.',
				fields: [],
				footer
			};
			let topmsg = '';
			let topniveles = '';
			for (let i = 0; i < 10; i++) {
				if (ssniveles[i]) {
					const miembro = message.guild.member(ssniveles[ssniveles.length - 1 - i].usuario);
					topniveles += `**${i + 1}. <@!${ssniveles[ssniveles.length - i - 1].usuario}> - ${ssniveles[ssniveles.length - i - 1].nivel}** \n`
				}
			}
			let ssmsg = top.sort((a, b) => a.mensajes - b.mensajes);
			for (let i = 0; i < 10; i++) {
				if (ssmsg[i]) {
					const miembro = message.guild.member(ssmsg[ssmsg.length - 1 - i].usuario);
					topmsg += `**${i + 1}. <@!${ssmsg[ssmsg.length - 1 - i].usuario}> - ${ssmsg[ssmsg.length - 1 - i].mensajes}** \n`
				}
			}
			msg.fields.push({
				title: 'Top mensajes',
				text: topmsg,
				inline: true
			});
			msg.fields.push({
				title: 'Top nivel',
				text: topniveles,
				inline: true
			});
			message.channel.send(embed(msg));
		}

		if (iniciacon == `${servidor.prefix}resetprefix`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				let mensaje = embed({
					title: 'Prefijo',
					description: 'El prefijo del bot ha sido reiniciado.',
					fields: [{ title: 'Prefijo ahora', text: 's!' }],
					footer
				});
				message.channel.send(mensaje);
				servidor.prefix = 's!';
				init.setServidor(servidor);

				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					registros.send(mensaje);
				}
			}
		}

		if (iniciacon === `${servidor.prefix}mod.tickets`) {
			const permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				const mensaje = message.content.slice(iniciacon.length + 1);
				// RESET CONFIG
				let datamessage = message.content.slice(iniciacon.length + 1);
				if(datamessage == "false"){
					servidor.categorytickets = undefined;
					init.setServidor(servidor);
					let mensajereset = embed({
						title: 'Configuraciones',
						description: `La categoria de tickets ha sido reseteada.`,
						footer
					});
					message.channel.send(mensajereset);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensajereset);
					}
					return;
				}; 
				// END RESET
				if (!mensaje)
					return message.channel.send(
						embed({
							title: 'Tickets',
							description: `La categoria de tickets guardada que hay es: \n\n ${
								servidor.categorytickets
									? servidor.categorytickets
									: 'No hay categoria'
							}`
						})
					);

				let buscando = message.guild.channels.cache.find(
					ch => ch.name == mensaje
				);
				let buscar = buscando
					? buscando
					: message.guild.channels.cache.find(ch => ch.id === mensaje);

				if (!buscar) {
					message.channel.send(
						embed({
							title: 'Tickes',
							description: 'Esta categoria no existe',
							footer
						})
					);
				} else {
					if (buscar.type == 'category') {
						servidor.categorytickets = buscar.id;
						init.setServidor(servidor);
						let mensaje = embed({
							title: 'Tickets',
							description:
								'La categoria `' +
								buscar.name +
								'` ha sido como elegida como categoria de tickets.'
						});
						message.channel.send(mensaje);

						let registros = message.guild.channels.cache.get(servidor.registros);
						if (registros) {
							registros.send(mensaje);
						}
					} else {
						message.channel.send(
							embed({
								title: 'Tickets',
								description: 'Esta categoria no existe.',
								footer
							})
						);
					}
				}
			}
		}

		if (iniciacon == `${servidor.prefix}help`) {
			const buscar = message.content.slice(iniciacon.length + 1);
			let helping = require('./help.json');
			return message.channel.send(embed({
				title: "Ayuda",
				description: "Estamos actualizando nuestras funcionalidades, muy pronto volvera todo a la normalidad. Fase de actualización"
			}))
			if (buscar == '') {
				helping.principal.footer = footer;
				message.channel.send(embed(helping.principal));
			}
			if (buscar != '') {
				message.channel.send(embed(helping));
			}
			if (!helping)
				return message.channel.send(
					embed({
						title: 'Ayuda',
						description: 'Esta categoria o comando no existe',
						footer
					})
				);
		}

		// COMANDOS NECESARIOS
		// EXPULSAR A UN USUARIO
		if (iniciacon == `${servidor.prefix}kick`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('KICK_MEMBERS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Expulsar',
							description: `Para usar ${servidor.prefix}kick <tag> <razon>`,
							footer
						})
					);
				const user = message.mentions.users.first();
				if (!user) {
					message.channel.send(
						embed({
							title: 'Servidor',
							description: 'Mencione al usuario que quiere expulsar.',
							footer: footer
						})
					);
				} else {
					const member = message.guild.member(user);
					if (!member) {
						message.channel.send(noesta);
					} else {
						const razon = message.content.split(`<@!${member.id}>`);
						const realrazon = razon[razon.length - 1] ? razon[razon.length - 1] : 'No hay razon';
						member.kick(realrazon).then(() => {
							let servidor = init.servidor(message.guild.id);
							let usuariosancionado = init.usuario(servidor, member.id);
							usuariosancionado.kick = usuariosancionado.kick + 1;
							init.setUsuario(servidor, member.id, usuariosancionado);

							messagePrivate(embed({
								title: `Servidor | ${message.guild.name}`,
								description: `Has sido expulsado del servidor por <@!${message.author.id}>.`,
								fields: [{ title: 'Razon', text: realrazon }],
								footer
							}));
							let mensaje = embed({
								title: 'Servidor',
								description: `El usuario <@!${member.id}> ha sido expulsado por <@!${message.author.id}>`,
								fields: [
									{ title: 'Razon', text: realrazon },
									{ title: 'Veces expulsado', text: usuariosancionado.kick }
								],
								footer: footer
							});
							message.channel.send(mensaje);
							let registros = message.guild.channels.cache.get(
								servidor.registros
							);
							if (registros) {
								registros.send(mensaje);
							}
						}).catch(err => {
							message.channel.send(embed({
								title: 'Error',
								description: 'No se ha podido expulsar a este miembro',
								footer: footer
							}));
						});
					}
				}
			}
		}

		  if (iniciacon == `${servidor.prefix}invites`) {
        var userId = message.author.id;
        var userInvites = message.guild.fetchInvites().then(invites => invites.find(invite => invite.inviter.id === userId));
        var useAmount = userInvites.uses;
        if (useAmount === undefined) {
          message.channel.send(embed({
          	title: "Invitaciones",
          	description: "No tienes invitaciones.",
          	footer
          }));
        }else {
          message.channel.send(`${message.author.username} has ${useAmount} invites`);
        }
    }

		// PURGE
		if (iniciacon == `${servidor.prefix}purge`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_MESSAGES');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Purgar',
							description: `Para usar ${servidor.prefix}purge <cantidad>`,
							footer
						})
					);

				const cantidad = message.content.substring(iniciacon.length + 1);
				const good = /^(-?(?:\d+)?\.?\d+)?$/.exec(cantidad);
				if (good) {
					let mensaje = embed({
						title: 'Mensajes purgados',
						description: `Se han purgado ${cantidad} de mensajes en <#${
							message.channel.id
						}>`,
						footer
					});
					if (cantidad > 50) {
						if (cantidad > 100) {
							message.channel.send(
								embed({
									title: 'Servidor',
									description: 'El limite de purga es 100.',
									footer: footer
								})
							);
						} else {
							message.channel.bulkDelete(50);
							message.channel.bulkDelete(cantidad);
							let registros = message.guild.channels.cache.get(
								servidor.registros
							);
							if (registros) {
								registros.send(mensaje);
							}
						}
					} else {
						let registros = message.guild.channels.cache.get(servidor.registros);
						if (registros) {
							registros.send(mensaje);
						}
						message.channel.bulkDelete(cantidad);
					}
				} else {
					message.channel.send(
						embed({
							title: 'Purgar',
							description: 'Ponga cuantos mensajes quieres purgar.',
							footer: footer
						})
					);
				}
			}
		}

		// BAN
		if (iniciacon == `${servidor.prefix}ban`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('BAN_MEMBERS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Vetar',
							description: `Para usar ${servidor.prefix}ban <tag> <razon>`,
							footer
						})
					);

				const user = message.mentions.users.first();
				if (!user) {
					message.channel.send(
						embed({
							title: 'Servidor',
							description: 'Mencione al usuario que quiere vetar.',
							footer: footer
						})
					);
				} else {
					const member = message.guild.member(user);
					if (!member) {
						message.channel.send(noesta);
					} else {
						const razon = message.content.slice(
							iniciacon.length + 2 + member.toString().length
						);
						const realrazon = razon ? razon : 'No hay razon';
						member
							.ban({ reason: realrazon })
							.then(() => {
								messagePrivate(
									embed({
										title: `Servidor | ${message.guild.name}`,
										description: `Has sido vetado del servidor por <@!${
											message.author.id
										}>.`,
										fields: [{ title: 'Razon', text: realrazon }],
										footer
									})
								);
								usuario.ban = usuario.ban + 1;
								init.setUsuario(servidor, usuario.usuario, usuario);
								let mensaje = embed({
									title: 'Servidor',
									description: `El usuario <@!${
										member.id
									}> ha sido vetado por <@!${message.author.id}>`,
									fields: [
										{ title: 'Razon', text: realrazon },
										{ title: 'Veces vetado', text: usuario.ban }
									],
									footer: footer
								});
								message.channel.send(mensaje);
								let registros = message.guild.channels.cache.get(
									servidor.registros
								);
								if (registros) {
									registros.send(mensaje);
								}
							})
							.catch(err => {
								message.channel.send(
									embed({
										title: 'Error',
										description: 'No se ha podido vetar a este miembro',
										footer: footer
									})
								);
							});
					}
				}
			}
		}

		if (iniciacon == `${servidor.prefix}unban`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta ? pregunta : message.member.hasPermission('BAN_MEMBERS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				message.channel.send('Comando inactivo');
			}
		}

		if (iniciacon == `${servidor.prefix}clearmute`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MUTE_MEMBERS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				let user = message.mentions.users.first();
				if (!user) {
					message.channel.send(
						embed({
							title: 'Limpiar silencios',
							description: `${servidor.prefix}clearmute @tag#1234`,
							footer
						})
					);
				} else {
					let usuariosancionado = init.usuario(servidor, user.id);
					usuariosancionado.mute = 0;
					init.setUsuario(servidor, user.id, usuariosancionado);
					let mensaje = {
						title: 'Historial limpiado',
						description: `Se ha limpiado el historial de <@!${user.id}>`,
						footer
					};
					message.channel.send(embed(mensaje));
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensaje);
					}
				}
			}
		}

		// MUTE
		if (iniciacon == `${servidor.prefix}mute`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta ? pregunta : message.member.hasPermission('MUTE_MEMBERS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Silenciar',
							description: `Para usar ${
								servidor.prefix
							}mute <tag> <tiempo> <razon>`,
							footer
						})
					);

				let muterol = message.guild.roles.cache.get(servidor.mute);
				if (muterol) {
					const user = message.mentions.users.first();
					if (!user) {
						message.channel.send(
							embed({
								title: 'Servidor',
								description: 'Mencione el usuario al que quiere silenciar.',
								footer
							})
						);
					} else {
						const member = message.guild.member(user);
						if (!member) {
							message.channel.send(noesta);
						} else {
							// USUARIO SANCIONADO
							let usuariosancionado = init.usuario(servidor, member.id);

							let cadena = message.content;
							let subcadena = cadena.split(' ', 4);
							let tiempomute = '';
							let timemostrar = '';
							let razon = cadena.slice(
								subcadena[0].length + subcadena[1].length + 2
							);
							if (!subcadena[2]) {
								timemostrar = 'Nunca, es permanente';
							} else {
								if (!timems(subcadena[2])) {
									timemostrar = 'Nunca, es permanente';
								} else {
									razon = razon.slice(subcadena[2].length);
									tiempomute = timems(subcadena[2]);
									timemostrar = getTimeLong(tiempomute);
									timeout(tiempomute, member, servidor.mute);
								}
							}
							if (!razon) {
								razon = 'Sin razon';
							}
							member.roles.add(servidor.mute);
							usuariosancionado.mute = usuariosancionado.mute + 1;
							init.setUsuario(servidor, member.id, usuariosancionado);
							let mensaje = embed({
								title: 'Servidor',
								description: `El usuario <@!${
									member.id
								}> ha sido silenciado por <@!${message.author.id}>.`,
								fields: [
									{ title: 'Tiempo', text: `Expira ${timemostrar}` },
									{ title: 'Razon', text: razon },
									{ title: 'Veces silenciado', text: usuariosancionado.mute }
								],
								footer
							});
							message.channel.send(mensaje);

							let registros = message.guild.channels.cache.get(
								servidor.registros
							);
							if (registros) {
								registros.send(mensaje);
							}

							messagePrivate(message, member.id, embed({
									title: `Servidor | ${message.guild.name}`,
									description: `Has sido silenciado del servidor por <@!${
										message.author.id
									}>.`,
									fields: [
										{ title: 'Razon', text: razon },
										{ title: 'Expira en', text: `${timemostrar}` }
									],
									footer
								})
							);
						}
					}
				} else {
					message.channel.send(
						embed({
							title: 'Servidor',
							description: 'No hay rol de Silenciado.',
							footer
						})
					);
				}
			}
		}

		if (iniciacon == `${servidor.prefix}unmute`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MUTE_MEMBERS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Desilenciar',
							description: `Para usar ${servidor.prefix}unmute <tag> <razon>`,
							footer
						})
					);

				const user = message.mentions.users.first();
				if (!user) {
					message.channel.send(
						embed({
							title: 'Servidor',
							description: 'Mencione al usuario que quiere Desilenciar.',
							footer
						})
					);
				} else {
					const member = message.guild.member(user);
					if (!member) {
						message.channel.send(noesta);
					} else {
						let razon = message.content.slice(
							iniciacon.length + 2 + `<@!${member.id}>`.length
						);
						let realrazon = razon ? razon : 'No hay razon';
						member.roles
							.remove(servidor.mute, 'Demutearlo')
							.then(() => {
								let usuariosancionado = init.usuario(servidor, member.id);
								usuariosancionado.mute = usuariosancionado.mute - 1;
								init.setUsuario(servidor, usuariosancionado.usuario, usuario);
								let mensaje = embed({
									title: 'Servidor',
									description: `El usuario <@!${
										member.id
									}> ha sido desilenciado por <@!${message.author.id}>`,
									fields: [
										{ title: 'Razon', text: realrazon },
										{ title: 'Veces silenciado', text: usuariosancionado.mute }
									],
									footer
								});
								message.channel.send(mensaje);
								let registros = message.guild.channels.cache.get(
									servidor.registros
								);
								if (registros) {
									registros.send(mensaje);
								}
								messagePrivate(
									message,
									member.id,
									embed({
										title: `Servidor | ${message.guild.name}`,
										description: `Has sido desilenciado del servidor por <@!${
											message.author.id
										}>.`,
										fields: [{ title: 'Razon', text: realrazon }],
										footer
									})
								);
							})
							.catch(() => {
								message.channel.send(
									embed({
										title: 'Servidor',
										description: 'Este usuario no esta silenciado.',
										footer
									})
								);
							});
					}
				}
			}
		}

		if (iniciacon == `${servidor.prefix}warn`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MUTE_MEMBERS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				let user = message.mentions.users.first();
				if (!user) {
					message.channel.send(
						embed({
							title: 'Servidor',
							description: 'Menciona al usuario que quieres avisar.',
							footer
						})
					);
				} else {
					if (!message.content.slice(iniciacon.length + 1))
						return message.channel.send(
							embed({
								title: 'Avisos a un usuario',
								description: `Para usar ${servidor.prefix}warn <tag> <razon>`,
								footer
							})
						);

					const member = message.guild.member(user.id);
					if (!member) {
						message.channel.send(
							embed({
								title: 'Servidor',
								description: 'Este usuario no se encuentra en el servidor.',
								footer
							})
						);
					} else {
						let usuariosancionado = init.usuario(servidor, member.id);
						let razon = message.content.slice(
							iniciacon.length + 3 + `<@!${member.id}>`.length
						);
						let realrazon = razon ? razon : 'No hay razon';
						usuariosancionado.warn = usuariosancionado.warn + 1;
						init.setUsuario(servidor, member.id, usuariosancionado);

						let mensaje = embed({
							title: 'Usuario advertido',
							description: `El usuario <@!${
								member.id
							}> ha sido advertido por <@!${message.author.id}>`,
							fields: [
								{ title: 'Razon', text: realrazon },
								{ title: 'Veces avisado', text: usuariosancionado.warn }
							],
							footer
						});
						message.channel.send(mensaje);

						let registros = message.guild.channels.cache.get(servidor.registros);
						if (registros) {
							registros.send(mensaje);
						}
					}
				}
			}
		}

		if (iniciacon == `${servidor.prefix}unwarn`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MUTE_MEMBERS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				let user = message.mentions.users.first();
				if (!user) {
					message.channel.send(
						embed({
							title: 'Servidor',
							description: 'Menciona al usuario que quieres quitar el aviso.',
							footer
						})
					);
				} else {
					if (!message.content.slice(iniciacon.length + 1))
						return message.channel.send(
							embed({
								title: 'Avisos a un usuario',
								description: `Para usar ${servidor.prefix}unwarn <tag> <razon>`,
								footer
							})
						);

					const member = message.guild.member(user.id);
					if (!member) {
						message.channel.send(
							embed({
								title: 'Servidor',
								description: 'Este usuario no se encuentra en el servidor.',
								footer
							})
						);
					} else {
						let usuariosancionado = init.usuario(servidor, member.id);
						let razon = message.content.slice(
							iniciacon.length + 2 + `<@!${member.id}>`.length
						);
						let realrazon = razon ? razon : 'No hay razon';
						usuariosancionado.warn = usuariosancionado.warn - 1;
						init.setUsuario(servidor, member.id, usuariosancionado);

						let mensaje = embed({
							title: 'quitarwarn',
							description: `El usuario <@!${
								member.id
							}> se la ha quitado un warn por <@!${message.author.id}>`,
							fields: [
								{ title: 'Razon', text: realrazon },
								{ title: 'Veces avisado', text: usuariosancionado.warn }
							],
							footer
						});
						message.channel.send(mensaje);

						let registros = message.guild.channels.cache.get(servidor.registros);
						if (registros) {
							registros.send(mensaje);
						}
					}
				}
			}
		}

		if (iniciacon == `${servidor.prefix}encuesta`) {
			let separar = message.content.split('/', 9);
			let encuesta = separar[0].substring(iniciacon.length + 1);
			let permisos = message.member.hasPermission('ADMINISTRATOR');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Encuesta',
							description: `Para usar ${
								servidor.prefix
							}encuesta <text> <opciones/opciones2>`,
							footer
						})
					);

				let numeros = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
				let reacciones = [];
				separar.splice(0, 1);
				let modalidades = ``;
				for (let i = 0; i < separar.length; i++) {
					modalidades += `**${i + 1}**.${separar[i]}\n`;
					reacciones.push(numeros[i]);
					if (i == separar.length - 1) {
						return message.channel
							.send(
								embed({
									title: 'Encuesta',
									description: `${encuesta}\n\n ${modalidades}`,
									footer: `Encuesta hecha por ${message.author.tag}`
								})
							)
							.then(msg => {
								for (let i = 0; i < reacciones.length; i++) {
									msg.react(reacciones[i]);
								}
								message.delete();
							});
					}
				}
			}
		}

		// COMANDOS DE TICKETS
		if (iniciacon == `${servidor.prefix}nuevo`) {
			const categoria = message.guild.channels.cache.get(
				servidor.categorytickets
			);
			const razon = message.content.slice(iniciacon.length + 1);
			if (!categoria) {
				message.channel.send(embed({
					title: 'Tickets',
					description: 'Esta opcion no esta habilitada en el servidor.',
					footer
				}));
			} else {
				let buscando_ticket = servidor.tickets.find(ch => ch.author == message.author.id);
				if(buscando_ticket) return message.channel.send(embed({
					title: "Tickets",
					description: `<@!${message.author.id}> ya tienes un ticket abierto. <#${buscando_ticket.id}>`,
					footer
				}));
				let ticketemoji = '🎫';
				message.guild.channels
					.create(`${ticketemoji}ticket-${message.author.username}`)
					.then(este => {
						message.channel.send(
							embed({
								title: 'Tickets',
								description:
									'Has creado un ticket, aqui se muestra algo de información',
								fields: [
									{
										title: 'Creado',
										text: `${forDate(new Date()).dia} de ${forDate(new Date()).mes} del ${forDate(new Date()).año}`
									}
								],
								footer
							})
						);
						este.setParent(categoria.id).then(este2 => {
							let mensaje = embed({
								title: 'Ticket creado',
								description: razon ? razon : 'No hay razon',
								footer: {
									text: `ID: ${este.id} - Creado por ${message.author.tag}`,
									icon: message.author.avatarURL()
								}
							});
							este2.send(mensaje);
							este2.send(``);
							let registros = message.guild.channels.cache.get(
								servidor.registros
							);
							if (registros) {
								registros.send(mensaje);
							}

							message.delete();
							init.setTicket(
								{
									id: este2.id,
									razon: razon ? razon : 'No hay razon',
									author: message.author.id,
									creado: new Date()
								},
								servidor
							);

							este2.updateOverwrite(
								message.author.id,
								{
									SEND_MESSAGES: true,
									VIEW_CHANNEL: true
								},
								'metiendolo'
							);
							let staff = message.guild.roles.cache.find(
								ch => ch.id == servidor.staff
							);
							if (staff)
								return este2.updateOverwrite(
									staff,
									{
										SEND_MESSAGES: true,
										VIEW_CHANNEL: true
									},
									'metiendolo'
								);
						});
					});
			}
		}

		if (iniciacon == `${servidor.prefix}ticket`) {
			const categoria = message.guild.channels.cache.get(
				servidor.categorytickets
			);
			const razon = message.content.slice(iniciacon.length + 1);
			if (!categoria) {
				message.channel.send(embed({
					title: 'Tickets',
					description: 'Esta opcion no esta habilitada en el servidor.',
					footer
				}));
			} else {
				let buscando_ticket = servidor.tickets.find(ch => ch.author == message.author.id);
				if(buscando_ticket) return message.channel.send(embed({
					title: "Tickets",
					description: `<@!${message.author.id}> ya tienes un ticket abierto. <#${buscando_ticket.id}>`,
					footer
				}));
				let ticketemoji = '🎫';
				message.guild.channels
					.create(`${ticketemoji}ticket-${message.author.username}`)
					.then(este => {
						message.channel.send(
							embed({
								title: 'Tickets',
								description:
									'Has creado un ticket, aqui se muestra algo de información',
								fields: [
									{
										title: 'Creado',
										text: `${forDate(new Date()).dia} de ${forDate(new Date()).mes} del ${forDate(new Date()).año}`
									}
								],
								footer
							})
						);
						este.setParent(categoria.id).then(este2 => {
							let mensaje = embed({
								title: 'Ticket creado',
								description: razon ? razon : 'No hay razon',
								footer: {
									text: `ID: ${este.id} - Creado por ${message.author.tag}`,
									icon: message.author.avatarURL()
								}
							});
							este2.send(mensaje);
							este2.send(``);
							let registros = message.guild.channels.cache.get(
								servidor.registros
							);
							if (registros) {
								registros.send(mensaje);
							}

							message.delete();
							init.setTicket(
								{
									id: este2.id,
									razon: razon ? razon : 'No hay razon',
									author: message.author.id,
									creado: new Date()
								},
								servidor
							);

							este2.updateOverwrite(
								message.author.id,
								{
									SEND_MESSAGES: true,
									VIEW_CHANNEL: true
								},
								'metiendolo'
							);
							let staff = message.guild.roles.cache.find(
								ch => ch.id == servidor.staff
							);
							if (staff)
								return este2.updateOverwrite(
									staff,
									{
										SEND_MESSAGES: true,
										VIEW_CHANNEL: true
									},
									'metiendolo'
								);
						});
					});
			}
		}

		// info ticket
		if (iniciacon == `${servidor.prefix}infoticket`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('VIEW_CHANNEL');
			const ticket = servidor.tickets.find(ch => ch.id == message.channel.id);
			if (!ticket) {
				message.channel
					.send(
						embed({
							title: 'Tickets',
							description: 'Esto no es un ticket',
							footer: {
								text: `Este mensaje se eliminara en 5segundos - Ejecutado por ${
									message.author.tag
								}`,
								icon: message.author.avatarURL()
							}
						})
					)
					.then(msg => {
						setTimeout(() => {
							msg.delete();
						}, 5500);
					});
			} else {
				const member = message.guild.member(ticket.author);
				message.channel.send(
					embed({
						title: `Ticket información`,
						description:
							'Aqui se encuentra algo de información acerca de este ticket.',
						fields: [
							{ title: 'Creado por', text: `<@!${member.id}>` },
							{ title: 'Razon', text: ticket.razon },
							{
								title: 'Creado',
								text: `Creado hace ${getTimeLong(
									getRemainTime(ticket.creado).remainTime
								)}`
							}
						],
						footer: {
							text: `ID: ${ticket.id} - Ejecutado por ${message.author.tag}`,
							icon: message.author.avatarURL()
						}
					})
				);
			}
		}
		if (iniciacon == `${servidor.prefix}cerrar`) {
			const ticket = servidor.tickets.find(ch => ch.id == message.channel.id);
			if (!ticket) {
				message.channel
					.send(
						embed({
							title: 'Tickets',
							description: 'Esto no es un ticket',
							footer: {
								text: `Este mensaje se eliminara en 5segundos - Ejecutado por ${
									message.author.tag
								}`,
								icon: message.author.avatarURL()
							}
						})
					)
					.then(msg => {
						setTimeout(() => {
							msg.delete();
						}, 5500);
					});
			} else {
				const motivo = message.content.slice(iniciacon.length + 1);
				messagePrivate(
					message,
					ticket.author,
					embed({
						title: `Tickets | ${message.guild.name}`,
						description: 'Tu ticket `' + ticket.razon + '` ha sido cerrado.',
						fields: [
							{ title: 'Cerrado por', text: `<@!${message.author.id}>` },
							{
								title: 'Creado',
								text: `Hace ${getTimeLong(
									getRemainTime(ticket.creado).remainTime
								)}`
							},
							{ title: 'Razon', text: motivo ? motivo : 'No hay razon' }
						],
						footer
					})
				);
				let mensaje = embed({
					title: 'Tickets',
					description: `Este ticket ha sido cerrado. Se eliminara en 5 segundos.`,
					fields: [
						{ title: 'Razon de cierre', text: motivo ? motivo : 'No hay razon' }
					],
					footer
				});
				let registros = message.guild.channels.cache.get(servidor.registros);
				if (registros) {
					mensaje.title = `Tickets | ${message.channel.name}`;
					registros.send(mensaje);
				}
				message.channel.send(mensaje);
				setTimeout(() => {
					message.channel.delete();
				}, 5500);
				init.removeTicket(ticket, servidor);
			}
		}
		if (iniciacon == `${servidor.prefix}tematicket`) {
			const ticket = servidor.tickets.find(ch => ch.id == message.channel.id);
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_CHANNELS');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!ticket) {
					message.channel
						.send(
							embed({
								title: 'Ticket',
								description: 'Esto no es un ticket',
								footer: {
									text: `Este mensaje se eliminara en 5segundos - Ejecutado por ${
										message.author.tag
									}`,
									icon: message.author.avatarURL()
								}
							})
						)
						.then(msg => {
							setTimeout(() => {
								msg.delete();
							}, 5500);
						});
				} else {
					const name = message.content.slice(iniciacon.length + 1);
					if (!name)
						return message.channel.send(
							embed({
								title: 'Ticket',
								description: 'Ponga el nuevo tema del ticket.',
								footer
							})
						);
					message.channel.setName(name);
					message.channel.send(
						embed({
							title: 'Ticket',
							description: `El tema del ticket a cambiado a: ${name}`,
							footer
						})
					);
					messagePrivate(
						message,
						ticket.author,
						embed({
							title: `Tickets | ${message.guild.name}`,
							description:
								'Tu ticket `' + ticket.razon + '` ha sido cambiado de tema.',
							fields: [
								{ title: 'Cambiado por', text: `<@!${message.author.id}>` },
								{ title: 'Nuevo tema', text: name },
								{
									title: 'Creado',
									text: `Hace ${getTimeLong(
										getRemainTime(ticket.creado).remainTime
									)}`
								}
							],
							footer
						})
					);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(
							embed({
								title: `Tickets`,
								description: `El tema del ticket a cambiado a: ${name}`,
								fields: [
									{ title: 'Ticket creado por', text: `<@!${ticket.author}>` }
								],
								footer
							})
						);
					}
				}
			}
		}
		if (iniciacon == `${servidor.prefix}elevar`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_CHANNELS');
			const ticket = servidor.tickets.find(ch => ch.id == message.channel.id);
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!ticket) {
					message.channel
						.send(
							embed({
								title: 'Ticket',
								description: 'Esto no es un ticket',
								footer: {
									text: `Este mensaje se eliminara en 5segundos - Ejecutado por ${
										message.author.tag
									}`,
									icon: message.author.avatarURL()
								}
							})
						)
						.then(msg => {
							setTimeout(() => {
								msg.delete();
							}, 5500);
						});
				} else {
					const razon = message.content.slice(iniciacon.length + 1);
					message.channel.send(
						embed({
							title: 'Ticket',
							description: 'El ticket ha sido elevado.',
							fields: [{ title: 'Razon', text: razon ? razon : 'No hay razon' }],
							footer
						})
					);
					messagePrivate(
						message,
						ticket.author,
						embed({
							title: `Tickets | ${message.guild.name}`,
							description: 'Un ticket tuyo ha sido elevado.',
							fields: [
								{ title: 'Razon', text: razon ? razon : 'No hay razon' },
								{
									title: 'Creado',
									text: `Hace ${getTimeLong(
										getRemainTime(ticket.creado).remainTime
									)}`
								}
							]
						})
					);
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(
							embed({
								title: `Tickets`,
								description: `El tema del ticket ha sido elevado por <@!${
									message.author.id
								}>`,
								fields: [
									{ title: 'Ticket creado por', text: `<@!${ticket.author}>` },
									{
										title: 'Razon de elevado',
										text: razon ? razon : 'No hay razon'
									}
								],
								footer
							})
						);
					}
					let staff = message.guild.roles.cache.get(servidor.staff);
					if (staff)
						return message.channel.updateOverwrite(servidor.staff, {
							VIEW_CHANNEL: false,
							SEND_MESSAGES: false
						});
				}
			}
		}

		// COMANDOS DE SUGERENCIAS

		if (iniciacon == `${servidor.prefix}sugerir`) {
			if (!message.content.slice(iniciacon.length + 1))
				return message.channel.send(
					embed({
						title: 'Sugerencias',
						description: `Para hacer una sugerencia: ${servidor.prefix}sugerencia <texto de la sugerencia>`,
						footer
					})
				);

			const texto = message.content.slice(iniciacon.length + 1);
			const canal = message.guild.channels.cache.get(servidor.sugerencias);
			const sugerencias = canal ? canal : message.guild.channels.cache.find(ch => ch.name.includes('sugerencia'));
			if (!sugerencias) {
				message.channel.send(
					embed({
						title: 'Servidor',
						description: 'Las sugerencias estan desactivadas en este servidor.',
						footer
					})
				);
			} else {
				let sugerencia = {
					title: 'Sugerencia',
					description: `${texto}`
				};
				sugerencias.send(embed(sugerencia)).then(msg => {
					init.setSugerencia({
							id: msg.id,
							canal: msg.channel.id,
							author: message.author.id,
							sugerencia: texto
						},
						servidor
					);
					msg.react('<:checkmark:874712277247467581>');
					msg.react(`<:error:874712276270211072>`);
					sugerencia.footer = {text: `ID: ${msg.id} - Sugerido por ${message.author.tag} - ${forDate(new Date()).dia} de ${forDate(new Date()).mes} del año ${forDate(new Date()).año}`, icon: message.author.avatarURL()};
					msg.edit(embed(sugerencia)).then(() => {
						'yes'
					})
					let registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(
							embed({
								title: 'Sugerencia enviada',
								description: `<@!${message.author.id}> ha hecho una sugerencia.`,
								fields: [
									{ title: 'ID', text: msg.id },
									{ title: 'Sugerencia', text: texto }
								],
								footer
							})
						);
					}
				});
				message.channel.send(embed({
					title: 'Sugerencias',
					description: `Se ha enviado la sugerencia. \n\n **Sugerencia de**\n <@!${
						message.author.id
					}> \n\n**Contenido**\n${texto}`,
					footer
				}));
			}
		}

		if (iniciacon === `${servidor.prefix}sug.comentar`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Sugerencias',
							description: `Para usar ${
								servidor.prefix
							}sug.comentar <idsugerencia> <comentario>`,
							footer
						})
					);
				const todo = message.content.split(' ', 2);
				const id = todo[1];
				const sugerencia = servidor.sugs.find(ch => ch.id === id);
				if (!sugerencia)
					return message.channel.send(
						embed({
							title: 'Sugerencias',
							description: 'Ponga los datos de la sugerencia.',
							footer
						})
					);
				const canalsug = message.guild.channels.cache.get(sugerencia.canal);
				if (!canalsug) {
					message.channel.send(
						embed({
							title: 'Sugerencias',
							description: 'La sugerencia o el canal donde estaba ya no existe.',
							footer
						})
					);
				} else {
					const comentario = message.content.slice(
						todo[0].length + todo[1].length + 2
					);
					if (!comentario)
						return message.channel.send(
							embed({
								title: 'Sugerencias',
								description: 'Inserte el comentario que quiere colocar',
								footer
							})
						);

					canalsug.messages
						.fetch(sugerencia.id)
						.then(msg => {
							let mensaje = {
								title: 'Sugerencia comentada',
								description: `${
									sugerencia.sugerencia
								} \n\n **Sugerencia de**\n <@!${sugerencia.author}>`,
								fields: [{ title: 'Comentario', text: comentario }],
								footer: {
									text: `ID: ${sugerencia.id} - Comentario de ${
										message.author.tag
									} - ${forDate(new Date()).dia}/${forDate(new Date()).mes}/${
										forDate(new Date()).año
									}`,
									icon: message.author.avatarURL()
								}
							};
							messagePrivate(
								message,
								sugerencia.author,
								embed({
									title: `Sugerencias | ${message.guild.name}`,
									description: `Una sugerencia tuya ha sido comentada.`,
									fields: [
										{
											title: 'Sugerencia comentada',
											text: sugerencia.sugerencia
										},
										{ title: 'Comentario', text: comentario }
									],
									footer
								})
							);
							let mensaje2 = embed({
								title: 'Sugerencia comentada',
								description: `Se ha comentado la sugerencia con ID: ${
									sugerencia.id
								}`,
								fields: [
									{ title: 'Sugerencia', text: sugerencia.sugerencia },
									{ title: 'Sugerencia de', text: `<@!${sugerencia.author}>` },
									{ title: 'Comentario de', text: `<@!${message.author.id}>` },
									{ title: 'Comentario', text: comentario }
								],
								footer
							});
							message.channel.send(mensaje2);
							msg.edit(embed(mensaje));

							let registros = message.guild.channels.cache.get(
								servidor.registros
							);
							if (registros) {
								registros.send(mensaje2);
							}
						})
						.catch(() => {
							message.channel.send(
								embed({
									title: 'Sugerencias',
									description: 'Esta sugerencia ya no existe.',
									footer
								})
							);
						});
				}
			}
		}

		if (iniciacon === `${servidor.prefix}sug.aceptar`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Sugerencias',
							description: `Para usar ${
								servidor.prefix
							}sug.aceptar <idsugerencia> <comentario>`,
							footer
						})
					);

				const todo = message.content.split(' ', 2);
				const id = todo[1];
				const sugerencia = servidor.sugs.find(ch => ch.id === id);
				if (!sugerencia)
					return message.channel.send(
						embed({
							title: 'Sugerencias',
							description: 'Ponga los datos de la sugerencia.',
							footer
						})
					);
				const canalsug = message.guild.channels.cache.get(sugerencia.canal);
				if (!canalsug) {
					message.channel.send(
						embed({
							title: 'Sugerencias',
							description: 'La sugerencia o el canal donde estaba ya no existe.',
							footer
						})
					);
				} else {
					const comentario = message.content.slice(
						todo[0].length + todo[1].length + 2
					);
					if (!comentario)
						return message.channel.send(
							embed({
								title: 'Sugerencias',
								description:
									'Inserte la razon de su aceptación que quiere colocar',
								footer
							})
						);

					canalsug.messages
						.fetch(sugerencia.id)
						.then(msg => {
							let mensaje = {
								title: 'Sugerencia aceptada',
								description: `${
									sugerencia.sugerencia
								} \n\n **Sugerencia de**\n <@!${sugerencia.author}>`,
								fields: [{ title: 'Razon', text: comentario }],
								footer: {
									text: `ID: ${sugerencia.id} - Aceptado por ${
										message.author.tag
									} - ${forDate(new Date()).dia}/${forDate(new Date()).mes}/${
										forDate(new Date()).año
									}`,
									icon: message.author.avatarURL()
								}
							};
							messagePrivate(
								message,
								sugerencia.author,
								embed({
									title: `Sugerencias | ${message.guild.name}`,
									description: `Una sugerencia tuya ha sido aceptada.`,
									fields: [
										{ title: 'Sugerencia aceptada', text: sugerencia.sugerencia },
										{ title: 'Razon', text: comentario }
									],
									footer
								})
							);
							let mensaje2 = embed({
								title: 'Sugerencia aceptada',
								description: `Se ha aceptado la sugerencia con ID: ${
									sugerencia.id
								}`,
								fields: [
									{ title: 'Sugerencia', text: sugerencia.sugerencia },
									{ title: 'Sugerencia de', text: `<@!${sugerencia.author}>` },
									{ title: 'Aceptado por', text: `<@!${message.author.id}>` },
									{ title: 'Razon', text: comentario }
								],
								footer
							});
							message.channel.send(mensaje2);
							msg.edit(embed(mensaje));

							let registros = message.guild.channels.cache.get(
								servidor.registros
							);
							if (registros) {
								registros.send(mensaje2);
							}
						})
						.catch(() => {
							message.channel.send(
								embed({
									title: 'Sugerencias',
									description: 'Esta sugerencia ya no existe.',
									footer
								})
							);
						});
				}
			}
		}

		if (iniciacon === `${servidor.prefix}sug.denegar`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Sugerencias',
							description: `Para usar ${
								servidor.prefix
							}sug.denegar <idsugerencia> <comentario>`,
							footer
						})
					);

				const todo = message.content.split(' ', 2);
				const id = todo[1];
				const sugerencia = servidor.sugs.find(ch => ch.id === id);
				if (!sugerencia)
					return message.channel.send(
						embed({
							title: 'Sugerencias',
							description: 'Ponga los datos de la sugerencia.',
							footer
						})
					);
				const canalsug = message.guild.channels.cache.get(sugerencia.canal);
				if (!canalsug) {
					message.channel.send(
						embed({
							title: 'Sugerencias',
							description: 'La sugerencia o el canal donde estaba ya no existe.',
							footer
						})
					);
				} else {
					const comentario = message.content.slice(
						todo[0].length + todo[1].length + 2
					);
					if (!comentario)
						return message.channel.send(
							embed({
								title: 'Sugerencias',
								description: 'Inserte la razon de su deniegue que quiere colocar',
								footer
							})
						);

					canalsug.messages
						.fetch(sugerencia.id)
						.then(msg => {
							let mensaje = {
								title: 'Sugerencia denegada',
								description: `${
									sugerencia.sugerencia
								} \n\n **Sugerencia de**\n <@!${sugerencia.author}>`,
								fields: [{ title: 'Razon', text: comentario }],
								footer: {
									text: `ID: ${sugerencia.id} - Denegada por ${
										message.author.tag
									} - ${forDate(new Date()).dia}/${forDate(new Date()).mes}/${
										forDate(new Date()).año
									}`,
									icon: message.author.avatarURL()
								}
							};
							messagePrivate(
								message,
								sugerencia.author,
								embed({
									title: `Sugerencias | ${message.guild.name}`,
									description: `Una sugerencia tuya ha sido denegada.`,
									fields: [
										{ title: 'Sugerencia denegada', text: sugerencia.sugerencia },
										{ title: 'Razon', text: comentario }
									],
									footer
								})
							);
							let mensaje2 = embed({
								title: 'Sugerencia denegada',
								description: `Se ha denegado la sugerencia con ID: ${
									sugerencia.id
								}`,
								fields: [
									{ title: 'Sugerencia', text: sugerencia.sugerencia },
									{ title: 'Sugerencia de', text: `<@!${sugerencia.author}>` },
									{ title: 'Denegada por', text: `<@!${message.author.id}>` },
									{ title: 'Razon', text: comentario }
								],
								footer
							});
							message.channel.send(mensaje2);
							msg.edit(embed(mensaje));

							let registros = message.guild.channels.cache.get(
								servidor.registros
							);
							if (registros) {
								registros.send(mensaje2);
							}
						})
						.catch(() => {
							message.channel.send(
								embed({
									title: 'Sugerencias',
									description: 'Esta sugerencia ya no existe.',
									footer
								})
							);
						});
				}
			}
		}

		if (iniciacon === `${servidor.prefix}sug.eliminar`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				if (!message.content.slice(iniciacon.length + 1))
					return message.channel.send(
						embed({
							title: 'Sugerencias',
							description: `Para usar ${
								servidor.prefix
							}sug.eliminar <idsugerencia> <comentario>`,
							footer
						})
					);

				const todo = message.content.split(' ', 2);
				const id = todo[1];
				const sugerencia = servidor.sugs.find(ch => ch.id === id);
				if (!sugerencia)
					return message.channel.send(
						embed({
							title: 'Sugerencias',
							description: 'Ponga los datos de la sugerencia.',
							footer
						})
					);
				const canalsug = message.guild.channels.cache.get(sugerencia.canal);
				if (!canalsug) {
					message.channel.send(
						embed({
							title: 'Sugerencias',
							description: 'La sugerencia o el canal donde estaba ya no existe.',
							footer
						})
					);
				} else {
					const comentario = message.content.slice(
						todo[0].length + todo[1].length + 2
					);
					if (!comentario)
						return message.channel.send(
							embed({
								title: 'Sugerencias',
								description: 'Inserte la razon de su deniegue que quiere colocar',
								footer
							})
						);

					canalsug.messages
						.fetch(sugerencia.id)
						.then(msg => {
							msg.delete().then(() => {
								messagePrivate(
									message,
									sugerencia.author,
									embed({
										title: `Sugerencias | ${message.guild.name}`,
										description: `Una sugerencia tuya ha sido eliminada.`,
										fields: [
											{
												title: 'Sugerencia eliminada',
												text: sugerencia.sugerencia
											},
											{ title: 'Razon', text: comentario }
										],
										footer
									})
								);
								init.removeSugerencia(sugerencia, servidor);
								let mensaje2 = embed({
									title: 'Sugerencia eliminada',
									description: `Se ha eliminado la sugerencia con ID: ${
										sugerencia.id
									}`,
									fields: [
										{ title: 'Sugerencia', text: sugerencia.sugerencia },
										{ title: 'Sugerencia de', text: `<@!${sugerencia.author}>` },
										{ title: 'Denegada por', text: `<@!${message.author.id}>` },
										{ title: 'Razon', text: comentario }
									],
									footer
								});
								message.channel.send(mensaje2);

								let registros = message.guild.channels.cache.get(
									servidor.registros
								);
								if (registros) {
									registros.send(mensaje2);
								}
							});
						})
						.catch(() => {
							message.channel.send(
								embed({
									title: 'Sugerencias',
									description: 'Esta sugerencia ya no existe.',
									footer
								})
							);
						});
				}
			}
		}

		if (iniciacon == `${servidor.prefix}say`) {
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				nopermsdelete(message);
			} else {
				let texto = message.content.slice(iniciacon.length + 1);
				if (!texto)
					return message.channel.send(embed({
						title: 'Hablar',
						description: 'Ponga el texto que quiere hablar atravez del bot',
						fields: [{ title: 'De', text: `<@!${message.author.id}>` }],
						footer: 'Este mensaje sera eliminado en 5segundos'
					})).then(msg => {
						setTimeout(() => {
							msg.delete();
						}, 5500);
					});

				let all = await message.channel.fetchWebhooks();
				let typeweb = all.first();
				if(!typeweb){
					message.channel.send(texto);
				}else {
					await typeweb.send({
						content: texto,
						username: message.author.username,
						avatarURL: message.author.avatarURL()
					}).catch(() => {
						message.channel.send(texto);
					})
				}
				message.delete();
			}
		}

		if(iniciacon == `${servidor.prefix}skin`){
			let skin = message.content.slice(iniciacon.length + 1);
			if(!skin){
				message.channel.send(embed({
					title: "Skins",
					description: "Coloca el nombre del usuario al que quieres ver: "+servidor.prefix+"skin MordeKayh",
					footer
				}))
			}else {
				const minecraft = require('mojang-minecraft-api');

				let dataskin = minecraft.getUUID(skin).then((data) => {
					message.channel.send(embed({
						title: `Skin ${skin}`,
						description: "Se ha encontrado la skin.",
						image: `https://mc-heads.net/body/${skin}/right`,
						footer: {icon: message.author.avatarURL(), text: `${message.author.username}`}
					}))
				}).catch(() => {
					message.channel.send(embed({
						title: "Skins",
						description: "Esta skin no fue encontrada.",
						footer
					}))
				})
			}
		}

		if(iniciacon == `${servidor.prefix}head`){
			let skin = message.content.slice(iniciacon.length + 1);
			if(!skin){
				message.channel.send(embed({
					title: "Cabezas",
					description: "Coloca el nombre del usuario al que quieres ver: "+servidor.prefix+"head MordeKayh",
					footer
				}))
			}else {
				const minecraft = require('mojang-minecraft-api');

				let dataskin = minecraft.getSkinDataByName(skin).then((data) => {
					console.log(data);
					message.channel.send(embed({
						title: `Cabeza ${skin}`,
						description: "Se ha encontrado la cabeza.",
						image: `https://mc-heads.net/avatar/${skin}`,
						footer: {icon: message.author.avatarURL(), text: `${message.author.username}`}
					}))
				}).catch(() => {
					message.channel.send(embed({
						title: "Skins",
						description: "Esta skin no fue encontrada.",
						footer
					}))
				})
			}
		}

		// COMANDOS DEL SERVIDOR
		if (iniciacon == `${servidor.prefix}servidor`) {
			var server = message.guild;
			message.channel.send(
				new MessageEmbed()
					.setThumbnail(server.iconURL, true)
					.setAuthor(server.name, server.iconURL)
					.addField('Nombre', server.name, true)
					.addField('Region', server.region, true)
					.addField(
						'Creado',
						`Hace ${getTimeLong(getRemainTime(server.createdAt).remainTime)}`,
						true
					)
					.addField('Miembros', server.memberCount, true)
					.addField('Roles', server.roles.cache.size, true)
					.addField(
						'Canales',
						server.channels.cache.filter(ch => ch.type != 'category').size,
						true
					)
					.addField('Dueño del servidor', `<@!${message.guild.ownerID}>`)
					.setThumbnail(server.iconURL())
					.setColor(0x66b3ff)
			);
		}

		// COMANDOS DE LA CUENTA
		if (iniciacon == `${servidor.prefix}me`) {
			let entrada = getTimeLong(getRemainTime(message.member.joinedAt).remainTime);
			let creacion = getTimeLong(getRemainTime(message.author.createdAt).remainTime);
			let mention = message.mentions.users.first();
			let pregunta = message.member.roles.cache.get(servidor.staff);
			const permisos = pregunta
				? pregunta
				: message.member.hasPermission('MANAGE_GUILD');
			const cuenta = embed({
				title: `${message.author.tag}`,
				description: `Aqui estan los datos de tu cuenta: \n **Creación de la cuenta: **hace ${creacion} \n **Entrada:** hace ${entrada} \n **Apodo: ** ${
					message.member.nickname ? message.member.nickname : 'No tiene'
				} \n **Nivel: **${usuario.nivel} \n **Exp: **${usuario.xp} / ${
					usuario.xpnext
				} \n **Mensajes enviados: **${usuario.mensajes}`,
				thumbnail: message.author.avatarURL(),
				footer
			});

			if (!permisos) {
				message.channel.send(cuenta);
			} else {
				if (!mention) {
					message.channel.send(cuenta);
				} else {
					const member = message.guild.member(mention.id);
					if (!member) {
						message.channel.send(noesta);
					} else {
						const user = init.usuario(servidor, member.id);
						const entrada_member = getTimeLong(
							getRemainTime(member.joinedAt).remainTime
						);
						const creacion_member = getTimeLong(
							getRemainTime(member.user.createdAt).remainTime
						);
						message.channel.send(
							embed({
								title: `Cuenta ${member.user.tag}`,
								description: `Aqui estan los datos de la cuenta: \n **Creación de la cuenta: **hace ${creacion_member} \n **Entrada:** hace ${entrada_member} \n **Apodo: ** ${
									member.nickname ? member.nickname : 'No tiene'
								} \n **Nivel: **${user.nivel} \n **Exp: **${user.xp} / ${
									user.xpnext
								} \n **Mensajes enviados: **${
									user.mensajes
								} \n **Veces silenciado: **${user.mute} \n **Veces avisado: **${
									user.warn
								} \n **Veces expulsado: **${user.kick} \n **Veces vetado: **${
									user.ban
								}`,
								thumbnail: member.user.avatarURL(),
								footer
							})
						);
					}
				}
			}
		}

		if(iniciacon == `${servidor.prefix}level`){
			const realcanvas = require('canvacord');
			const rank = new realcanvas.Rank()
	    .setAvatar(`https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}`)
	    .setCurrentXP(usuario.xp)
	    .setRequiredXP(usuario.xpnext)
	    .setStatus("dnd")
	    .setProgressBar("#FFFFFF", "COLOR")
	    .setUsername(message.author.username)
	    .setLevel(usuario.nivel, 'NIVEL', true)
	    .setDiscriminator(message.author.discriminator)
	    .setCustomStatusColor('#919aa1')
	    .setRank(usuario.mensajes/1000);

	    rank.build().then(data => {
		    const attachment = new MessageAttachment(data, "RankCard.png");
				message.channel.send(attachment);
		  });
		}

		if (iniciacon == `${servidor.prefix}crearcomando`) {
			let permisos = message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				message.channel.send(nopermisos);
			} else {
				const comandonombre = message.content.slice(iniciacon.length + 1);
				const comandos = init.getComandos(servidor)?init.getComandos(servidor):[];
				if (!comandonombre) {
					message.channel.send(
						embed({
							title: 'Comandos personalizados',
							description: `Uso correcto ${
								servidor.prefix
							}crearcomando <nombre comando>`,
							footer
						})
					);
				} else {
					let si = comandos.find(ch => ch.comando == comandonombre);
					if (si) {
						message.channel.send(
							embed({
								title: 'Comandos personalizados',
								description: 'Este comando ya existe.',
								footer
							})
						);
					} else {
						let comandonuevo = {
							id: message.id,
							creador: message.author.id,
							comando: comandonombre,
							respuesta: null,
							tipo: null,
							permisos: null
						};
						servidor.commandsper = comandos;
						servidor.commandsper.push(comandonuevo);
						console.log(servidor)
						init.setServidor(servidor);

						let mensaje = embed({
							title: 'Comandos',
							description: `Se ha creado un nuevo comando personalizado.`,
							fields: [
								{
									title: 'Comando',
									text: `${servidor.prefix}${comandonuevo.comando}`
								},
								{
									title: 'Respuesta',
									text: comandonuevo.respuesta
										? comandonuevo.respuesta
										: 'No tiene respuesta'
								},
								{ title: 'Creado por', text: `<@!${message.author.id}>` },
								{ title: 'ID del comando', text: comandonuevo.id },
								{
									title: 'Tipo de respuesta',
									text: comandonuevo.tipo ? comandonuevo.tipo : 'Tipo texto'
								},
								{
									title: 'Comando para',
									text: comandonuevo.permisos
										? comandonuevo.permisos
										: 'Para todos'
								}
							],
							footer
						});

						message.channel.send(mensaje);
						const registros = message.guild.channels.cache.get(
							servidor.registros
						);
						if (registros) {
							registros.send(mensaje);
						}
					}
				}
			}
		}

		if (iniciacon == `${servidor.prefix}editarcomando`) {
			let permisos = message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				message.channel.send(nopermisos);
			} else {
				const opciones = message.content.split(' ', 3);
				const idsearch = opciones[1];
				if (!idsearch) {
					message.channel.send(
						embed({
							title: 'Editar comandos',
							description: `Uso correcto ${
								servidor.prefix
							}editarcomando <id del comando>`,
							footer
						})
					);
				} else {
					const comandos = converterArray(servidor.commandsper?servidor.commandsper:{});
					const busquedad = comandos.find(ch => ch.id == idsearch);
					const opcion = opciones[2];
					if (!busquedad){
						message.channel.send(
							embed({
								title: 'Comandos',
								description: 'Este comando no existe.',
								footer
							})
						);
					} else {
						if (!opcion)
							return message.channel.send(
								embed({
									title: 'Editar comandos',
									description: `Uso correcto ${
										servidor.prefix
									}editarcomando <id del comando> <opcion a cambiar> <detalles>`
								})
							);

						if (opcion == 'respuesta') {
							if (busquedad.tipo == 'embed') {
								message.channel.send(
									embed({
										title: 'Error',
										description:
											'Este mensaje es de tipo embed. \n titulo \n texto',
										footer
									})
								);
							} else {
								let res = message.content.slice(
									opciones[0].length + 3 + opciones[1].length + opciones[2].length
								);
								busquedad.respuesta = res
									? res
									: 'Este comando no tiene respuesta';
								init.setComando(busquedad, servidor);
								let mensaje = embed({
									title: 'Comando editado',
									description: `Se ha editado el comando de ID ${
										busquedad.id
									}. Aqui esta la información:`,
									fields: [
										{
											title: 'Comando',
											text: `${servidor.prefix}${busquedad.comando}`
										},
										{
											title: 'Respuesta',
											text: busquedad.respuesta
												? busquedad.respuesta
												: 'No tiene respuesta'
										},
										{ title: 'Creado por', text: `<@!${message.author.id}>` },
										{ title: 'ID del comando', text: busquedad.id },
										{
											title: 'Tipo de respuesta',
											text: busquedad.tipo ? busquedad.tipo : 'Tipo texto'
										},
										{
											title: 'Cambio hecho',
											text: 'Se ha cambiado la respuesta de este comando.'
										},
										{
											title: 'Comando para',
											text: busquedad.permisos ? busquedad.permisos : 'Para todos'
										}
									],
									footer
								});
								message.channel.send(mensaje);
								const registros = message.guild.channels.cache.get(
									servidor.registros
								);
								if (registros) {
									registros.send(mensaje);
								}
							}
						}
						if (opcion == 'comando') {
							let nuevaentrada = message.content.slice(
								opciones[0].length + 3 + opciones[1].length + opciones[2].length
							);
							if (!nuevaentrada) {
								message.channel.send(
									embed({
										title: 'Editar comando',
										description: `Ingrese el nuevo nombre del comando.`,
										footer
									})
								);
							} else {
								if (servidor.commandsper.find(ch => ch.comando == nuevaentrada)) {
									return message.channel.send(
										embed({
											title: 'Comandos',
											description: 'Este comando ya existe.',
											footer
										})
									);
								} else {
									busquedad.comando = nuevaentrada;
									init.setComando(busquedad, servidor);
									let mensaje = embed({
										title: 'Comando editado',
										description: `Se ha editado el comando de ID ${
											busquedad.id
										}. Aqui esta la información:`,
										fields: [
											{
												title: 'Comando',
												text: `${servidor.prefix}${busquedad.comando}`
											},
											{
												title: 'Respuesta',
												text: busquedad.respuesta
													? busquedad.respuesta
													: 'No tiene respuesta'
											},
											{ title: 'Creado por', text: `<@!${message.author.id}>` },
											{ title: 'ID del comando', text: busquedad.id },
											{
												title: 'Tipo de respuesta',
												text: busquedad.tipo ? busquedad.tipo : 'Tipo texto'
											},
											{
												title: 'Cambio hecho',
												text: 'Se ha cambiado el nombre del comando.'
											},
											{
												title: 'Comando para',
												text: busquedad.permisos
													? busquedad.permisos
													: 'Para todos'
											}
										],
										footer
									});
									message.channel.send(mensaje);
									const registros = message.guild.channels.cache.get(
										servidor.registros
									);
									if (registros) {
										registros.send(mensaje);
									}
								}
							}
						}
						if (opcion == 'permisos') {
							let nuevaentrada = message.content.slice(
								opciones[0].length + 3 + opciones[1].length + opciones[2].length
							);
							if (!nuevaentrada) {
								message.channel.send(
									embed({
										title: 'Editar comandos',
										description: `Uso correcto ${
											servidor.prefix
										}editarcomando <id comando> <opcion> <nueva opcion>`,
										footer
									})
								);
							} else {
								if (nuevaentrada == 'si') {
									busquedad.permisos = 'Para staff';
									init.setComando(busquedad, servidor);
									let mensaje = embed({
										title: 'Comando editado',
										description: `Se ha editado el comando de ID ${
											busquedad.id
										}. Aqui esta la información:`,
										fields: [
											{
												title: 'Comando',
												text: `${servidor.prefix}${busquedad.comando}`
											},
											{
												title: 'Respuesta',
												text: busquedad.respuesta
													? busquedad.respuesta
													: 'No tiene respuesta'
											},
											{ title: 'Creado por', text: `<@!${message.author.id}>` },
											{ title: 'ID del comando', text: busquedad.id },
											{
												title: 'Tipo de respuesta',
												text: busquedad.tipo ? busquedad.tipo : 'Tipo texto'
											},
											{
												title: 'Cambio hecho',
												text:
													'Se ha cambiado el permiso para ejecutar este comando.'
											},
											{
												title: 'Comando para',
												text: busquedad.permisos
													? busquedad.permisos
													: 'Para todos'
											}
										],
										footer
									});
									message.channel.send(mensaje);
									const registros = message.guild.channels.cache.get(
										servidor.registros
									);
									if (registros) {
										registros.send(mensaje);
									}
								} else if (nuevaentrada == 'no') {
									busquedad.permisos = undefined;
									init.setComando(busquedad, servidor);
									let mensaje = embed({
										title: 'Comando editado',
										description: `Se ha editado el comando de ID ${
											busquedad.id
										}. Aqui esta la información:`,
										fields: [
											{
												title: 'Comando',
												text: `${servidor.prefix}${busquedad.comando}`
											},
											{
												title: 'Respuesta',
												text: busquedad.respuesta
													? busquedad.respuesta
													: 'No tiene respuesta'
											},
											{ title: 'Creado por', text: `<@!${message.author.id}>` },
											{ title: 'ID del comando', text: busquedad.id },
											{
												title: 'Tipo de respuesta',
												text: busquedad.tipo ? busquedad.tipo : 'Tipo texto'
											},
											{
												title: 'Cambio hecho',
												text:
													'Se ha cambiado el permiso para ejecutar este comando.'
											},
											{
												title: 'Comando para',
												text: busquedad.permisos
													? busquedad.permisos
													: 'Para todos'
											}
										],
										footer
									});
									message.channel.send(mensaje);
									const registros = message.guild.channels.cache.get(
										servidor.registros
									);
									if (registros) {
										registros.send(mensaje);
									}
								} else {
									message.channel.send(
										embed({
											title: 'Comandos personalizados',
											description: 'Coloca `si` o `no` para los permisos.',
											footer
										})
									);
								}
							}
						}

						if (opcion == 'tipo') {
							let nuevaentrada = message.content.slice(
								opciones[0].length + 3 + opciones[1].length + opciones[2].length
							);
							if (!nuevaentrada) {
								message.channel.send(
									embed({
										title: 'Editar comandos',
										description: `Uso correcto ${servidor.prefix}editarcomand`,
										footer
									})
								);
							} else {
								if (nuevaentrada == 'texto') {
									busquedad.tipo = undefined;
									busquedad.respuesta =
										'Este comando ha sido cambiado y ya no tiene respuesta';
									init.setComando(busquedad, servidor);
									let mensaje = embed({
										title: 'Comando editado',
										description: `Se ha editado el comando de ID ${
											busquedad.id
										}. Aqui esta la información:`,
										fields: [
											{
												title: 'Comando',
												text: `${servidor.prefix}${busquedad.comando}`
											},
											{
												title: 'Respuesta',
												text: busquedad.respuesta
													? busquedad.respuesta
													: 'No tiene respuesta'
											},
											{ title: 'Creado por', text: `<@!${message.author.id}>` },
											{ title: 'ID del comando', text: busquedad.id },
											{
												title: 'Tipo de respuesta',
												text: busquedad.tipo ? busquedad.tipo : 'Tipo texto'
											},
											{
												title: 'Cambio hecho',
												text: 'Se ha cambiado el tipo de respuesta.'
											},
											{
												title: 'Comando para',
												text: busquedad.permisos
													? busquedad.permisos
													: 'Para todos'
											}
										],
										footer
									});
									message.channel.send(mensaje);
									const registros = message.guild.channels.cache.get(
										servidor.registros
									);
									if (registros) {
										registros.send(mensaje);
									}
								} else if (nuevaentrada == 'embed') {
									busquedad.tipo = 'embed';
									busquedad.respuesta = 'Este mensaje es de tipo embed.';
									busquedad.embed = {
										description:
											'Este comando ha sido cambiado y ya no tiene respuesta'
									};
									init.setComando(busquedad, servidor);
									let mensaje = embed({
										title: 'Comando editado',
										description: `Se ha editado el comando de ID ${
											busquedad.id
										}. Aqui esta la información:`,
										fields: [
											{
												title: 'Comando',
												text: `${servidor.prefix}${busquedad.comando}`
											},
											{
												title: 'Respuesta',
												text: busquedad.respuesta
													? busquedad.respuesta
													: 'No tiene respuesta'
											},
											{ title: 'Creado por', text: `<@!${message.author.id}>` },
											{ title: 'ID del comando', text: busquedad.id },
											{
												title: 'Tipo de respuesta',
												text: busquedad.tipo ? busquedad.tipo : 'Tipo texto'
											},
											{
												title: 'Cambio hecho',
												text: 'Se ha cambiado el tipo de respuesta.'
											},
											{
												title: 'Comando para',
												text: busquedad.permisos
													? busquedad.permisos
													: 'Para todos'
											}
										],
										footer
									});
									message.channel.send(mensaje);
									const registros = message.guild.channels.cache.get(
										servidor.registros
									);
									if (registros) {
										registros.send(mensaje);
									}
								} else {
									message.channel.send(
										embed({
											title: 'Comandos',
											description:
												'Esta opcion no existe. \n pon `texto` o `embed`',
											footer
										})
									);
								}
							}
						}

						if (opcion == 'titulo') {
							let nuevaentrada = message.content.slice(
								opciones[0].length + 3 + opciones[1].length + opciones[2].length
							);
							let tipo = busquedad.tipo;
							if (!tipo) {
								message.channel.send(
									embed({
										title: 'Comandos',
										description: 'Este comando no tiene respuesta embed.',
										footer
									})
								);
							} else {
								if (!nuevaentrada) {
									message.channel.send(
										embed({
											title: `Titulo del comando ${servidor.prefix}${
												busquedad.comando
											}`,
											description: 'Pon el titulo que quieres en el mensaje.',
											footer
										})
									);
								} else {
									const antes = busquedad.embed
										? busquedad.embed
										: { description: 'No hay entrada de descripcion' };
									busquedad.embed = {
										title: nuevaentrada,
										description: antes.description
											? antes.description
											: 'No hay entrada de descripcion'
									};
									init.setComando(busquedad, servidor);
									let mensaje = embed({
										title: 'Comando editado',
										description: `Se ha editado el comando de ID ${
											busquedad.id
										}. Aqui esta la información:`,
										fields: [
											{
												title: 'Comando',
												text: `${servidor.prefix}${busquedad.comando}`
											},
											{
												title: 'Respuesta',
												text: busquedad.respuesta
													? busquedad.respuesta
													: 'No tiene respuesta'
											},
											{ title: 'Creado por', text: `<@!${message.author.id}>` },
											{ title: 'ID del comando', text: busquedad.id },
											{
												title: 'Tipo de respuesta',
												text: busquedad.tipo ? busquedad.tipo : 'Tipo texto'
											},
											{
												title: 'Cambio hecho',
												text: 'Se ha cambiado el titulo del mensaje embed.'
											},
											{
												title: 'Comando para',
												text: busquedad.permisos
													? busquedad.permisos
													: 'Para todos'
											}
										],
										footer
									});
									message.channel.send(mensaje);
									const registros = message.guild.channels.cache.get(
										servidor.registros
									);
									if (registros) {
										registros.send(mensaje);
									}
								}
							}
						}

						if (opcion == 'texto') {
							let nuevaentrada = message.content.slice(
								opciones[0].length + 3 + opciones[1].length + opciones[2].length
							);
							let tipo = busquedad.tipo;
							if (!tipo) {
								message.channel.send(
									embed({
										title: 'Comandos',
										description: 'Este comando no tiene respuesta embed.',
										footer
									})
								);
							} else {
								if (!nuevaentrada) {
									message.channel.send(
										embed({
											title: `Texto del comando ${servidor.prefix}${
												busquedad.comando
											}`,
											description: 'Pon el texto que quieres en el mensaje.',
											footer
										})
									);
								} else {
									const antes = busquedad.embed
										? busquedad.embed
										: { description: 'No hay entrada de descripcion' };
									busquedad.embed = {
										title: antes.title ? antes.title : 'No tiene titulo',
										description: nuevaentrada
									};
									init.setComando(busquedad, servidor);
									let mensaje = embed({
										title: 'Comando editado',
										description: `Se ha editado el comando de ID ${
											busquedad.id
										}. Aqui esta la información:`,
										fields: [
											{
												title: 'Comando',
												text: `${servidor.prefix}${busquedad.comando}`
											},
											{
												title: 'Respuesta',
												text: busquedad.respuesta
													? busquedad.respuesta
													: 'No tiene respuesta'
											},
											{ title: 'Creado por', text: `<@!${message.author.id}>` },
											{ title: 'ID del comando', text: busquedad.id },
											{
												title: 'Tipo de respuesta',
												text: busquedad.tipo ? busquedad.tipo : 'Tipo texto'
											},
											{
												title: 'Cambio hecho',
												text: 'Se ha cambiado el texto del mensaje embed.'
											},
											{
												title: 'Comando para',
												text: busquedad.permisos
													? busquedad.permisos
													: 'Para todos'
											}
										],
										footer
									});
									message.channel.send(mensaje);
									const registros = message.guild.channels.cache.get(
										servidor.registros
									);
									if (registros) {
										registros.send(mensaje);
									}
								}
							}
						}
					}
				}
			}
		}

		if (iniciacon == `${servidor.prefix}eliminarcomando`) {
			let permisos = message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				message.channel.send(nopermisos);
			} else {
				let idsearch = message.content.slice(iniciacon.length + 1);
				let buscar = servidor.commandsper.find(ch => ch.id == idsearch);
				if (!buscar) {
					message.channel.send(
						embed({
							title: 'Comandos',
							description: 'Este comando no existe.',
							footer
						})
					);
				} else {
					init.removeComando(buscar, servidor);
					let mensaje = embed({
						title: 'Comando eliminado',
						description: `El comando con el ID ${buscar.id} ha sido eliminado`,
						footer
					});
					message.channel.send(mensaje);

					const registros = message.guild.channels.cache.get(servidor.registros);
					if (registros) {
						registros.send(mensaje);
					}
				}
			}
		}

		if (iniciacon == `${servidor.prefix}comandos`) {
			let permisos = message.member.hasPermission('MANAGE_GUILD');
			if (!permisos) {
				message.channel.send(nopermisos);
			} else {
				const comandos = converterArray(init.getComandos(servidor)?init.getComandos(servidor):{});
				if (!comandos) {
					message.channel.send(
						embed({
							title: 'Comandos personalizados',
							description: 'No hay comandos personalizados.',
							footer
						})
					);
				} else {
					let mensaje = {
						title: 'Comandos',
						description: 'Aqui esta la lista de comandos personalizados: \n',
						footer
					};
					comandos.forEach((element, i, array) => {
						mensaje.description += `\n **Comando: **${servidor.prefix}${
							element.comando
						} \n **ID: **${element.id} \n`;
					});
					message.channel.send(embed(mensaje));
				}
			}
		}

		if (iniciacon == `${servidor.prefix}invite`) {
			message.channel.send(
				embed({
					title: 'Invitame a tu servidor',
					description: `Puedes invitarme a tu servidor dandole click al titulo de este mensaje: "Invitame a tu servidor."`,
					url: `https://discord.com/oauth2/authorize?client_id=${bot.user.id}&scope=bot&permissions=8`,
					footer
				})
			);
		}
	});
}


module.exports = comandos;