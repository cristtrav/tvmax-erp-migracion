const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const usuarios = require(`./usuarios`);
const clientes = require('./clientes');

async function migrar() {
    console.log('Migrando cobros...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    const [consultas] = await mysql.query(
        `SELECT
            consulta_res_pronet.idconsulta_res,
            consulta_res_pronet.codRetorno,
            consulta_res_pronet.desRetorno,
            consulta_res_pronet.nombreApellido,
            consulta_res_pronet.consulta_req_pronet,
            consulta_req_pronet.usuario,
            consulta_req_pronet.nroDocumento,
            cliente.idcliente,
            funcionario.idfuncionario
        FROM
            tvmaxbd.consulta_res_pronet
        INNER JOIN consulta_req_pronet ON consulta_req_pronet.idconsulta_req = consulta_res_pronet.consulta_req_pronet
        INNER JOIN cliente ON cliente.ci = consulta_req_pronet.nroDocumento
        INNER JOIN funcionario ON consulta_req_pronet.usuario = funcionario.ci
        WHERE codRetorno = '000';`);

    console.log(`Se van a migrar ${consultas.length} consultas bancard.`);
    for(let consulta of consultas){
        await postgres.query(`INSERT INTO public.consulta_cobranza_externa (
            id,
            cod_servicio,
            cod_retorno,
            des_retorno,
            nombre_apellido,
            nro_documento,
            moneda,
            idusuario,
            idcliente
        )VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING`, [
            consulta.idconsulta_res,
            '00001',
            '000',
            consulta.desRetorno,
            consulta.nombreApellido,
            consulta.nroDocumento,
            '1',
            usuarios.convertirId(consulta.idfuncionario),
            clientes.convertirId(consulta.idcliente)
        ]);
    }

    mysql.end();
    postgres.end();
}

module.exports = { migrar };