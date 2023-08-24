const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const clientes = require('./clientes');
const domicilios = require('./domicilios');
const gruposServicios = require('./grupos-servicios');

const estado = {
    1: 'C',
    2: 'R',
    3: 'D'
}

async function migrar(){
    console.log('Migrando suscripciones...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    const [suscripciones] = await mysql.query('SELECT * FROM suscripcion');
    console.log(`Se van a migrar ${suscripciones.length} suscripciones`);
    for(let susc of suscripciones){
        const domi = (await postgres.query(`SELECT * FROM public.domicilio WHERE direccion = $1 AND idcliente = $2`, [domicilios.getDireccion(susc), clientes.convertirId(susc.cliente)])).rows[0];
        await postgres.query(`INSERT INTO public.suscripcion (
            id,
            monto,
            fecha_suscripcion,
            idcliente,
            iddomicilio,
            idservicio,
            estado,
            fecha_cambio_estado,
            gentileza,
            eliminado
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, false)`, [
            susc.idsuscripcion,
            susc.precio,
            susc.fecha_suscripcion,
            clientes.convertirId(susc.cliente),
            domi.id,
            gruposServicios.convertirIdServicio(susc.servicio),
            estado[susc.estado],
            susc.fecha_cambio_estado ?? susc.fecha_suscripcion,
            susc.tipo_suscripcion == 2
        ]);
    }

    await mysql.end();
    await postgres.end();
}

module.exports = { migrar }