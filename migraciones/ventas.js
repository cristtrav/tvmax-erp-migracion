const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const clientes = require('./clientes');
const timbrados = require('./timbrados');
const usuarios = require('./usuarios');
const gruposServicios = require('./grupos-servicios');

async function migrar(){
    console.log('Migrando ventas...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    const [ventas] = await mysql.query(`SELECT * FROM factura`);
    console.log(`Se van a migrar ${ventas.length} ventas`);
    for(let venta of ventas){
        await postgres.query(`INSERT INTO public.venta (
            id,
            pagado,
            anulado,
            fecha_factura,
            idcliente,
            nro_factura,
            idtimbrado,
            idusuario_registro_factura,
            total_iva10,
            total_iva5,
            total_gravado_iva10,
            total,
            eliminado
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false)`, [
            venta.idfactura,
            venta.cancelado,
            venta.anulado,
            venta.fecha,
            clientes.convertirId(venta.cliente),
            venta.nro_factura,
            timbrados.convertirId(venta.talonario_factura),
            venta.funcionario_factura == null ? 2 : usuarios.convertirId(venta.funcionario_factura),
            venta.iva10,
            venta.iva5,
            venta.total,
            venta.total
        ]);
    }

    await postgres.query(`SELECT setval('public.venta_id_seq', (SELECT MAX(id) FROM public.venta), true);`);

    console.log('Migrando detalles de ventas...');
    const [detalles] = await mysql.query(`SELECT * FROM detalle_factura`);
    console.log(`Se van a migrar ${detalles.length} detalles de ventas.`);
    for(let detalle of detalles){
        await postgres.query(`INSERT INTO public.detalle_venta (
            id,
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
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false)`,[
            detalle.iddetalle_factura,
            detalle.factura,
            detalle.monto,
            detalle.cantidad,
            detalle.subtotal,
            gruposServicios.convertirIdServicio(detalle.servicio),
            10,
            detalle.cuota,
            detalle.descripcion,
            detalle.suscripcion,
            Math.round(Number(detalle.subtotal)/11)
        ]);
    }

    await postgres.query(`SELECT setval('public.detalle_venta_id_seq', (SELECT MAX(id) FROM public.detalle_venta), true);`);

    mysql.end();
    postgres.end();
}

module.exports = { migrar }