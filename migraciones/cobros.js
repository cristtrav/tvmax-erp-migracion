const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const usuarios = require('./usuarios');
const gruposServicios = require('./grupos-servicios');
const clientes = require('./clientes');
const { DateTime } = require('luxon');

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

    const [cobrosSinFact] = await mysql.query(
        `SELECT DISTINCT
            cobro.cod_trans_banco,
            cobro.fecha,
            cobro.cobrador,
            cobro.funcionario_registro,
            cobro.cuota,
            cobro.suscripcion,
            cobro.monto,
            cobro.cuota,
            cuota.fecha_vencimiento,
            cuota.servicio AS idservicio,
            servicio.nombre AS servicio,
            servicio.suscribible,
            suscripcion.cliente
        FROM tvmaxbd.cobro
        INNER JOIN suscripcion ON suscripcion.idsuscripcion = cobro.suscripcion
        INNER JOIN cuota ON cobro.cuota = cuota.idcuota
        INNER JOIN servicio ON cuota.servicio = servicio.idservicio
        LEFT JOIN detalle_factura ON detalle_factura.iddetalle_factura = cobro.detalle_factura
        WHERE cobro.anulado = false
        AND cobro.detalle_factura IS NULL
        ORDER BY fecha DESC`);
        console.log(`Se van a migrar ${cobrosSinFact.length} cobros sin factura...`)

    for(let cobro of cobrosSinFact){

        const venta = (await postgres.query(`INSERT INTO public.venta(
            pagado,
            anulado,
            fecha_factura,
            idcliente,
            idusuario_registro_factura,
            total_exento_iva,
            total_gravado_iva10,
            total_gravado_iva5,
            total_iva10,
            total_iva5,
            total,
            eliminado
        )VALUES(TRUE, FALSE, $1, $2, $3, 0, $4, 0, $5, 0, $6, FALSE) RETURNING *`,
        [
            cobro.fecha,
            clientes.convertirId(cobro.cliente),
            usuarios.convertirId(cobro.funcionario_registro) ?? 2,
            cobro.monto,
            Math.round(Number(cobro.monto)/11),
            cobro.monto
        ])).rows[0];

        const fechaVencimientoStr = DateTime.fromISO(new Date(cobro.fecha_vencimiento).toISOString()).setLocale('es-PY').toFormat('LLL yyyy');
        const descripcion = 
        cobro.suscribible
        ? `CUOTA ${fechaVencimientoStr} | ${cobro.servicio} [${cobro.suscripcion}]`
        : `${cobro.servicio} [${cobro.suscripcion}]`;

       await postgres.query(`INSERT INTO public.detalle_venta(
            idventa,
            monto,
            cantidad,
            subtotal,
            idservicio,
            porcentaje_iva,
            idcuota,
            descripcion,
            idsuscripcion,
            monto_iva,
            eliminado
        )VALUES($1, $2, 1, $3, $4, 10, $5, $6, $7, $8, FALSE)`,[
            venta.id,
            cobro.monto,
            cobro.monto,
            gruposServicios.convertirIdServicio(cobro.idservicio),
            cobro.cuota,
            descripcion.toUpperCase(),
            cobro.suscripcion,
            Math.round(Number(cobro.monto)/11)
        ]);

        await postgres.query(`INSERT INTO public.cobro(
            idventa,
            fecha,
            cobrado_por,
            anulado,
            comision_para,
            cod_transaccion_cobranza_externa,
            eliminado
        )VALUES($1, $2, $3, FALSE, $4, $5, FALSE)`,[
            venta.id,
            cobro.fecha,
            usuarios.convertirId(cobro.funcionario_registro),
            usuarios.convertirId(cobro.cobrador),
            cobro.cod_trans_banco
        ]);
    }
    mysql.end();
    postgres.end();
}

module.exports = { migrar }