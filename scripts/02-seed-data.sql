-- Insertar datos iniciales de certificados SSL
INSERT INTO ssl_certificates (domain, type, status, expiration_date, description) VALUES
-- APP MOVIL
('app.coopemopc.com', 'APP MOVIL', 'ACTIVADO', '2025-06-11 14:31:02+00', 'Aplicación móvil principal'),
('app.coopdespertar.com', 'APP MOVIL', 'ACTIVADO', '2025-08-24 13:10:47+00', 'App móvil Coop Despertar'),
('app.coophispanica.com.do', 'APP MOVIL', 'ACTIVADO', '2025-08-25 08:58:02+00', 'App móvil Coop Hispánica'),
('app.avalcoop.com', 'APP MOVIL', 'ACTIVADO', '2025-08-24 15:32:17+00', 'App móvil Avalcoop'),
('app.coopleal.do', 'APP MOVIL', 'ACTIVADO', '2025-06-08 10:23:28+00', 'App móvil Coop Leal'),
('app.coopriogrande.com', 'APP MOVIL', 'ACTIVADO', '2025-08-25 07:45:12+00', 'App móvil Coop Rio Grande'),
('app.coopco.com.do', 'APP MOVIL', 'ACTIVADO', '2025-08-25 10:09:30+00', 'App móvil Coopco'),
('app.coopacsemj.com', 'APP MOVIL', 'ACTIVADO', '2025-08-25 09:43:06+00', 'App móvil Coopacsemj'),
('app.coopmicro.com.do', 'APP MOVIL', 'ACTIVADO', '2025-08-24 14:45:11+00', 'App móvil Coop Micro'),
('app.coopanela.com.do', 'APP MOVIL', 'ACTIVADO', '2025-08-24 14:45:11+00', 'App móvil Coop Anela'),
('app.beautycoop.com.do', 'APP MOVIL', 'ACTIVADO', '2025-09-01 13:51:16+00', 'App móvil Beauty Coop'),
('app.coopsantiago.com', 'APP MOVIL', 'ACTIVADO', '2025-06-30 10:19:44+00', 'App móvil Coop Santiago'),

-- PAGINAS
('coopsantiago.com', 'PAGINAS', 'ACTIVADO', '2025-09-03 11:08:49+00', 'Sitio web Coop Santiago'),
('coopriogrande.com', 'PAGINAS', 'ACTIVADO', '2025-08-05 17:47:04+00', 'Sitio web Coop Rio Grande'),
('coopanela.com.do', 'PAGINAS', 'ACTIVADO', '2025-07-11 14:47:03+00', 'Sitio web Coop Anela'),
('coopleal.do', 'PAGINAS', 'ACTIVADO', '2025-07-17 22:35:22+00', 'Sitio web Coop Leal'),
('avalcoop.com', 'PAGINAS', 'ACTIVADO', '2025-08-06 11:46:57+00', 'Sitio web Avalcoop'),
('coopco.com.do', 'PAGINAS', 'ACTIVADO', '2025-07-10 14:47:16+00', 'Sitio web Coopco'),
('coopmicro.com.do', 'PAGINAS', 'ACTIVADO', '2025-07-10 14:47:20+00', 'Sitio web Coop Micro'),
('coopacsemj.com', 'PAGINAS', 'ACTIVADO', '2025-08-07 23:46:52+00', 'Sitio web Coopacsemj'),
('beautycoop.com.do', 'PAGINAS', 'ACTIVADO', '2025-07-10 14:47:13+00', 'Sitio web Beauty Coop')

ON CONFLICT (domain) DO NOTHING;
