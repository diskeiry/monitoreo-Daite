-- Deshabilitar RLS completamente en todas las tablas de usuarios
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON system_users;
DROP POLICY IF EXISTS "Users can update own profile" ON system_users;
DROP POLICY IF EXISTS "Admin can manage users" ON system_users;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own profile" ON system_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON system_users;
DROP POLICY IF EXISTS "Admins can manage all users" ON system_users;
DROP POLICY IF EXISTS "Users can view roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Verificar que no hay políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('system_users', 'user_roles', 'user_sessions', 'user_activity_logs');
