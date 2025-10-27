const fs = require('fs');
require('dotenv').config();

console.log('🔧 Verificando configuración del entorno...');

// Variables requeridas
const requiredVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_NAME',
  'JWT_SECRET'
];

let missingVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: FALTANTE`);
  } else {
    console.log(`✅ ${varName}: ${varName === 'JWT_SECRET' ? '***' + process.env[varName].slice(-4) : process.env[varName]}`);
  }
});

if (missingVars.length > 0) {
  console.log('\n❌ Variables faltantes en .env:', missingVars.join(', '));
  
  // Crear .env si no existe o está incompleto
  const envContent = `NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=quickservice_db
JWT_SECRET=tu_super_secreto_jwt_muy_largo_y_seguro_aqui_${Date.now()}
JWT_EXPIRES_IN=24h`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Archivo .env creado/actualizado automáticamente');
  console.log('🔁 Reinicia el servidor para cargar las nuevas variables');
} else {
  console.log('\n🎉 Todas las variables de entorno están configuradas correctamente!');
}