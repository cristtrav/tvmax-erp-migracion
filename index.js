require('dotenv').config();
const modulosFuncionalidades = require('./migraciones/modulos-funcionalidades');
const tablasAuditoria = require('./migraciones/tablas-auditoria');
const ubicaciones = require('./migraciones/ubicaciones');
const usuarios = require('./migraciones/usuarios');
const gruposServicios = require('./migraciones/grupos-servicios');
const timbrados = require('./migraciones/timbrados');
const clientes = require('./migraciones/clientes');
const domicilios = require('./migraciones/domicilios');
const suscripciones = require('./migraciones/suscripciones');
const cuotas = require('./migraciones/cuotas');
const ventas = require('./migraciones/ventas');
const cobros = require('./migraciones/cobros');
const formatos = require('./migraciones/formatos-impresion');

(async () => {
    //### Datos Iniciales ###
    await modulosFuncionalidades.migrar();
    await tablasAuditoria.migrar();

    //### Desde base de datos
    await ubicaciones.migrar();
    await usuarios.migrar();
    await gruposServicios.migrar();
    await timbrados.migrar();
    await clientes.migrar();
    await domicilios.migrar();
    await suscripciones.migrar();
    await cuotas.migrar();
    await ventas.migrar();
    await cobros.migrar();
    await formatos.migrar();
})();