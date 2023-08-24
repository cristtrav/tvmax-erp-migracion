const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const departamentos = require('../datos-iniciales/departamentos.json');
const distritos = require('../datos-iniciales/distritos.json');

async function migrar(){
    console.log('Migrando ubicaciones...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    for(let departamento of departamentos){
        await postgres.query(`INSERT INTO public.departamento(id, descripcion, eliminado) VALUES($1, $2, $3)`, [departamento.id, departamento.descripcion, departamento.eliminado]);
    }
    for(let distrito of distritos){
        await postgres.query(`INSERT INTO public.distrito(id, descripcion, iddepartamento, eliminado) VALUES($1, $2, $3, $4)`, [distrito.id, distrito.descripcion, distrito.iddepartamento, distrito.eliminado]);
    }

    const [barrios] = await mysql.query(`SELECT * FROM barrio`);
    console.log(`Se van a migrar ${barrios.length} barrios...`);
    for(let barrio of barrios){
        await postgres.query('INSERT INTO public.barrio(id, descripcion, iddistrito, eliminado) VALUES ($1, $2, $3, false)', [barrio.idbarrio, barrio.nombre, '0501']);
    }
    await mysql.end();
    await postgres.end();
}

module.exports = { migrar }