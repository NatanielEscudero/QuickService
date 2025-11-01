const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');
const bcrypt = require('bcrypt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class GoogleAuthController {
  // Verificar token de Google
  static async verifyGoogleToken(token) {
    try {
      console.log('🔐 Verificando token Google...');
      
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      console.log('✅ Token Google válido - Usuario:', payload.email);
      
      return {
        success: true,
        payload
      };
    } catch (error) {
      console.error('❌ Error verificando token Google:', error.message);
      return {
        success: false,
        error: 'Token de Google inválido'
      };
    }
  }

  // Buscar o crear usuario con Google - CON FORZADO NUCLEAR
  static async findOrCreateUser(googleUser) {
    const connection = await promisePool.getConnection();
    
    try {
      await connection.beginTransaction();

      console.log('👤 Buscando/creando usuario para:', googleUser.email);
      console.log('🔍 Verificando si usuario existe por google_id:', googleUser.sub);

      // Verificar si el usuario ya existe por google_id
      const [existingUsers] = await connection.execute(
        'SELECT * FROM users WHERE google_id = ?',
        [googleUser.sub]
      );

      let user;
      let isNewUser = false;

      if (existingUsers.length > 0) {
        // Usuario existe - actualizar información
        user = existingUsers[0];
        console.log('✅ Usuario existente encontrado por google_id:', user.id, 'Rol actual:', user.role);
        
        await connection.execute(
          `UPDATE users 
           SET name = ?, avatar_url = ?, email_verified = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [googleUser.name, googleUser.picture, true, user.id]
        );
      } else {
        // Verificar si el email ya está registrado (registro local)
        const [emailUsers] = await connection.execute(
          'SELECT * FROM users WHERE email = ? AND auth_provider = "local"',
          [googleUser.email]
        );

        if (emailUsers.length > 0) {
          // Email ya existe con registro local - fusionar cuentas
          user = emailUsers[0];
          console.log('🔄 Fusionando cuenta local con Google para usuario:', user.id, 'Rol actual:', user.role);
          
          await connection.execute(
            `UPDATE users 
             SET google_id = ?, auth_provider = 'google', 
                 name = ?, avatar_url = ?, email_verified = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [googleUser.sub, googleUser.name, googleUser.picture, true, user.id]
          );
        } else {
          // ✅ PASO 2 IMPLEMENTADO: Crear nuevo usuario CON FORZADO DE NULL
          const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 12);
          
          console.log('🆕 Creando NUEVO usuario con Google - Forzando NULL en rol');
          
          // 1. Insertar con NULL
          const [userResult] = await connection.execute(
            `INSERT INTO users (email, password, name, role, avatar_url, google_id, email_verified, auth_provider) 
             VALUES (?, ?, ?, NULL, ?, ?, true, 'google')`,
            [googleUser.email, randomPassword, googleUser.name, googleUser.picture, googleUser.sub]
          );

          console.log('✅ Usuario insertado con ID:', userResult.insertId);

          // 2. FORZAR NULL explícitamente en el objeto
          user = {
            id: userResult.insertId,
            email: googleUser.email,
            name: googleUser.name,
            role: null, // ← FORZAR NULL aquí directamente
            avatar_url: googleUser.picture,
            google_id: googleUser.sub,
            email_verified: true,
            auth_provider: 'google'
          };
          
          isNewUser = true;
          
          // 3. ACTUALIZAR la BD para asegurar NULL (doble garantía)
          await connection.execute(
            'UPDATE users SET role = NULL WHERE id = ?',
            [userResult.insertId]
          );
          
          console.log('✅ Rol forzado a NULL en la base de datos y en el objeto');

          // 4. VERIFICAR que quedó NULL en la BD
          const [verifyUser] = await connection.execute(
            'SELECT id, email, role FROM users WHERE id = ?',
            [userResult.insertId]
          );

          console.log('🔍 VERIFICACIÓN FINAL - Rol en BD después de forzar:', {
            id: verifyUser[0].id,
            email: verifyUser[0].email,
            role: verifyUser[0].role,
            role_is_null: verifyUser[0].role === null
          });
        }
      }

      await connection.commit();

      // Obtener usuario completo para enviar al frontend
      const [completeUsers] = await connection.execute(`
        SELECT u.*, w.profession, w.rating 
        FROM users u 
        LEFT JOIN workers w ON u.id = w.user_id 
        WHERE u.id = ?
      `, [user.id]);

      let finalUser = completeUsers[0];
      
      // ✅ PASO 3 EXTRA: FORZADO NUCLEAR - SIN IMPORTAR LO QUE DIGA LA BD
      if (isNewUser) {
        console.log('💥 FORZADO NUCLEAR: Asegurando role: null para nuevo usuario Google');
        console.log('💥 ANTES del forzado - rol:', finalUser.role);
        
        // Crear un NUEVO objeto con role: null
        finalUser = {
          ...finalUser,
          role: null // Esto sobrescribe CUALQUIER valor
        };
        
        console.log('💥 DESPUÉS del forzado - rol:', finalUser.role);
      }
      
      console.log('💥 USUARIO FINAL DESPUÉS DEL FORZADO NUCLEAR:', {
        id: finalUser.id,
        email: finalUser.email,
        role: finalUser.role,
        role_type: typeof finalUser.role,
        role_is_null: finalUser.role === null,
        auth_provider: finalUser.auth_provider,
        isNewUser: isNewUser
      });
      
      return finalUser;

    } catch (error) {
      await connection.rollback();
      console.error('❌ Error en findOrCreateUser:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Generar token JWT para usuario de Google
  static generateToken(user) {
    console.log('🔐 Generando JWT token para usuario:', {
      id: user.id,
      email: user.email,
      role: user.role,
      role_type: typeof user.role,
      role_is_null: user.role === null
    });

    // ✅ Asegurar que el rol sea null para nuevos usuarios
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role, // Esto debería ser NULL para nuevos usuarios
      name: user.name,
      authProvider: user.auth_provider
    };

    console.log('📝 Payload del JWT:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('✅ JWT token generado exitosamente');
    return token;
  }
}

module.exports = GoogleAuthController;