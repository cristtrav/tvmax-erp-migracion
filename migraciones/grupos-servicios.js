const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');

async function migrar() {
    console.log('Migrando grupos...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    await postgres.query(`INSERT INTO public.grupo(id, descripcion, eliminado) VALUES(1, '(Sin grupo)', false)`);
    await postgres.query(`INSERT INTO public.grupo(id, descripcion, eliminado) VALUES(11, 'TV Cable', false)`);
    await postgres.query(`INSERT INTO public.grupo(id, descripcion, eliminado) VALUES(12, 'Internet', false)`);
    await postgres.query(`INSERT INTO public.grupo(id, descripcion, eliminado) VALUES(13, 'Otros cobros', false)`);

    const [servicios] = await mysql.query(`SELECT * FROM servicio`);
    console.log(`Se van a migrar ${servicios.length} servicios`);
    for(let servicio of servicios){
        await postgres.query(
            `INSERT INTO public.servicio
                (id, descripcion, precio, suscribible, idgrupo, porcentaje_iva, eliminado)
                VALUES($1, $2, $3, $4, $5, $6, false)`,
                [convertirIdServicio(servicio.idservicio), servicio.nombre, servicio.precio, servicio.suscribible, getIdGrupo(servicio), 10]);
    }
    await mysql.end();
    await postgres.end();
}

function getIdGrupo(servicio){
    if(servicio.idservicio == 1) return 11;
    if(servicio.suscribible == 1) return 12;
    return 13 
}

function convertirIdServicio(id){
    return id + 10;
}

module.exports = { migrar, convertirIdServicio };