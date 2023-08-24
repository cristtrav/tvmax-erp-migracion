const mysqlcon = require('../base-datos/conexion-mysql');
const postgrescon = require('../base-datos/conexion-postgres');
const usuarios = require('./usuarios');

async function migrar() {
    console.log('Migrando clientes...');
    const mysql = await mysqlcon.getConnection();
    const postgres = await postgrescon.getConnection();

    const [clientes] = await mysql.query(`SELECT * FROM cliente`);
    console.log(`Se van a migrar ${clientes.length} clientes...`);
    for (let cliente of clientes) {
        if (cliente.idcliente != 10000000) {
            const telefonoSaneado = sanearTelefono(cliente.telefono1);
            await postgres.query(
                `INSERT INTO public.cliente
                (id, nombres, apellidos, razon_social, telefono1, telefono2, email, idcobrador, ci, dv_ruc, eliminado)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)`,
                [convertirId(cliente.idcliente), cliente.nombres?.substring(0, 80), cliente.apellidos?.substring(0, 80), cliente.razon_social,
                telefonoSaneado[0],
                telefonoSaneado[1] != null ? telefonoSaneado[1] : (cliente.telefono2 ? cliente.telefono2 : null),
                    null, usuarios.convertirId(cliente.cobrador), cliente.ci, cliente.dv_ruc]
            );
        }
    }

    await mysql.end();
    await postgres.end();
}

function convertirId(id) {
    if(id == 10000000) return null;
    return id + 10;
}

function sanearTelefono(tel) {
    const teles = [null, null];
    if (tel) {
        let telStr = tel.replaceAll(' ', '');
        telStr = telStr.replaceAll('.', '');
        if (telStr.includes('/')) {
            telStr = telStr.replaceAll('-', '');
            let telesProc = telStr.split('/');
            if (telesProc[0].length === 8 && !telesProc[0].startsWith('09')) telesProc[0] = "09" + telesProc[0];
            if (telesProc[1].length === 8 && !telesProc[1].startsWith('09')) telesProc[1] = "09" + telesProc[1];
            if (telesProc[0].length === 9 && !telesProc[0].startsWith('0')) telesProc[0] = "0" + telesProc[0];
            if (telesProc[1].length === 9 && !telesProc[1].startsWith('0')) telesProc[1] = "0" + telesProc[1];
            if (telesProc[0].length === 7) telesProc[0] = null;
            if (telesProc[1].length === 7) telesProc[1] = null;
            telesProc[0] = telesProc[0]?.replace(/\D/g, '');
            telesProc[1] = telesProc[1]?.replace(/\D/g, '');
            teles[0] = telesProc[0] ? telesProc[0] : null;
            teles[1] = telesProc[1] ? telesProc[1] : null;
            //console.log(`idcli: ${idcli} | tel 1: ${telesProc[0]} -> tel 2: ${telesProc[1]}`);
        } else if (telStr.includes('-')) {
            if ((telStr.match(/-/g) || []).length === 1) {
                if (telStr.length === 11) {
                    teles[0] = telStr.replaceAll('-', '').replace(/\D/g, '');
                    teles[1] = null;
                    //console.log(`Un solo numero: ${telStr.replaceAll('-', '')}`);
                } else {
                    let telesProc = telStr.split('-');
                    telesProc[0] = telesProc[0]?.replace(/\D/g, '');
                    telesProc[1] = telesProc[1]?.replace(/\D/g, '');
                    teles[0] = telesProc[0];
                    teles[1] = telesProc[1];
                    //console.log(`idcli: ${idcli} | Dividido por guion -> tel 1: ${telesProc[0]}, tel 2: ${telesProc[1]}`);
                }
            } else {
                console.log(`Mas de un guion: ${telStr}`);
            }
        } else {
            //console.log('Num sin divisoria: '+telStr);
            teles[0] = telStr?.replace(/\D/g, '');
            teles[1] = null;
        }
    }
    return teles;
}

module.exports = { migrar, convertirId }