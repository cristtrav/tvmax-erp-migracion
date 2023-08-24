const postgrescon = require('../base-datos/conexion-postgres');
const formatos = require('../datos-iniciales/formatos-facturas.json');

async function migrar(){
    console.log('Creando formatos de facturas predeterminados...');
    const postgres = await postgrescon.getConnection();
    for(let formato of formatos){
        await postgres.query(`INSERT INTO public.formato_factura(
            id, descripcion, parametros, plantilla, tipo_factura, eliminado
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [formato.id, formato.descripcion, formato.parametros, formato.plantilla, formato.tipo_factura, formato.eliminado]);
    }

    await postgres.end();
}

module.exports = { migrar }