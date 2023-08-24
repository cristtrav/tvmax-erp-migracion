const postgrescon = require('../base-datos/conexion-postgres');
const tablasAuditoria = require('../datos-iniciales/tablas-auditoria.json');

async function migrar() {
    console.log('Migrando tablas-auditoia iniciales...');
    const postgres = await postgrescon.getConnection();
    
    console.log(`Se van a registrar ${tablasAuditoria.length} tablas-auditoria.`)
    for(let tabla of tablasAuditoria){
        await postgres.query(`INSERT INTO public.tabla_auditoria(id, descripcion) VALUES($1, $2)`, [tabla.id, tabla.descripcion]);
    }

    await postgres.end();
}

module.exports = { migrar };