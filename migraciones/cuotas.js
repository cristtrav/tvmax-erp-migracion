const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const gruposServicios = require('./grupos-servicios');

async function migrar(){
    console.log('Migrando cuotas...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    const [cuotas] = await mysql.query(`SELECT * FROM cuota`);
    console.log(`Se van a migrar ${cuotas.length} cuotas...`);
    for(let cuota of cuotas){
        await postgres.query(`INSERT INTO public.cuota (
            id,
            observacion,
            fecha_vencimiento,
            monto,
            idsuscripcion,
            idservicio,
            fecha_pago,
            pagado,
            eliminado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,[
            cuota.idcuota,
            cuota.observacion != null && cuota.observacion == '' ? null : cuota.observacion,
            cuota.fecha_vencimiento,
            cuota.monto_cuota,
            cuota.suscripcion,
            gruposServicios.convertirIdServicio(cuota.servicio),
            cuota.fecha_pago,
            cuota.cancelado
        ]);
    }
    await postgres.query(`SELECT setval('public.cuota_id_seq', (SELECT MAX(id) FROM public.cuota), true)`)
    
    await mysql.end();
    await postgres.end();
}

module.exports = { migrar };