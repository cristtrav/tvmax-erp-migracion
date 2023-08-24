const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const roles = require('../datos-iniciales/roles.json');
const argon2 = require('argon2');

async function migrar(){
    console.log('Migrando usuarios...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    for(let rol of roles){
        await postgres.query(`INSERT INTO public.rol(id, descripcion, solo_lectura, eliminado) VALUES($1, $2, $3, $4)`, [rol.id, rol.descripcion, rol.solo_lectura, rol.eliminado]);
    }

    const [funcionarios] = await mysql.query(`SELECT * FROM funcionario`);
    console.log(`Se van a migrar ${funcionarios.length} usuarios...`);    
    for(let funcionario of funcionarios){
        await postgres.query(
            `INSERT INTO public.usuario (
                id,
                nombres,
                apellidos,
                ci,
                acceso_sistema,
                email,
                telefono,
                idrol,
                solo_lectura,
                password,
                eliminado
            ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)`, [
                convertirId(funcionario.idfuncionario),
                funcionario.nombres,
                funcionario.apellidos,
                convertirId(funcionario.idfuncionario) == 2 ? '1001' : funcionario.ci,
                convertirId(funcionario.idfuncionario) == 2,
                null,
                funcionario.telefono1 && funcionario.telefono1 === '' ? null : funcionario.telefono1,
                2,
                false,
                convertirId(funcionario.idfuncionario) == 2 ? await argon2.hash('12345678') : null
            ]
        );
    }
    
    await postgres.query(`INSERT INTO public.usuario(
        id,
        nombres,
        acceso_sistema,
        idrol,
        solo_lectura,
        eliminado
    ) VALUES (3, 'SISTEMA', false, 4, true, false)`);

    console.log('Agregando permisos al admin...');
    const funcionalidades = (await postgres.query(`SELECT * FROM public.funcionalidad`)).rows;
    for(let func of funcionalidades){
        await postgres.query(`INSERT INTO public.permiso (idfuncionalidad, idusuario) VALUES ($1, $2)`, [func.id, 2]);
    }
    mysql.end();
    postgres.end();
}

function convertirId(id){
    if(id == 1000) return 1;
    if(id == 1001) return 2;
    if(id == 1) return 12;
    if(id == 2) return 11;
    if(id >= 3 && id <= 999) return id + 10;
    if(id >= 1000) return id - 970;
}

module.exports = { migrar, convertirId }