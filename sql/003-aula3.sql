-- Antes de aplicar, preencha os e-mails nulos com nome sem espaços/acentos + @senac.com.
ALTER TABLE alunos MODIFY COLUMN email VARCHAR(150) NOT NULL;

CREATE TABLE IF NOT EXISTS disciplinas (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(100) NOT NULL, carga_horaria INT NOT NULL);
