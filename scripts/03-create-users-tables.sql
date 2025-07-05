-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS system_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id UUID REFERENCES user_roles(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    phone VARCHAR(20),
    department VARCHAR(100),
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES system_users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES system_users(id) ON DELETE SET NULL
);

-- Crear tabla de sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES system_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de logs de actividad
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES system_users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_role_id ON system_users(role_id);
CREATE INDEX IF NOT EXISTS idx_system_users_status ON system_users(status);
CREATE INDEX IF NOT EXISTS idx_system_users_auth_user_id ON system_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_users_updated_at ON system_users;
CREATE TRIGGER update_system_users_updated_at
    BEFORE UPDATE ON system_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad para user_roles
CREATE POLICY "Users can view all roles" ON user_roles
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.auth_user_id = auth.uid()
            AND ur.permissions->>'manage_users' = 'true'
        )
    );

-- Crear políticas de seguridad para system_users
CREATE POLICY "Users can view their own profile" ON system_users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can view all users" ON system_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.auth_user_id = auth.uid()
            AND ur.permissions->>'manage_users' = 'true'
        )
    );

CREATE POLICY "Users can update their own profile" ON system_users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage all users" ON system_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.auth_user_id = auth.uid()
            AND ur.permissions->>'manage_users' = 'true'
        )
    );

-- Crear políticas para user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM system_users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (
        user_id IN (
            SELECT id FROM system_users WHERE auth_user_id = auth.uid()
        )
    );

-- Crear políticas para user_activity_logs
CREATE POLICY "Users can view their own activity" ON user_activity_logs
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM system_users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activity" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM system_users su
            JOIN user_roles ur ON su.role_id = ur.id
            WHERE su.auth_user_id = auth.uid()
            AND ur.permissions->>'manage_users' = 'true'
        )
    );
