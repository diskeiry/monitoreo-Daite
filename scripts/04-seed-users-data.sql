-- Insertar roles predefinidos
INSERT INTO user_roles (name, description, permissions) VALUES
(
    'super_admin',
    'Super Administrador - Acceso completo al sistema',
    '{
        "manage_users": true,
        "manage_roles": true,
        "manage_certificates": true,
        "view_analytics": true,
        "export_data": true,
        "import_data": true,
        "manage_settings": true,
        "view_logs": true,
        "manage_notifications": true
    }'
),
(
    'admin',
    'Administrador - Gestión de certificados y usuarios',
    '{
        "manage_users": true,
        "manage_certificates": true,
        "view_analytics": true,
        "export_data": true,
        "import_data": true,
        "manage_notifications": true
    }'
),
(
    'manager',
    'Gerente - Gestión de certificados y reportes',
    '{
        "manage_certificates": true,
        "view_analytics": true,
        "export_data": true,
        "manage_notifications": false
    }'
),
(
    'operator',
    'Operador - Gestión básica de certificados',
    '{
        "manage_certificates": true,
        "view_analytics": false,
        "export_data": false,
        "manage_notifications": false
    }'
),
(
    'viewer',
    'Visualizador - Solo lectura',
    '{
        "manage_certificates": false,
        "view_analytics": true,
        "export_data": false,
        "manage_notifications": false
    }'
)
ON CONFLICT (name) DO NOTHING;

-- Insertar usuarios de ejemplo (estos se crearán cuando los usuarios se registren)
-- Por ahora solo insertamos la estructura, los usuarios reales se crearán via Supabase Auth

-- Función para crear un usuario del sistema cuando se registra en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Obtener el rol por defecto (viewer)
    SELECT id INTO default_role_id FROM user_roles WHERE name = 'viewer' LIMIT 1;
    
    -- Insertar el nuevo usuario en system_users
    INSERT INTO public.system_users (
        auth_user_id,
        email,
        first_name,
        last_name,
        role_id,
        status
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        default_role_id,
        'active'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para crear usuario automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar last_login
CREATE OR REPLACE FUNCTION public.update_user_last_login(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE system_users 
    SET 
        last_login = NOW(),
        login_count = login_count + 1
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar actividad del usuario
CREATE OR REPLACE FUNCTION public.log_user_activity(
    user_email TEXT,
    action_name TEXT,
    resource_type_param TEXT DEFAULT NULL,
    resource_id_param TEXT DEFAULT NULL,
    details_param JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO user_id_var FROM system_users WHERE email = user_email;
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO user_activity_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            details
        ) VALUES (
            user_id_var,
            action_name,
            resource_type_param,
            resource_id_param,
            details_param
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
