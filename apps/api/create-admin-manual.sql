-- SQL Script to manually create super admin in PostgreSQL
-- Run this in Railway's PostgreSQL Data tab → Query console

-- Password: umairqasim2
-- Bcrypt Hash: $2b$10$vjXu4wLKSrKIj7wmtiqktuT8I1vQP203W0yiEQIchq9auAW24PQla

-- Insert or update the super admin user
INSERT INTO "User" (
  id,
  email,
  "passwordHash",
  "firstName",
  "lastName",
  "systemRole",
  status,
  "emailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'umairsame28@gmail.com',
  '$2b$10$vjXu4wLKSrKIj7wmtiqktuT8I1vQP203W0yiEQIchq9auAW24PQla',
  'Umair',
  'Qasim',
  'SUPER_ADMIN',
  'ACTIVE',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  "systemRole" = 'SUPER_ADMIN',
  status = 'ACTIVE',
  "updatedAt" = NOW();

-- Verify the user was created/updated
SELECT 
  id,
  email,
  "firstName",
  "lastName",
  "systemRole",
  status,
  "createdAt"
FROM "User"
WHERE email = 'umairsame28@gmail.com';
