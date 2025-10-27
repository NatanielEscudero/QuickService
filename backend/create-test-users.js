const { promisePool } = require('./config/database');
const bcrypt = require('bcrypt');

async function createTestUsers() {
  try {
    console.log('🔧 Creando usuarios de prueba...');

    // Usuario Cliente
    const clientPassword = await bcrypt.hash('123456', 12);
    await promisePool.execute(
      'INSERT IGNORE INTO users (email, password, name, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['cliente@ejemplo.com', clientPassword, 'Juan Cliente', 'client', '+1234567890']
    );

    // Usuario Trabajador
    const workerPassword = await bcrypt.hash('123456', 12);
    const [workerResult] = await promisePool.execute(
      'INSERT IGNORE INTO users (email, password, name, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['trabajador@ejemplo.com', workerPassword, 'Carlos Plomero', 'worker', '+1234567891']
    );

    // Agregar a tabla workers si es trabajador
    if (workerResult.insertId) {
      await promisePool.execute(
        'INSERT IGNORE INTO workers (user_id, profession, description) VALUES (?, ?, ?)',
        [workerResult.insertId, 'Plomería', 'Especialista en reparaciones de tuberías']
      );
    }

    console.log('✅ Usuarios de prueba creados:');
    console.log('   👤 cliente@ejemplo.com / 123456');
    console.log('   🔧 trabajador@ejemplo.com / 123456');

  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  }
}

createTestUsers();
