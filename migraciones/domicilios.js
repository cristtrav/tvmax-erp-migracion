const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const clientes = require('./clientes');

const tiposDomicilios = {
    1: 'PRO',
    2: 'ALQ',
    3: 'PRE'
}

async function migrar() {
    console.log('Migrando domicilios...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    const [suscripciones] = await mysql.query('SELECT * FROM suscripcion');
    let registrados = 0;
    let omitidos = 0;
    for (let sus of suscripciones) {        
        const consultaDomicilios = await postgres.query('SELECT * FROM public.domicilio WHERE direccion = $1 AND idcliente = $2', [getDireccion(sus), clientes.convertirId(sus.cliente)]);        
        if(consultaDomicilios.rows.length == 0){
            registrados++;
            await postgres.query(`INSERT INTO public.domicilio (
                direccion, observacion, nro_medidor, idbarrio, idcliente, tipo, eliminado)
                VALUES($1, $2, $3, $4, $5, $6, false)`,
                [
                    getDireccion(sus),
                    getObservacion(sus),
                    sus.nro_medidor_electrico != null && sus.nro_medidor_electrico === '' ? null : sus.nro_medidor_electrico,
                    sus.barrio,
                    clientes.convertirId(sus.cliente),
                    tiposDomicilios[sus.tipo_vivienda]
                ]);
        }else omitidos++;
    }
    console.log(`${registrados} direcciones registradas.`)
    console.log(`${omitidos} direcciones omitidas.`)
    console.log('Estableciendo domicilios principales...')
    const [lstClientes] = await mysql.query(`SELECT * FROM cliente WHERE direccion IS NOT NULL`);
    for(let cli of lstClientes){
        await postgres.query(`UPDATE public.domicilio SET principal = true WHERE idcliente = $1 AND direccion = $2`,
        [clientes.convertirId(cli.idcliente), getDireccion({direccion: cli.direccion})])
    }

    await postgres.query(`SELECT setval('public.domicilio_id_seq', (SELECT MAX(id) FROM public.domicilio), true)`);

    await mysql.end();
    await postgres.end();
}

function getDireccion(suscripcion) {
    const indexOfParentesis = suscripcion.direccion.indexOf('(');
    if (indexOfParentesis != -1) return suscripcion.direccion.substring(0, indexOfParentesis).trim();
    return suscripcion.direccion.trim();
}

function getObservacion(suscripcion) {
    const indexOfParentesis = suscripcion.direccion.indexOf('(');
    if (indexOfParentesis != -1) return suscripcion.direccion.substring(indexOfParentesis);
    return null;
}

module.exports = { migrar, getDireccion, getObservacion }