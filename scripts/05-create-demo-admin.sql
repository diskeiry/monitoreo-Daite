-- Crear un usuario administrador de ejemplo
-- NOTA: Este script es solo para desarrollo/demo. En producción, los usuarios se crean via registro.

DO $$
DECLARE
    admin_role_id UUID;
    demo_user_id UUID;
BEGIN
    -- Obtener el ID del rol de administrador
    SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin' LIMIT 1;
    
    -- Verificar si ya existe el usuario demo
    SELECT id INTO demo_user_id FROM system_users WHERE email = 'admin@demo.com';
    
    -- Si no existe, crear el usuario demo
    IF demo_user_id IS NULL THEN
        INSERT INTO system_users (
            email,
            first_name,
            last_name,
            role_id,
            status
        ) VALUES (
            'admin@demo.com',
            'Admin',
            'Demo',
            admin_role_id,
            'active'
        );
        
        RAISE NOTICE 'Usuario demo creado: admin@demo.com';
    ELSE
        RAISE NOTICE 'Usuario demo ya existe: admin@demo.com';
    END IF;
END $$;
