const express = require('express');
const { promisePool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/appointments/contact - Contactar profesional (GUARDA EN BD)
router.post('/contact', authenticateToken, async (req, res) => {
  try {
    const { worker_id, service_type, urgency, description, budget_estimate, preferred_date, preferred_time, contact_method } = req.body;
    
    console.log('📞 Solicitud de contacto recibida:', {
      client_id: req.user.id,
      worker_id,
      service_type,
      urgency,
      description
    });

    // Validaciones
    if (!worker_id || !service_type) {
      return res.status(400).json({ error: 'worker_id y service_type son requeridos' });
    }

    // Verificar que el worker existe
    const [workers] = await promisePool.execute(
      'SELECT id, name, email FROM users WHERE id = ? AND role = "worker"',
      [worker_id]
    );

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const worker = workers[0];

    // ✅ GUARDAR EN LA BASE DE DATOS - service_requests
    const [result] = await promisePool.execute(
      `INSERT INTO service_requests 
       (client_id, worker_id, service_type, urgency, description, budget_estimate, preferred_date, preferred_time, contact_method, client_phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        worker_id,
        service_type,
        urgency || 'medium',
        description || null,
        budget_estimate || null,
        preferred_date || null,
        preferred_time || null,
        contact_method || 'both',
        req.user.phone || null
      ]
    );

    // Obtener la solicitud guardada
    const [savedRequests] = await promisePool.execute(
      `SELECT sr.*, u.name as worker_name, u.email as worker_email
       FROM service_requests sr
       INNER JOIN users u ON sr.worker_id = u.id
       WHERE sr.id = ?`,
      [result.insertId]
    );

    const savedRequest = savedRequests[0];

    console.log('✅ Solicitud guardada en BD con ID:', result.insertId);

    res.json({
      message: 'Solicitud enviada correctamente',
      request: savedRequest
    });

  } catch (error) {
    console.error('❌ Error guardando solicitud:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/appointments - Programar turno (GUARDA EN BD)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { worker_id, service_type, description, scheduled_date, scheduled_time, address, contact_phone, special_instructions } = req.body;
    
    console.log('📅 Solicitud de turno recibida:', {
      client_id: req.user.id,
      worker_id,
      service_type,
      scheduled_date,
      scheduled_time
    });

    // Validaciones
    if (!worker_id || !service_type || !scheduled_date || !scheduled_time) {
      return res.status(400).json({ 
        error: 'worker_id, service_type, scheduled_date y scheduled_time son requeridos' 
      });
    }

    // Verificar que el worker existe
    const [workers] = await promisePool.execute(
      'SELECT id, name FROM users WHERE id = ? AND role = "worker"',
      [worker_id]
    );

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const worker = workers[0];

    // ✅ GUARDAR EN LA BASE DE DATOS - appointments
    const [result] = await promisePool.execute(
      `INSERT INTO appointments 
       (client_id, worker_id, service_type, description, scheduled_date, scheduled_time, address, contact_phone, special_instructions) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        worker_id,
        service_type,
        description || null,
        scheduled_date,
        scheduled_time,
        address || null,
        contact_phone || null,
        special_instructions || null
      ]
    );

    // Obtener el turno guardado
    const [savedAppointments] = await promisePool.execute(
      `SELECT a.*, u.name as worker_name, u.email as worker_email
       FROM appointments a
       INNER JOIN users u ON a.worker_id = u.id
       WHERE a.id = ?`,
      [result.insertId]
    );

    const savedAppointment = savedAppointments[0];

    console.log('✅ Turno guardado en BD con ID:', result.insertId);

    res.status(201).json({
      message: 'Turno programado correctamente',
      appointment: savedAppointment
    });

  } catch (error) {
    console.error('❌ Error guardando turno:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/appointments/my-appointments - Obtener mis turnos (DESDE BD)
router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    const [appointments] = await promisePool.execute(
      `SELECT a.*, 
              u.name as worker_name, u.email as worker_email, u.phone as worker_phone,
              uc.name as client_name, uc.email as client_email
       FROM appointments a
       INNER JOIN users u ON a.worker_id = u.id
       INNER JOIN users uc ON a.client_id = uc.id
       WHERE a.client_id = ? OR a.worker_id = ?
       ORDER BY a.scheduled_date DESC, a.scheduled_time DESC`,
      [req.user.id, req.user.id]
    );

    console.log('✅ Turnos encontrados:', appointments.length);

    res.json({ 
      appointments: appointments,
      message: appointments.length === 0 ? 'No hay turnos programados' : 'Turnos cargados correctamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo turnos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/appointments/my-requests - Obtener mis solicitudes (DESDE BD)
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const [requests] = await promisePool.execute(
      `SELECT sr.*, 
              u.name as worker_name, u.email as worker_email,
              uc.name as client_name, uc.email as client_email
       FROM service_requests sr
       INNER JOIN users u ON sr.worker_id = u.id
       INNER JOIN users uc ON sr.client_id = uc.id
       WHERE sr.client_id = ? OR sr.worker_id = ?
       ORDER BY sr.created_at DESC`,
      [req.user.id, req.user.id]
    );

    console.log('✅ Solicitudes encontradas:', requests.length);

    res.json({ 
      requests: requests,
      message: requests.length === 0 ? 'No hay solicitudes' : 'Solicitudes cargadas correctamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo solicitudes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/appointments/:id/status - Actualizar estado de turno
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Verificar permisos
    const [appointments] = await promisePool.execute(
      'SELECT * FROM appointments WHERE id = ? AND (client_id = ? OR worker_id = ?)',
      [appointmentId, req.user.id, req.user.id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    await promisePool.execute(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, appointmentId]
    );

    res.json({ message: 'Estado actualizado correctamente', status });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/appointments/requests/:id/status - Actualizar estado de solicitud
router.put('/requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;

    const validStatuses = ['pending', 'accepted', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Verificar permisos (solo el worker puede actualizar)
    const [requests] = await promisePool.execute(
      'SELECT * FROM service_requests WHERE id = ? AND worker_id = ?',
      [requestId, req.user.id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no tienes permisos' });
    }

    await promisePool.execute(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      [status, requestId]
    );

    res.json({ message: 'Estado actualizado correctamente', status });
  } catch (error) {
    console.error('Error actualizando estado de solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/appointments/requests/:id/accept - Aceptar con presupuesto
router.put('/requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { budget_amount } = req.body; // ✅ Recibir el presupuesto

    // Verificar permisos y obtener la solicitud
    const [requests] = await promisePool.execute(
      'SELECT * FROM service_requests WHERE id = ? AND worker_id = ?',
      [requestId, req.user.id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no tienes permisos' });
    }

    const serviceRequest = requests[0];

    // Iniciar transacción
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Actualizar estado de la solicitud a 'accepted'
      await connection.execute(
        'UPDATE service_requests SET status = ?, budget_estimate = ? WHERE id = ?',
        ['accepted', budget_amount, requestId] // ✅ Guardar el presupuesto
      );

      // 2. Crear un turno automáticamente basado en la solicitud
      const [appointmentResult] = await connection.execute(
        `INSERT INTO appointments 
         (client_id, worker_id, service_type, description, scheduled_date, scheduled_time, status, total_cost) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serviceRequest.client_id,
          serviceRequest.worker_id,
          serviceRequest.service_type,
          serviceRequest.description || 'Servicio aceptado desde solicitud',
          serviceRequest.preferred_date || new Date().toISOString().split('T')[0],
          serviceRequest.preferred_time || '10:00:00',
          'pending',
          budget_amount // ✅ Usar el presupuesto en el appointment
        ]
      );

      await connection.commit();

      // Obtener el turno creado
      const [appointments] = await promisePool.execute(
        `SELECT a.*, u.name as client_name, u.email as client_email
         FROM appointments a
         INNER JOIN users u ON a.client_id = u.id
         WHERE a.id = ?`,
        [appointmentResult.insertId]
      );

      const createdAppointment = appointments[0];

      res.json({ 
        message: 'Solicitud aceptada y turno creado correctamente',
        appointment: createdAppointment,
        budget_estimate: budget_amount // ✅ Devolver el presupuesto
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error aceptando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agrega esta ruta en tu server.js - después de las otras rutas de appointments

// PUT /api/appointments/:id/price - Actualizar precio de un appointment
router.put('/:id/price', authenticateToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { total_cost } = req.body;

    console.log('💰 Actualizando precio del appointment:', appointmentId, 'a:', total_cost);

    // Verificar que el appointment pertenece al trabajador
    const [appointments] = await promisePool.execute(
      'SELECT * FROM appointments WHERE id = ? AND worker_id = ?',
      [appointmentId, req.user.id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Appointment no encontrado o no tienes permisos' });
    }

    // Actualizar precio en la base de datos
    await promisePool.execute(
      'UPDATE appointments SET total_cost = ?, updated_at = NOW() WHERE id = ?',
      [total_cost, appointmentId]
    );

    console.log('✅ Precio actualizado correctamente en la base de datos');

    res.json({ 
      message: 'Precio actualizado correctamente', 
      total_cost: total_cost,
      appointment_id: appointmentId
    });

  } catch (error) {
    console.error('❌ Error actualizando precio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/appointments/worker/earnings - Obtener ganancias del trabajador
router.get('/worker/earnings', authenticateToken, async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    const workerId = req.user.id;

    console.log('💰 Obteniendo ganancias para trabajador:', workerId, 'rango:', range);

    let dateFilter = '';
    let dateParams = [];

    // Definir filtro de fecha según el rango
    switch (range) {
      case 'week':
        dateFilter = 'AND a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateFilter = 'AND a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case 'year':
        dateFilter = 'AND a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
      default:
        dateFilter = 'AND a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    }

    // Obtener transacciones completadas
    const [completedTransactions] = await promisePool.execute(
      `SELECT 
        a.id,
        a.service_type,
        a.total_cost,
        a.status,
        a.scheduled_date as date,
        a.created_at,
        u.name as client_name
       FROM appointments a
       INNER JOIN users u ON a.client_id = u.id
       WHERE a.worker_id = ? 
       AND a.status = 'completed'
       ${dateFilter}
       ORDER BY a.scheduled_date DESC`,
      [workerId]
    );

    // Obtener transacciones pendientes (en progreso o confirmados con precio)
    const [pendingTransactions] = await promisePool.execute(
      `SELECT 
        a.id,
        a.service_type,
        a.total_cost,
        a.status,
        a.scheduled_date as date,
        a.created_at,
        u.name as client_name
       FROM appointments a
       INNER JOIN users u ON a.client_id = u.id
       WHERE a.worker_id = ? 
       AND a.status IN ('in_progress', 'confirmed')
       AND a.total_cost IS NOT NULL
       AND a.total_cost > 0
       ORDER BY a.scheduled_date DESC`,
      [workerId]
    );

    // Calcular totales
    const total_earnings = completedTransactions.reduce((sum, transaction) => 
      sum + (parseFloat(transaction.total_cost) || 0), 0
    );

    const pending_earnings = pendingTransactions.reduce((sum, transaction) => 
      sum + (parseFloat(transaction.total_cost) || 0), 0
    );

    // Combinar transacciones para el historial
    const allTransactions = [
      ...completedTransactions.map(t => ({ ...t, status: 'completed' })),
      ...pendingTransactions.map(t => ({ ...t, status: 'pending' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('✅ Ganancias calculadas:', {
      total_earnings,
      pending_earnings,
      transactions_count: allTransactions.length
    });

    res.json({
      total_earnings,
      pending_earnings,
      transactions: allTransactions
    });

  } catch (error) {
    console.error('❌ Error obteniendo ganancias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/appointments/worker/earnings/stats - Obtener estadísticas de ganancias
router.get('/worker/earnings/stats', authenticateToken, async (req, res) => {
  try {
    const workerId = req.user.id;

    console.log('📊 Obteniendo estadísticas para trabajador:', workerId);

    // Ganancias de la semana (últimos 7 días)
    const [weeklyEarnings] = await promisePool.execute(
      `SELECT COALESCE(SUM(total_cost), 0) as total
       FROM appointments 
       WHERE worker_id = ? 
       AND status = 'completed'
       AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [workerId]
    );

    // Ganancias del mes (últimos 30 días)
    const [monthlyEarnings] = await promisePool.execute(
      `SELECT COALESCE(SUM(total_cost), 0) as total
       FROM appointments 
       WHERE worker_id = ? 
       AND status = 'completed'
       AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [workerId]
    );

    // Ganancias del año (últimos 365 días)
    const [yearlyEarnings] = await promisePool.execute(
      `SELECT COALESCE(SUM(total_cost), 0) as total
       FROM appointments 
       WHERE worker_id = ? 
       AND status = 'completed'
       AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)`,
      [workerId]
    );

    // Total de servicios completados
    const [totalCompleted] = await promisePool.execute(
      `SELECT COUNT(*) as total
       FROM appointments 
       WHERE worker_id = ? 
       AND status = 'completed'`,
      [workerId]
    );

    const stats = {
      weekly_earnings: parseFloat(weeklyEarnings[0].total) || 0,
      monthly_earnings: parseFloat(monthlyEarnings[0].total) || 0,
      yearly_earnings: parseFloat(yearlyEarnings[0].total) || 0,
      total_completed: totalCompleted[0].total || 0
    };

    console.log('✅ Estadísticas calculadas:', stats);

    res.json(stats);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// GET /api/appointments/worker-requests - Obtener solicitudes del trabajador
router.get('/worker-requests', authenticateToken, async (req, res) => {
  try {
    const [requests] = await promisePool.execute(
      `SELECT sr.*, 
              u.name as worker_name, u.email as worker_email,
              uc.name as client_name, uc.email as client_email, uc.phone as client_phone
       FROM service_requests sr
       INNER JOIN users u ON sr.worker_id = u.id
       INNER JOIN users uc ON sr.client_id = uc.id
       WHERE sr.worker_id = ?
       ORDER BY sr.created_at DESC`,
      [req.user.id]  // Solo donde el usuario es el trabajador
    );

    console.log('🔍 Debug - User making worker-requests request:', req.user.id);
    console.log('🔍 Debug - Worker requests found:', requests.map(r => ({ 
      id: r.id, 
      worker_id: r.worker_id, 
      client_id: r.client_id,
      status: r.status,
      service_type: r.service_type
    })));

    console.log('✅ Solicitudes del trabajador encontradas:', requests.length);

    res.json({ 
      requests: requests,
      message: requests.length === 0 ? 'No hay solicitudes pendientes' : 'Solicitudes cargadas correctamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo solicitudes del trabajador:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/appointments/worker-appointments - Obtener turnos del trabajador
router.get('/worker-appointments', authenticateToken, async (req, res) => {
  try {
    const [appointments] = await promisePool.execute(
      `SELECT a.*, 
              u.name as worker_name, u.email as worker_email, u.phone as worker_phone,
              uc.name as client_name, uc.email as client_email
       FROM appointments a
       INNER JOIN users u ON a.worker_id = u.id
       INNER JOIN users uc ON a.client_id = uc.id
       WHERE a.worker_id = ?
       ORDER BY a.scheduled_date DESC, a.scheduled_time DESC`,
      [req.user.id]  // Solo donde el usuario es el trabajador
    );

    console.log('🔍 Debug - User making worker-appointments request:', req.user.id);
    console.log('🔍 Debug - Worker appointments found:', appointments.map(a => ({ 
      id: a.id, 
      worker_id: a.worker_id, 
      client_id: a.client_id,
      status: a.status,
      service_type: a.service_type
    })));

    console.log('✅ Turnos del trabajador encontrados:', appointments.length);

    res.json({ 
      appointments: appointments,
      message: appointments.length === 0 ? 'No hay turnos programados' : 'Turnos cargados correctamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo turnos del trabajador:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;