const admin = require("firebase-admin");
const serviceAccount = require('../superipm-8cb1d-firebase-adminsdk-4bpzd-1a1bb4f9d7.json');
const {converterArray} = require('./helpers/necesarios.js');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://superipm-8cb1d-default-rtdb.firebaseio.com"
});
const db = admin.database();
const ref = db.ref();
const servidores = ref.child('servidores');

class databasehelper {
  start(){
    let servicio = servidores.once('value', (data) => {
      return data.toJSON();
    })
    return servicio;
  }
  set(data){
    servidores.set(data);
  }
}

function data(){
  return new databasehelper();
}

class initHelperDB {
  async servidor(idserver){
    let super_data = await data().start();
    let servers = super_data.toJSON();
    let allservers = servers?servers:{};
    let buscando_servidor = allservers[idserver];
    if(!buscando_servidor){
      let newserver = {
        server: idserver,
        usuarios: {},
        staff: null,
        categorytickets: null,
        sugerencias: null,
        comandos: null,
        anuncios: null,
        niveles: null,
        registros: null,
        mute: null,
        tickets: [],
        prefix: 's!',
        commandsper: [],
        sugs: []
      }
      servidores.child(idserver).set(newserver);
      this.server = newserver;
      return newserver;
    }else {
      this.server = buscando_servidor;
      return buscando_servidor;
    }
  }
  setServidor(dataserver){
    servidores.once('value', (data) => {
      let db = data.toJSON();
      servidores.child(dataserver.server).set(dataserver);
    })
  }
  usuario(server, iduser){
    let allusuarios = server.usuarios?server.usuarios:{};
    let buscar_usuario = allusuarios[iduser];
    if(!buscar_usuario){
      let user = {
        usuario: iduser,
        mute: 0,
        ban: 0,
        kick: 0,
        warn: 0,
        nivel: 1,
        xp: 0,
        xpnext: 560,
        mensajes: 0,
      }
      allusuarios[iduser] = user;
      server.usuarios = allusuarios;
      servidores.child(server.server).set(server);
      return user;
    }else {
      return buscar_usuario;
    }
  }
  setUsuario(server, iduser, info){
    let allusuarios = server.usuarios?server.usuarios:{};
    allusuarios[iduser] = info;
    server.usuarios = allusuarios;
    servidores.child(server.server).set(server);
  }
  setSugerencia(objeto, servidor){
    let allsugerencias = converterArray(servidor.sugs?servidor.sugs:{});
    allsugerencias.push(objeto);
    servidor.sugs = allsugerencias;
    this.setServidor(servidor);
  }
  removeSugerencia(objeto, servidor){
    servidor.sugs = converterArray(servidor.sugs?servidor.sugs:{});
    servidor.sugs.forEach((element, i, array) => {
      if(element.id === objeto.id){
        array.splice(i, 1);
        servidor.sugs = array;
        this.setServidor(servidor);
      }
    })
  }
  removeComando(objeto, servidor){
    servidor.commandsper = converterArray(servidor.commandsper?servidor.commandsper:{});
    servidor.commandsper.forEach((element, i, array) => {
      if(element.id == objeto.id){
        array.splice(i, 1);
        servidor.commandsper = array;
        this.setServidor(servidor);
      }
    })
  }
  setComando(comando, servidor){
    converterArray(servidor.commandsper?servidor.commandsper:{}).forEach((element, i, array) => {
      if(element.id == comando.id){
        array[i] = comando;
        servidor.commandsper = array;
        this.setServidor(servidor);
      }
    })
  }
  setTicket(ticket, servidor){
    servidor.tickets = converterArray(servidor.tickets?servidor.tickets:{});
    servidor.tickets.push(ticket);
    this.setServidor(servidor);
  } 
  removeTicket(ticket, servidor){
    servidor.tickets = converterArray(servidor.tickets?servidor.tickets:{});
    servidor.tickets.forEach( function(element, index, array) {
      if(element.id == ticket.id){
        array.splice(index, 1);
        servidor.tickets = array;
        this.setServidor(servidor);
      }
    });
  }
  getComandos(servidor){
    if(!servidor.commandsper){
      return undefined;
    }else {
      return servidor.commandsper;
    }
  }
  getPagina(namepagina){
    return data().start().then(data => {
      let db = data.toJSON();
      let buscando = JSON.parse(db.help).find(ch => ch.name.startsWith(namepagina));
      return buscando;
    })
  }
}

module.exports = {servidores, data, initHelperDB};