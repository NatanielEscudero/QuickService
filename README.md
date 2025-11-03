🚀 QuickService Pro
Una aplicación móvil para conectar clientes con trabajadores de servicios del hogar.

📋 Características
👥 Tres tipos de usuarios: Clientes, Trabajadores, Trabajadores Inmediatos
🔐 Autenticación JWT segura
📅 Sistema de turnos programados
🚀 Servicio inmediato para emergencias
⭐ Sistema de calificaciones y reviews
💬 Chat en tiempo real

Documentación de la API - QuickService Pro
Base URL
text
http://localhost:3001/api
Autenticación
La mayoría de los endpoints requieren autenticación JWT. Incluir el token en el header:

text
Authorization: Bearer <token>
Endpoints de Autenticación (/api/auth)
Registro de Usuario
Método: POST

URL: /api/auth/register

Body:

json
{
  "email": "string",
  "password": "string (min 6 caracteres)",
  "name": "string",
  "role": "client|worker|admin",
  "phone": "string (opcional)",
  "profession": "string (solo para workers)"
}
Respuesta Exitosa (201):

json
{
  "message": "Usuario registrado exitosamente",
  "token": "jwt_token",
  "user": {
    "id": "number",
    "email": "string",
    "name": "string",
    "role": "string",
    "phone": "string",
    "profession": "string"
  }
}
Códigos de Error: 400, 409, 500

Login de Usuario
Método: POST

URL: /api/auth/login

Body:

json
{
  "email": "string",
  "password": "string"
}
Respuesta Exitosa (200):

json
{
  "message": "Login exitoso",
  "token": "jwt_token",
  "user": {
    "id": "number",
    "email": "string",
    "name": "string",
    "role": "string",
    "phone": "string",
    "avatar_url": "string",
    "is_verified": "boolean",
    "profession": "string",
    "rating": "number"
  }
}
Códigos de Error: 400, 401, 500

Verificar Token
Método: GET

URL: /api/auth/verify

Headers: Authorization: Bearer <token>

Respuesta Exitosa (200):

json
{
  "valid": true,
  "user": {
    "id": "number",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
Códigos de Error: 401, 403

Autenticación con Google
Método: POST

URL: /api/auth/google

Body:

json
{
  "token": "google_id_token"
}
Respuesta Exitosa (200):

json
{
  "message": "Autenticación con Google exitosa",
  "token": "jwt_token",
  "user": {
    "id": "number",
    "email": "string",
    "name": "string",
    "role": "string|null",
    "phone": "string",
    "avatar_url": "string",
    "is_verified": "boolean",
    "auth_provider": "string",
    "profession": "string",
    "rating": "number"
  }
}
Códigos de Error: 400, 401, 500

Verificar Email de Google
Método: POST

URL: /api/auth/google/check

Body:

json
{
  "email": "string"
}
Respuesta Exitosa (200):

json
{
  "exists": "boolean",
  "auth_provider": "local|google|null",
  "message": "string"
}
Endpoints de Usuarios (/api/users)
Obtener Perfil del Usuario
Método: GET

URL: /api/users/profile

Headers: Authorization: Bearer <token>

Respuesta Exitosa (200):

json
{
  "user": {
    "id": "number",
    "email": "string",
    "name": "string",
    "role": "string",
    "phone": "string",
    "avatar_url": "string",
    "is_verified": "boolean",
    "profession": "string",
    "description": "string",
    "availability": "string",
    "rating": "number"
  }
}
Actualizar Perfil del Usuario
Método: PUT

URL: /api/users/profile

Headers: Authorization: Bearer <token>

Body:

json
{
  "name": "string",
  "phone": "string",
  "avatar_url": "string",
  "profession": "string",
  "description": "string"
}
Respuesta Exitosa (200):

json
{
  "message": "Perfil actualizado correctamente",
  "user": {
    // Datos completos del usuario actualizado
  }
}
Actualizar Avatar (Upload)
Método: PUT

URL: /api/users/avatar

Headers: Authorization: Bearer <token>

Content-Type: multipart/form-data

Body: avatar (archivo de imagen, max 5MB)

Respuesta Exitosa (200):

json
{
  "success": true,
  "message": "Avatar actualizado correctamente",
  "avatar_url": "string",
  "user": {
    // Datos del usuario actualizado
  }
}
Actualizar Rol
Método: PUT

URL: /api/users/update-role

Headers: Authorization: Bearer <token>

Body:

json
{
  "role": "client|worker"
}
Respuesta Exitosa (200):

json
{
  "message": "Rol actualizado correctamente",
  "user": {
    // Datos del usuario actualizado
  }
}
Actualizar Profesión (Workers)
Método: PUT

URL: /api/users/update-profession

Headers: Authorization: Bearer <token>

Body:

json
{
  "profession": "string",
  "description": "string"
}
Cambiar Contraseña
Método: PUT

URL: /api/users/password

Headers: Authorization: Bearer <token>

Body:

json
{
  "currentPassword": "string",
  "newPassword": "string (min 6 caracteres)"
}
Lista de Trabajadores (Público)
Método: GET

URL: /api/users/workers

Query Params:

profession (opcional): filtrar por profesión

min_rating (opcional): filtrar por rating mínimo

available (opcional): "true" para solo disponibles

Respuesta Exitosa (200):

json
{
  "workers": [
    {
      "id": "number",
      "name": "string",
      "avatar_url": "string",
      "profession": "string",
      "description": "string",
      "availability": "string",
      "rating": "number",
      "member_since": "timestamp"
    }
  ]
}
Perfil Público de Trabajador
Método: GET

URL: /api/users/workers/:id

Respuesta Exitosa (200):

json
{
  "worker": {
    "id": "number",
    "name": "string",
    "avatar_url": "string",
    "profession": "string",
    "description": "string",
    "availability": "string",
    "rating": "number",
    "member_since": "timestamp"
  }
}
Disponibilidad del Trabajador
Método: GET

URL: /api/users/worker/availability

Headers: Authorization: Bearer <token>

Respuesta Exitosa (200):

json
{
  "immediate_service": "boolean",
  "time_slots": [
    {
      "day": "string",
      "enabled": "boolean",
      "startTime": "string",
      "endTime": "string"
    }
  ],
  "coverage_radius": "number"
}
Actualizar Disponibilidad
Método: PUT

URL: /api/users/worker/availability

Headers: Authorization: Bearer <token>

Body:

json
{
  "immediate_service": "boolean",
  "time_slots": [
    {
      "day": "string",
      "enabled": "boolean",
      "startTime": "string",
      "endTime": "string"
    }
  ],
  "coverage_radius": "number"
}
Ganancias del Trabajador
Método: GET

URL: /api/users/worker/earnings

Headers: Authorization: Bearer <token>

Query Params: range (week|month|year, default: week)

Respuesta Exitosa (200):

json
{
  "total_earnings": "number",
  "pending_earnings": "number",
  "transactions": [
    {
      "id": "number",
      "date": "timestamp",
      "service_type": "string",
      "client_name": "string",
      "total_cost": "number",
      "status": "string",
      "scheduled_date": "date"
    }
  ]
}
Estadísticas de Ganancias
Método: GET

URL: /api/users/worker/earnings/stats

Headers: Authorization: Bearer <token>

Respuesta Exitosa (200):

json
{
  "weekly_earnings": "number",
  "monthly_earnings": "number",
  "yearly_earnings": "number",
  "total_completed": "number"
}
Endpoints de Citas/Turnos (/api/appointments)
Contactar Profesional
Método: POST

URL: /api/appointments/contact

Headers: Authorization: Bearer <token>

Body:

json
{
  "worker_id": "number",
  "service_type": "string",
  "urgency": "low|medium|high",
  "description": "string",
  "budget_estimate": "number",
  "preferred_date": "date",
  "preferred_time": "time",
  "contact_method": "phone|email|both"
}
Respuesta Exitosa (200):

json
{
  "message": "Solicitud enviada correctamente",
  "request": {
    "id": "number",
    "client_id": "number",
    "worker_id": "number",
    "service_type": "string",
    "status": "string",
    "worker_name": "string",
    "worker_email": "string"
  }
}
Programar Turno
Método: POST

URL: /api/appointments

Headers: Authorization: Bearer <token>

Body:

json
{
  "worker_id": "number",
  "service_type": "string",
  "description": "string",
  "scheduled_date": "date",
  "scheduled_time": "time",
  "address": "string",
  "contact_phone": "string",
  "special_instructions": "string"
}
Respuesta Exitosa (201):

json
{
  "message": "Turno programado correctamente",
  "appointment": {
    "id": "number",
    "client_id": "number",
    "worker_id": "number",
    "service_type": "string",
    "status": "string",
    "worker_name": "string"
  }
}
Mis Turnos
Método: GET

URL: /api/appointments/my-appointments

Headers: Authorization: Bearer <token>

Respuesta Exitosa (200):

json
{
  "appointments": [
    {
      "id": "number",
      "client_id": "number",
      "worker_id": "number",
      "service_type": "string",
      "status": "string",
      "scheduled_date": "date",
      "scheduled_time": "time",
      "worker_name": "string",
      "client_name": "string"
    }
  ],
  "message": "string"
}
Mis Solicitudes
Método: GET

URL: /api/appointments/my-requests

Headers: Authorization: Bearer <token>

Respuesta Exitosa (200):

json
{
  "requests": [
    {
      "id": "number",
      "client_id": "number",
      "worker_id": "number",
      "service_type": "string",
      "status": "string",
      "urgency": "string",
      "worker_name": "string",
      "client_name": "string"
    }
  ],
  "message": "string"
}
Turnos del Trabajador
Método: GET

URL: /api/appointments/worker-appointments

Headers: Authorization: Bearer <token>

Respuesta: Similar a "Mis Turnos" pero filtrado por worker

Solicitudes del Trabajador
Método: GET

URL: /api/appointments/worker-requests

Headers: Authorization: Bearer <token>

Respuesta: Similar a "Mis Solicitudes" pero filtrado por worker

Actualizar Estado de Turno
Método: PUT

URL: /api/appointments/:id/status

Headers: Authorization: Bearer <token>

Body:

json
{
  "status": "pending|confirmed|in_progress|completed|cancelled"
}
Actualizar Estado de Solicitud
Método: PUT

URL: /api/appointments/requests/:id/status

Headers: Authorization: Bearer <token>

Body:

json
{
  "status": "pending|accepted|rejected|completed"
}
Aceptar Solicitud con Presupuesto
Método: PUT

URL: /api/appointments/requests/:id/accept

Headers: Authorization: Bearer <token>

Body:

json
{
  "budget_amount": "number"
}
Respuesta Exitosa (200):

json
{
  "message": "Solicitud aceptada y turno creado correctamente",
  "appointment": {
    // Datos del appointment creado
  },
  "budget_estimate": "number"
}
Actualizar Precio de Appointment
Método: PUT

URL: /api/appointments/:id/price

Headers: Authorization: Bearer <token>

Body:

json
{
  "total_cost": "number"
}
Ganancias del Trabajador (Appointments)
Método: GET

URL: /api/appointments/worker/earnings

Headers: Authorization: Bearer <token>

Query Params: range (week|month|year, default: week)

Respuesta Exitosa (200):

json
{
  "total_earnings": "number",
  "pending_earnings": "number",
  "transactions": [
    {
      "id": "number",
      "service_type": "string",
      "total_cost": "number",
      "status": "string",
      "date": "date",
      "client_name": "string"
    }
  ]
}
Endpoints de Categorías (/api/categories)
Obtener Todas las Categorías
Método: GET

URL: /api/categories

Respuesta Exitosa (200):

json
{
  "categories": [
    {
      "id": "number",
      "name": "string",
      "icon": "string",
      "description": "string"
    }
  ]
}
Obtener Categoría Específica
Método: GET

URL: /api/categories/:id

Respuesta Exitosa (200):

json
{
  "category": {
    "id": "number",
    "name": "string",
    "icon": "string",
    "description": "string"
  }
}
Endpoints del Sistema
Health Check
Método: GET

URL: /api/health

Respuesta Exitosa (200):

json
{
  "status": "OK",
  "message": "QuickService Pro API is running",
  "timestamp": "ISO string",
  "environment": "string"
}
Test Users
Método: GET

URL: /api/test-users

Respuesta Exitosa (200):

json
{
  "message": "Conexión a users funciona",
  "users": [
    {
      "id": "number",
      "name": "string",
      "email": "string"
    }
  ]
}
Códigos de Error Comunes
200: OK - Solicitud exitosa

201: Created - Recurso creado exitosamente

400: Bad Request - Datos de entrada inválidos

401: Unauthorized - Token inválido o expirado

403: Forbidden - No tiene permisos para la acción

404: Not Found - Recurso no encontrado

409: Conflict - El recurso ya existe

500: Internal Server Error - Error del servidor

Headers Especiales
Para Subida de Archivos:
text
Content-Type: multipart/form-data
Para Autenticación:
text
Authorization: Bearer <jwt_token>
Para CORS:
Los endpoints aceptan requests de:

http://localhost:3000

http://localhost:8081

http://localhost:19006

exp://localhost:19000

Direcciones locales (192.168.*)

Variables de entorno

# Google OAuth
GOOGLE_CLIENT_ID=584687367545-o8tunkjli3m774l3l9tesfc1fcofhob6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_y_larga_aqui_2024
JWT_EXPIRES_IN=24h