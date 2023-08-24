const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');

async function migrar() {
    console.log('Migrando timbrados...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    const [talonarios] = await mysql.query(
        `SELECT
            idtalonario,
            cod_establecimiento,
            inicio_vigencia,
            fin_vigencia,
            nro_actual,
            nro_fin,
            nro_inicio,
            timbrado,
            CASE
                WHEN nro_actual >= nro_fin OR now() >= fin_vigencia THEN false
                ELSE activo
            END AS activo
            FROM talonario_factura`
    );
    console.log(`Se van a migrar ${talonarios.length} timbrados...`);
    for(let talon of talonarios){
        await postgres.query(
            `INSERT INTO public.timbrado
                (id, cod_establecimiento, cod_punto_emision, nro_inicio, nro_fin, fecha_inicio_vigencia, fecha_vencimiento, nro_timbrado, ultimo_nro_usado, activo, eliminado)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)`,
                [convertirId(talon.idtalonario), talon.cod_establecimiento.split('-')[0], talon.cod_establecimiento.split('-')[1], talon.nro_inicio, talon.nro_fin, talon.inicio_vigencia, talon.fin_vigencia, talon.timbrado, talon.nro_actual, talon.activo]);
    }
    await mysql.end();
    await postgres.end();
}

function convertirId(id){
    return id + 10;
}

module.exports = { migrar, convertirId }