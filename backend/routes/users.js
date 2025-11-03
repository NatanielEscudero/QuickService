const express = require('express');
const { promisePool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars/';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Nombre único: userid-timestamp.extensión
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: function (req, file, cb) {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

const router = express.Router();

// Middleware para verificar que el usuario accede solo a sus datos o es admin
const canAccessUser = (req, res, next) => {
  const userId = parseInt(req.params.id);
  
  if (req.user.role === 'admin' || req.user.id === userId) {
    next();
  } else {
    return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
  }
};

// GET /api/users/profile - Obtener perfil del usuario actual
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await promisePool.execute(`
      SELECT 
        u.id, u.email, u.name, u.role, u.phone, u.avatar_url, 
        u.is_verified, u.created_at, u.updated_at,
        w.profession, w.description, w.availability, w.rating
      FROM users u 
      LEFT JOIN workers w ON u.id = w.user_id 
      WHERE u.id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
      profession: user.profession,
      description: user.description,
      availability: user.availability,
      rating: user.rating
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/profile - Actualizar perfil del usuario actual
// PUT /api/users/profile - Actualizar perfil del usuario actual (CORREGIDO)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, avatar_url, profession, description } = req.body;
    
    console.log('📥 Datos recibidos para actualizar perfil:', req.body);
    
    // VALIDACIÓN CORREGIDA: Permitir actualizaciones parciales
    // Solo validar name si se está intentando actualizar
    if (name !== undefined && !name) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }

    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // Obtener datos actuales del usuario primero
      const [currentUsers] = await connection.execute(
        'SELECT name, phone, avatar_url FROM users WHERE id = ?',
        [req.user.id]
      );

      if (currentUsers.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const currentUser = currentUsers[0];

      // Preparar datos para actualizar - usar valores existentes si no se envían nuevos
      const updateData = {
        name: name !== undefined ? name : currentUser.name,
        phone: phone !== undefined ? phone : currentUser.phone,
        avatar_url: avatar_url !== undefined ? avatar_url : currentUser.avatar_url,
        updated_at: new Date()
      };

      console.log('🔄 Actualizando usuario con datos:', updateData);

      // Actualizar datos básicos del usuario
      await connection.execute(
        'UPDATE users SET name = ?, phone = ?, avatar_url = ?, updated_at = ? WHERE id = ?',
        [updateData.name, updateData.phone, updateData.avatar_url, updateData.updated_at, req.user.id]
      );

      console.log('✅ Usuario actualizado correctamente');

      // Si es trabajador y se envió profession o description, actualizar datos específicos
      if (req.user.role === 'worker' && (profession !== undefined || description !== undefined)) {
        console.log('👷 Actualizando datos de worker:', { profession, description });
        
        // Obtener datos actuales del worker
        const [currentWorkers] = await connection.execute(
          'SELECT profession, description FROM workers WHERE user_id = ?',
          [req.user.id]
        );

        const currentWorker = currentWorkers.length > 0 ? currentWorkers[0] : { profession: null, description: null };

        // Preparar datos del worker - usar valores existentes si no se envían nuevos
        const workerData = {
          profession: profession !== undefined ? profession : currentWorker.profession,
          description: description !== undefined ? description : currentWorker.description,
          updated_at: new Date()
        };

        if (currentWorkers.length > 0) {
          // Actualizar worker existente
          await connection.execute(
            `UPDATE workers 
             SET profession = ?, description = ?, updated_at = ? 
             WHERE user_id = ?`,
            [workerData.profession, workerData.description, workerData.updated_at, req.user.id]
          );
          console.log('✅ Worker existente actualizado');
        } else {
          // Crear nuevo registro en workers
          await connection.execute(
            `INSERT INTO workers (user_id, profession, description, availability) 
             VALUES (?, ?, ?, 'available')`,
            [req.user.id, workerData.profession, workerData.description]
          );
          console.log('✅ Nuevo worker creado');
        }
      }

      await connection.commit();

      // Obtener usuario actualizado
      const [updatedUsers] = await promisePool.execute(`
        SELECT 
          u.id, u.email, u.name, u.role, u.phone, u.avatar_url, 
          u.is_verified, u.created_at, u.updated_at,
          w.profession, w.description, w.availability, w.rating
        FROM users u 
        LEFT JOIN workers w ON u.id = w.user_id 
        WHERE u.id = ?
      `, [req.user.id]);

      if (updatedUsers.length === 0) {
        throw new Error('Usuario no encontrado después de actualizar');
      }

      const updatedUser = updatedUsers[0];
      const userResponse = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatar_url: updatedUser.avatar_url,
        is_verified: updatedUser.is_verified,
        profession: updatedUser.profession,
        description: updatedUser.description,
        availability: updatedUser.availability,
        rating: updatedUser.rating
      };

      console.log('✅ Perfil actualizado correctamente para:', userResponse.email);

      res.json({ 
        message: 'Perfil actualizado correctamente',
        user: userResponse 
      });

    } catch (error) {
      await connection.rollback();
      console.error('❌ Error en transacción:', error);
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/users/avatar - Actualizar avatar (CON MULTER) - ÚNICA VERSIÓN
router.put('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    console.log('📤 Endpoint /avatar llamado - Usuario:', req.user.id);
    
    if (!req.file) {
      console.log('❌ No se recibió archivo');
      return res.status(400).json({ 
        success: false,
        error: 'No se proporcionó ninguna imagen' 
      });
    }

    console.log('✅ Archivo recibido:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });

    // Verificar que el archivo se guardó físicamente
    if (!fs.existsSync(req.file.path)) {
      console.log('❌ Archivo no se guardó en el sistema de archivos');
      return res.status(500).json({
        success: false,
        error: 'Error guardando el archivo en el servidor'
      });
    }

    // Construir URL - usar localhost para desarrollo
    const avatarUrl = `http://localhost:3001/uploads/avatars/${req.file.filename}`;
    
    console.log('🔄 Actualizando avatar en BD:', avatarUrl);

    // Actualizar en la base de datos
    const [result] = await promisePool.execute(
      'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [avatarUrl, req.user.id]
    );

    if (result.affectedRows === 0) {
      throw new Error('No se pudo actualizar el usuario');
    }

    // Obtener usuario actualizado
    const [users] = await promisePool.execute(
      `SELECT u.*, w.profession, w.description 
       FROM users u 
       LEFT JOIN workers w ON u.id = w.user_id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado después de actualizar');
    }

    const updatedUser = users[0];
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      phone: updatedUser.phone,
      avatar_url: avatarUrl,
      is_verified: updatedUser.is_verified,
      profession: updatedUser.profession,
      description: updatedUser.description
    };

    console.log('✅ Avatar actualizado correctamente');

    res.json({ 
      success: true,
      message: 'Avatar actualizado correctamente',
      avatar_url: avatarUrl,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Error actualizando avatar:', error);
    
    // Si hay un archivo temporal, eliminarlo
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error('Error eliminando archivo temporal:', deleteError);
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/users/update-role - Actualizar rol del usuario
router.put('/update-role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    // Validar rol
    if (!['client', 'worker'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Actualizar rol del usuario
    await promisePool.execute(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, userId]
    );

    // Obtener usuario actualizado
    const [users] = await promisePool.execute(`
      SELECT u.*, w.profession, w.rating 
      FROM users u 
      LEFT JOIN workers w ON u.id = w.user_id 
      WHERE u.id = ?
    `, [userId]);

    const updatedUser = users[0];

    res.json({
      message: 'Rol actualizado correctamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatar_url: updatedUser.avatar_url,
        is_verified: updatedUser.is_verified,
        auth_provider: updatedUser.auth_provider,
        profession: updatedUser.profession,
        rating: updatedUser.rating
      }
    });

  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/update-profession - Actualizar profesión del trabajador
router.put('/update-profession', authenticateToken, async (req, res) => {
  try {
    const { profession, description } = req.body;
    const userId = req.user.id;

    console.log('🎯 Actualizando profesión para usuario:', userId, 'Profesión:', profession);
    console.log('📝 Datos recibidos:', { profession, description, userId });

    if (!profession) {
      console.log('❌ Error: Profesión requerida');
      return res.status(400).json({ error: 'La profesión es requerida' });
    }

    // Verificar que el usuario sea worker
    const [userCheck] = await promisePool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    console.log('🔍 Verificación de usuario:', userCheck);

    if (userCheck.length === 0) {
      console.log('❌ Error: Usuario no encontrado');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (userCheck[0].role !== 'worker') {
      console.log('❌ Error: Usuario no es worker, rol actual:', userCheck[0].role);
      return res.status(400).json({ error: 'Solo los trabajadores pueden actualizar su profesión' });
    }

    // Verificar si ya existe registro en workers
    const [existingWorker] = await promisePool.execute(
      'SELECT id FROM workers WHERE user_id = ?',
      [userId]
    );

    console.log('🔍 Worker existente:', existingWorker);

    if (existingWorker.length > 0) {
      // Actualizar worker existente
      console.log('🔄 Actualizando worker existente');
      await promisePool.execute(
        `UPDATE workers 
         SET profession = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`,
        [profession, description || `Soy ${profession} profesional`, userId]
      );
      console.log('✅ Profesión actualizada para worker existente');
    } else {
      // Crear nuevo registro en workers
      console.log('🆕 Creando nuevo registro de worker');
      await promisePool.execute(
        `INSERT INTO workers (user_id, profession, description, availability) 
         VALUES (?, ?, ?, 'available')`,
        [userId, profession, description || `Soy ${profession} profesional`]
      );
      console.log('✅ Nuevo registro de worker creado con profesión:', profession);
    }

    // Obtener usuario actualizado
    const [users] = await promisePool.execute(`
      SELECT u.*, w.profession, w.description, w.rating, w.availability
      FROM users u 
      LEFT JOIN workers w ON u.id = w.user_id 
      WHERE u.id = ?
    `, [userId]);

    const updatedUser = users[0];

    console.log('✅ Profesión actualizada exitosamente para usuario:', updatedUser.email);

    res.json({
      message: 'Profesión actualizada correctamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatar_url: updatedUser.avatar_url,
        is_verified: updatedUser.is_verified,
        auth_provider: updatedUser.auth_provider,
        profession: updatedUser.profession,
        description: updatedUser.description,
        rating: updatedUser.rating,
        availability: updatedUser.availability
      }
    });

  } catch (error) {
    console.error('❌ Error completo actualizando profesión:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/users/password - Cambiar contraseña
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'La contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener usuario con contraseña actual
    const [users] = await promisePool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await promisePool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/workers - Obtener lista de trabajadores (público)
router.get('/workers', async (req, res) => {
  try {
    const { profession, min_rating, available } = req.query;
    
    console.log('🔍 Parámetros de consulta workers:', { profession, min_rating, available });
    
    let query = `
      SELECT 
        u.id, u.name, u.avatar_url, u.created_at,
        w.profession, w.description, w.availability, w.rating
      FROM users u 
      INNER JOIN workers w ON u.id = w.user_id 
      WHERE u.role = 'worker'
    `;
    
    const params = [];

    // Filtros
    if (profession) {
      query += ' AND w.profession = ?';
      params.push(profession);
    }

    if (min_rating) {
      query += ' AND w.rating >= ?';
      params.push(parseFloat(min_rating));
    }

    if (available === 'true') {
      query += ' AND w.availability = "available"';
    }

    query += ' ORDER BY w.rating DESC';

    console.log('📝 Query ejecutada:', query);
    console.log('🔢 Parámetros:', params);

    const [workers] = await promisePool.execute(query, params);

    console.log('✅ Workers encontrados:', workers.length);

    const workersResponse = workers.map(worker => ({
      id: worker.id,
      name: worker.name,
      avatar_url: worker.avatar_url,
      profession: worker.profession,
      description: worker.description,
      availability: worker.availability,
      rating: worker.rating,
      member_since: worker.created_at
    }));

    res.json({ workers: workersResponse });
  } catch (error) {
    console.error('❌ Error completo obteniendo trabajadores:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/workers/:id - Obtener perfil público de un trabajador
router.get('/workers/:id', async (req, res) => {
  try {
    const workerId = req.params.id;

    const [workers] = await promisePool.execute(`
      SELECT 
        u.id, u.name, u.avatar_url, u.created_at,
        w.profession, w.description, w.availability, w.rating
      FROM users u 
      INNER JOIN workers w ON u.id = w.user_id 
      WHERE u.id = ? AND u.role = 'worker'
    `, [workerId]);

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const worker = workers[0];
    
    const workerResponse = {
      id: worker.id,
      name: worker.name,
      avatar_url: worker.avatar_url,
      profession: worker.profession,
      description: worker.description,
      availability: worker.availability,
      rating: worker.rating,
      member_since: worker.created_at
    };

    res.json({ worker: workerResponse });
  } catch (error) {
    console.error('Error obteniendo trabajador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/workers/availability - Actualizar disponibilidad (solo trabajadores)
router.put('/workers/availability', authenticateToken, requireRole(['worker']), async (req, res) => {
  try {
    const { availability } = req.body;

    if (!['available', 'busy', 'offline'].includes(availability)) {
      return res.status(400).json({ error: 'Estado de disponibilidad inválido' });
    }

    await promisePool.execute(
      'UPDATE workers SET availability = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [availability, req.user.id]
    );

    res.json({ 
      message: 'Disponibilidad actualizada correctamente',
      availability 
    });
  } catch (error) {
    console.error('Error actualizando disponibilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/users/profile - Eliminar cuenta de usuario
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'La contraseña es requerida para eliminar la cuenta' });
    }

    // Verificar contraseña
    const [users] = await promisePool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    // Eliminar usuario (las foreign keys con CASCADE eliminarán los registros relacionados)
    await promisePool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);

    res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/worker/availability
router.get('/worker/availability', authenticateToken, async (req, res) => {
  try {
    const workerId = req.user.id;
    
    console.log('🔍 Obteniendo disponibilidad para worker ID:', workerId);
    
    // Buscar en la tabla workers
    const [workers] = await promisePool.execute(
      'SELECT * FROM workers WHERE user_id = ?',
      [workerId]
    );

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const worker = workers[0];

    // Buscar disponibilidad detallada en la nueva tabla
    const [availabilitySlots] = await promisePool.execute(
      'SELECT * FROM worker_availability WHERE worker_id = ? ORDER BY day_of_week',
      [workerId]
    );

    console.log('✅ Slots de disponibilidad encontrados:', availabilitySlots.length);

    // Mapear días de la semana
    const dayMapping = {
      'monday': 'Lunes',
      'tuesday': 'Martes', 
      'wednesday': 'Miércoles',
      'thursday': 'Jueves',
      'friday': 'Viernes',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };

    // Si no hay slots guardados, crear unos por defecto
    let timeSlots = [];
    if (availabilitySlots.length === 0) {
      timeSlots = [
        { day: 'Lunes', enabled: true, startTime: '09:00', endTime: '18:00' },
        { day: 'Martes', enabled: true, startTime: '09:00', endTime: '18:00' },
        { day: 'Miércoles', enabled: true, startTime: '09:00', endTime: '18:00' },
        { day: 'Jueves', enabled: true, startTime: '09:00', endTime: '18:00' },
        { day: 'Viernes', enabled: true, startTime: '09:00', endTime: '18:00' },
        { day: 'Sábado', enabled: false, startTime: '10:00', endTime: '14:00' },
        { day: 'Domingo', enabled: false, startTime: '10:00', endTime: '14:00' },
      ];
    } else {
      // Convertir slots de BD a formato frontend
      timeSlots = availabilitySlots.map(slot => ({
        day: dayMapping[slot.day_of_week],
        enabled: slot.enabled,
        startTime: slot.start_time ? slot.start_time.substring(0, 5) : '09:00',
        endTime: slot.end_time ? slot.end_time.substring(0, 5) : '18:00'
      }));
    }

    console.log('✅ Worker encontrado:', worker);

    // Retornar datos de disponibilidad
    res.json({
      immediate_service: worker.immediate_service || false,
      time_slots: timeSlots,
      coverage_radius: worker.coverage_radius || 15
    });

  } catch (error) {
    console.error('❌ Error obteniendo disponibilidad:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/users/worker/availability
router.put('/worker/availability', authenticateToken, async (req, res) => {
  try {
    const workerId = req.user.id;
    const { immediate_service, time_slots, coverage_radius } = req.body;

    console.log('💾 Guardando disponibilidad para worker ID:', workerId);
    console.log('📦 Datos recibidos:', { immediate_service, time_slots, coverage_radius });

    // Mapeo inverso para días de la semana
    const dayMapping = {
      'Lunes': 'monday',
      'Martes': 'tuesday',
      'Miércoles': 'wednesday', 
      'Jueves': 'thursday',
      'Viernes': 'friday',
      'Sábado': 'saturday',
      'Domingo': 'sunday'
    };

    // Iniciar transacción
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Actualizar tabla workers
      await connection.execute(
        'UPDATE workers SET immediate_service = ?, coverage_radius = ?, updated_at = NOW() WHERE user_id = ?',
        [immediate_service, coverage_radius, workerId]
      );

      console.log('✅ Workers actualizado');

      // 2. Actualizar disponibilidad detallada
      for (const slot of time_slots) {
        const dayKey = dayMapping[slot.day];
        
        // Verificar si ya existe
        const [existing] = await connection.execute(
          'SELECT id FROM worker_availability WHERE worker_id = ? AND day_of_week = ?',
          [workerId, dayKey]
        );

        if (existing.length > 0) {
          // Actualizar existente
          await connection.execute(
            'UPDATE worker_availability SET enabled = ?, start_time = ?, end_time = ?, updated_at = NOW() WHERE worker_id = ? AND day_of_week = ?',
            [slot.enabled, slot.startTime, slot.endTime, workerId, dayKey]
          );
        } else {
          // Insertar nuevo
          await connection.execute(
            'INSERT INTO worker_availability (worker_id, day_of_week, enabled, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
            [workerId, dayKey, slot.enabled, slot.startTime, slot.endTime]
          );
        }
      }

      await connection.commit();
      console.log('✅ Transacción completada - disponibilidad guardada');

      res.json({ 
        message: 'Disponibilidad actualizada correctamente',
        availability: {
          immediate_service,
          time_slots,
          coverage_radius
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error actualizando disponibilidad:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/worker/availability/stats
router.get('/worker/availability/stats', authenticateToken, async (req, res) => {
  try {
    const workerId = req.user.id;
    
    console.log('📊 Obteniendo estadísticas para worker ID:', workerId);

    // Obtener slots activos
    const [activeSlots] = await promisePool.execute(
      'SELECT COUNT(*) as active_count FROM worker_availability WHERE worker_id = ? AND enabled = true',
      [workerId]
    );

    // Calcular horas semanales
    const [weeklyHoursResult] = await promisePool.execute(
      `SELECT SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)) as total_hours 
       FROM worker_availability 
       WHERE worker_id = ? AND enabled = true`,
      [workerId]
    );

    const activeDays = activeSlots[0]?.active_count || 0;
    const weeklyHours = weeklyHoursResult[0]?.total_hours || 0;
    const availabilityPercentage = Math.round((activeDays / 7) * 100);

    const stats = {
      active_days: activeDays,
      weekly_hours: weeklyHours,
      availability_percentage: availabilityPercentage
    };

    console.log('✅ Estadísticas calculadas:', stats);

    res.json(stats);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/stats - Estadísticas del usuario (solo admin o propio usuario)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    let stats;

    if (req.user.role === 'worker') {
      // Estadísticas para trabajador
      const [workerStats] = await promisePool.execute(`
        SELECT 
          COUNT(s.id) as total_services,
          SUM(s.total_cost) as total_earnings,
          AVG(s.total_cost) as average_earning,
          w.rating
        FROM workers w
        LEFT JOIN services s ON w.user_id = s.worker_id AND s.status = 'completed'
        WHERE w.user_id = ?
        GROUP BY w.user_id
      `, [req.user.id]);

      stats = workerStats[0] || {};
    } else if (req.user.role === 'client') {
      // Estadísticas para cliente
      const [clientStats] = await promisePool.execute(`
        SELECT 
          COUNT(s.id) as total_services,
          SUM(s.total_cost) as total_spent,
          AVG(s.total_cost) as average_spent
        FROM services s
        WHERE s.client_id = ? AND s.status = 'completed'
        GROUP BY s.client_id
      `, [req.user.id]);

      stats = clientStats[0] || {};
    }

    res.json({ stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/my-availability', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Obteniendo disponibilidad para user_id:', req.user.id);
    
    const [workers] = await promisePool.execute(
      'SELECT availability FROM workers WHERE user_id = ?',
      [req.user.id]
    );

    console.log('📋 Resultado de workers:', workers);

    if (workers.length === 0) {
      console.log('❌ No se encontró worker para user_id:', req.user.id);
      return res.json({ availability: 'available' }); // Valor por defecto
    }

    const worker = workers[0];
    console.log('✅ Disponibilidad encontrada:', worker.availability);
    
    res.json({ 
      availability: worker.availability 
    });
  } catch (error) {
    console.error('❌ Error obteniendo disponibilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/worker/earnings
router.get('/worker/earnings', authenticateToken, async (req, res) => {
  try {
    const workerId = req.user.id;
    const { range = 'week' } = req.query;

    console.log('💰 Obteniendo ganancias para worker ID:', workerId, 'Rango:', range);

    // Calcular fechas según el rango
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Obtener appointments del trabajador
    const [appointments] = await promisePool.execute(
      `SELECT a.*, u.name as client_name
       FROM appointments a
       INNER JOIN users u ON a.client_id = u.id
       WHERE a.worker_id = ? AND a.created_at >= ?
       ORDER BY a.scheduled_date DESC`,
      [workerId, startDate]
    );

    console.log('✅ Appointments encontrados:', appointments.length);

    // Calcular ganancias
    let totalEarnings = 0;
    let pendingEarnings = 0;
    const transactions = [];

    appointments.forEach(apt => {
      const amount = parseFloat(apt.total_cost) || 0;
      
      if (apt.status === 'completed') {
        totalEarnings += amount;
      } else if (apt.status === 'pending' || apt.status === 'confirmed') {
        pendingEarnings += amount;
      }

      transactions.push({
        id: apt.id,
        date: apt.created_at,
        service_type: apt.service_type,
        client_name: apt.client_name,
        total_cost: amount,
        status: apt.status,
        scheduled_date: apt.scheduled_date
      });
    });

    const earningsData = {
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      transactions: transactions
    };

    console.log('💰 Ganancias calculadas:', earningsData);

    res.json(earningsData);

  } catch (error) {
    console.error('❌ Error obteniendo ganancias:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/worker/earnings/stats
router.get('/worker/earnings/stats', authenticateToken, async (req, res) => {
  try {
    const workerId = req.user.id;

    console.log('📊 Obteniendo estadísticas de ganancias para worker ID:', workerId);

    // Obtener estadísticas de diferentes rangos de tiempo
    const now = new Date();
    
    // Semana
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    // Mes
    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - 1);
    
    // Año
    const yearStart = new Date(now);
    yearStart.setFullYear(now.getFullYear() - 1);

    // Ganancias semanales
    const [weeklyEarnings] = await promisePool.execute(
      `SELECT COALESCE(SUM(total_cost), 0) as earnings
       FROM appointments 
       WHERE worker_id = ? AND status = 'completed' AND created_at >= ?`,
      [workerId, weekStart]
    );

    // Ganancias mensuales
    const [monthlyEarnings] = await promisePool.execute(
      `SELECT COALESCE(SUM(total_cost), 0) as earnings
       FROM appointments 
       WHERE worker_id = ? AND status = 'completed' AND created_at >= ?`,
      [workerId, monthStart]
    );

    // Ganancias anuales
    const [yearlyEarnings] = await promisePool.execute(
      `SELECT COALESCE(SUM(total_cost), 0) as earnings
       FROM appointments 
       WHERE worker_id = ? AND status = 'completed' AND created_at >= ?`,
      [workerId, yearStart]
    );

    // Total de servicios completados
    const [totalCompleted] = await promisePool.execute(
      `SELECT COUNT(*) as count
       FROM appointments 
       WHERE worker_id = ? AND status = 'completed'`,
      [workerId]
    );

    const stats = {
      weekly_earnings: parseFloat(weeklyEarnings[0]?.earnings) || 0,
      monthly_earnings: parseFloat(monthlyEarnings[0]?.earnings) || 0,
      yearly_earnings: parseFloat(yearlyEarnings[0]?.earnings) || 0,
      total_completed: totalCompleted[0]?.count || 0
    };

    console.log('✅ Estadísticas calculadas:', stats);

    res.json(stats);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de ganancias:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;