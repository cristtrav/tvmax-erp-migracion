const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const usuarios = require('./usuarios');

async function migrar() {
    console.log('Migrando cobros...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    const [cobros] = await mysql.query(
        `SELECT DISTINCT
            cobro.cod_trans_banco,
            cobro.fecha,
            cobro.cobrador,
            cobro.funcionario_registro,
            factura.idfactura
        FROM tvmaxbd.cobro
        INNER JOIN detalle_factura ON detalle_factura.iddetalle_factura = cobro.detalle_factura
        INNER JOIN factura ON factura.idfactura = detalle_factura.factura
        WHERE cobro.anulado = false`);

    console.log(`Se van a migrar ${cobros.length} cobros.`)
    for(let cobro of cobros){
        await postgres.query(
            `INSERT INTO public.cobro (
                idventa,
                fecha,
                cobrado_por,
                anulado,
                comision_para,
                cod_transaccion_cobranza_externa,
                eliminado
            )VALUES($1, $2, $3, $4, $5, $6, false)`, [
                cobro.idfactura,
                cobro.fecha,
                usuarios.convertirId(cobro.funcionario_registro) ?? 2,
                false,
                usuarios.convertirId(cobro.cobrador),
                cobro.cod_trans_banco != null && cobro.cod_trans_banco === '' ? null : cobro.cod_trans_banco
            ]);
    }

    mysql.end();
    postgres.end();
}

module.exports = { migrar }