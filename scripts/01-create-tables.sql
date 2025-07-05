-- Crear tabla para certificados SSL
CREATE TABLE IF NOT EXISTS ssl_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('APP MOVIL', 'PAGINAS')),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVADO',
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_domain ON ssl_certificates(domain);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_type ON ssl_certificates(type);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_expiration_date ON ssl_certificates(expiration_date);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_status ON ssl_certificates(status);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_ssl_certificates_updated_at ON ssl_certificates;
CREATE TRIGGER update_ssl_certificates_updated_at
    BEFORE UPDATE ON ssl_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir acceso a usuarios autenticados)
CREATE POLICY "Users can view all certificates" ON ssl_certificates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert certificates" ON ssl_certificates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update certificates" ON ssl_certificates
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete certificates" ON ssl_certificates
    FOR DELETE USING (true);
