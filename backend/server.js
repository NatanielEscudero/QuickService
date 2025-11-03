const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Asegurar que los directorios de uploads existan
const uploadDirs = ['uploads', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Directorio creado: ${dirPath}`);
  }
});

// Middleware de seguridad - CONFIGURAR HELMET PARA PERMITIR IMÁGENES
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // ← ESTA LÍNEA ES CRÍTICA
}));

// Configurar CORS mejorado
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081', 
  'http://localhost:19006',
  'exp://localhost:19000',
  'http://192.168.1.*:8081',
  'http://192.168.0.*:8081'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return origin === allowed;
    }) || origin.includes('localhost') || origin.includes('192.168.')) {
      callback(null, true);
    } else {
      console.log('🚫 CORS bloqueado para origen:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
}));

// SERVIR ARCHIVOS ESTÁTICOS - CONFIGURACIÓN MEJORADA
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Headers específicos para imágenes
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif')) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000 // más permisivo en desarrollo
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Resto de tu código permanece igual...
const db = require('./config/database');

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos MySQL');
  connection.release();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/appointments', require('./routes/appointments'));

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'QuickService Pro API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Ruta de prueba para users
app.get('/api/test-users', async (req, res) => {
  try {
    const [users] = await db.promise().execute('SELECT id, name, email FROM users LIMIT 5');
    res.json({ 
      message: 'Conexión a users funciona',
      users: users 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error testeando users: ' + error.message });
  }
});

// Ruta específica para servir avatares
app.get('/uploads/avatars/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'avatars', filename);
  
  // Verificar que el archivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Avatar no encontrado' });
  }
  
  // Enviar el archivo con headers CORS
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      details: err.message,
      stack: err.stack 
    })
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Test users: http://localhost:${PORT}/api/test-users`);
  console.log(`📁 Uploads disponibles en: http://localhost:${PORT}/uploads/`);
  console.log(`🖼️  Avatares disponibles en: http://localhost:${PORT}/uploads/avatars/`);
});