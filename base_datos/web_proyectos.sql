/* 
CREATE DATABASE web_proyectus;
*/

  /* 
CREATE TABLE IF NOT EXISTS credenciales (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
*/

/* 
SELECT * FROM credenciales; 
*/

/* 
DROP TABLE IF EXISTS credenciales;
*/

/* 
TRUNCATE TABLE credenciales RESTART IDENTITY;
*/

/* 
SELECT id, usuario, password_hash FROM credenciales ORDER BY id;
*/

/* 
DROP DATABASE mavac_consulta_clientes;
*/
/* 
UPDATE credenciales
SET rol = CASE
    WHEN usuario = 'mavac_gabriel' THEN 'admin'
    WHEN usuario = 'mavac_enrique' THEN 'admin'
    WHEN usuario = 'mavac_gerencia' THEN 'admin'
    WHEN usuario = 'mavac_gabriela' THEN 'usuario'
    WHEN usuario = 'mavac_fernando' THEN 'usuario'
    ELSE rol
END;
*/



