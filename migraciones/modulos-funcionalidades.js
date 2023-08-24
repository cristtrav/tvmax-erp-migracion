const postgrescon = require('../base-datos/conexion-postgres');
const modulos = require('../datos-iniciales/modulos.json');
const funcionalidades = require('../datos-iniciales/funcionalidades.json');
const dependencias = require('../datos-iniciales/dependencias-funcionalidades.json')

async function migrar() {
    console.log('Migrando modulos y funcionalidades iniciales...');
    const postgres = await postgrescon.getConnection();

    console.log(`Se van a registrar ${modulos.length} modulos.`);
    for(let modulo of modulos){
        await postgres.query(`INSERT INTO public.modulo(
            id, descripcion, eliminado
        ) VALUES ($1, $2, $3)`, [modulo.id, modulo.descripcion, modulo.eliminado]);
    }

    console.log(`Se van a registrar ${funcionalidades.length} funcionalidades.`)
    for(let func of funcionalidades){
        await postgres.query(`INSERT INTO public.funcionalidad(
            id,
            nombre,
            descripcion,
            idmodulo,
            eliminado
        ) VALUES($1, $2, $3, $4, $5)`, [func.id, func.nombre, func.descripcion, func.idmodulo, func.eliminado]);
    }
    
    console.log(`se van a registrar ${dependencias.length} dependencias de funcionalidades`);
    for(let dep of dependencias){
        await postgres.query(`INSERT INTO public.dependencia_funcionalidad(
            idfuncionalidad,
            idfuncionalidad_dependencia
        ) VALUES ($1, $2)`, [dep.idfuncionalidad, dep.idfuncionalidad_dependencia]);
    }

    await postgres.end();
}

module.exports = { migrar };