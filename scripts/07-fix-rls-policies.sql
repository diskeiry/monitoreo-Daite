-- Deshabilitar RLS temporalmente para evitar recursión infinita
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que pueden causar recursión
DROP POLICY IF EXISTS "Users can view their own profile" ON system_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON system_users;
DROP POLICY IF EXISTS "Admins can manage all users" ON system_users;
DROP POLICY IF EXISTS "Users can view roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Crear políticas más simples que no causen recursión
-- Política para que los usuarios puedan ver su propio perfil usando auth.uid()
CREATE POLICY "Users can view own profile" ON system_users
    FOR SELECT USING (auth_user_id = auth.uid());

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON system_users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Política simple para administradores (usando email específico)
CREATE POLICY "Admin can manage users" ON system_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@demo.com'
        )
    );

-- Políticas para roles (solo lectura para usuarios autenticados)
CREATE POLICY "Authenticated users can view roles" ON user_roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para administradores en roles
CREATE POLICY "Admin can manage roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@demo.com'
        )
    );

-- Habilitar RLS nuevamente
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Para las otras tablas, mantener RLS deshabilitado por ahora
-- ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
