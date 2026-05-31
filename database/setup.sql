-- ============================================================
--  FORM LEMBUR - Database Setup
--  Database: pilrgroup-2
--  Jalankan script ini di phpMyAdmin (Laragon) atau HeidiSQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS `pilargroup`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `pilargroup`;

-- ------------------------------------------------------------
-- 1. master_job_levels
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `master_job_levels` (
  `id`         VARCHAR(36)  NOT NULL,
  `name`       VARCHAR(100) NOT NULL,
  `level`      INT          NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. master_departments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `master_departments` (
  `id`        VARCHAR(36)  NOT NULL,
  `name`      VARCHAR(100) NOT NULL,
  `class`     VARCHAR(100) DEFAULT NULL,
  `code`      VARCHAR(50)  DEFAULT NULL,
  `is_active` TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. central_users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `central_users` (
  `id`           VARCHAR(36)  NOT NULL,
  `internal_id`  VARCHAR(50)  DEFAULT NULL,
  `name`         VARCHAR(150) NOT NULL,
  `email`        VARCHAR(150) DEFAULT NULL,
  `username`     VARCHAR(100) NOT NULL,
  `password`     VARCHAR(255) NOT NULL,
  `phone`        VARCHAR(30)  DEFAULT NULL,
  `job_position` VARCHAR(150) DEFAULT NULL,
  `job_level_id` VARCHAR(36)  DEFAULT NULL,
  `is_active`    TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`),
  KEY `fk_user_joblevel` (`job_level_id`),
  CONSTRAINT `fk_user_joblevel`
    FOREIGN KEY (`job_level_id`) REFERENCES `master_job_levels` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. central_user_departments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `central_user_departments` (
  `id`            VARCHAR(36) NOT NULL,
  `user_id`       VARCHAR(36) NOT NULL,
  `department_id` VARCHAR(36) NOT NULL,
  `is_primary`    TINYINT(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_dept` (`user_id`, `department_id`),
  KEY `fk_cud_user` (`user_id`),
  KEY `fk_cud_dept` (`department_id`),
  CONSTRAINT `fk_cud_user`
    FOREIGN KEY (`user_id`) REFERENCES `central_users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_cud_dept`
    FOREIGN KEY (`department_id`) REFERENCES `master_departments` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. lembur_forms
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lembur_forms` (
  `id`                VARCHAR(36)  NOT NULL,
  `form_number`       VARCHAR(50)  DEFAULT NULL,
  `form_sequence`     INT          DEFAULT NULL,
  `department`        VARCHAR(150) DEFAULT NULL,
  `class`             VARCHAR(100) DEFAULT NULL,
  `overtime_day`      VARCHAR(50)  DEFAULT NULL,
  `form_type`         VARCHAR(50)  DEFAULT NULL,
  `form_created_date` VARCHAR(30)  DEFAULT NULL,
  `submission_date`   VARCHAR(30)  DEFAULT NULL,
  `requested_by`      VARCHAR(150) DEFAULT NULL,
  `email`             VARCHAR(150) DEFAULT NULL,
  `division_code`     VARCHAR(50)  DEFAULT NULL,
  `status`            VARCHAR(30)  NOT NULL DEFAULT 'pending',
  `approval_notes`    TEXT         DEFAULT NULL,
  `approved_by`       VARCHAR(150) DEFAULT NULL,
  `approved_at`       VARCHAR(30)  DEFAULT NULL,
  `rejected_by`       VARCHAR(150) DEFAULT NULL,
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. lembur_entries
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lembur_entries` (
  `id`            VARCHAR(36)  NOT NULL,
  `form_id`       VARCHAR(36)  NOT NULL,
  `sequence`      INT          NOT NULL DEFAULT 1,
  `name`          VARCHAR(150) DEFAULT NULL,
  `employee_id`   VARCHAR(50)  DEFAULT NULL,
  `overtime_date` VARCHAR(30)  DEFAULT NULL,
  `start_time`    VARCHAR(10)  DEFAULT NULL,
  `end_time`      VARCHAR(10)  DEFAULT NULL,
  `task`          TEXT         DEFAULT NULL,
  `result`        TEXT         DEFAULT NULL,
  `compensation`  VARCHAR(50)  DEFAULT NULL,
  `approval`      TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_entry_form` (`form_id`),
  CONSTRAINT `fk_entry_form`
    FOREIGN KEY (`form_id`) REFERENCES `lembur_forms` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  DATA AWAL (SEED)
-- ============================================================

-- Job Levels
INSERT IGNORE INTO `master_job_levels` (`id`, `name`, `level`) VALUES
  ('jl-01', 'Staff',           1),
  ('jl-02', 'Senior Staff',    2),
  ('jl-03', 'Supervisor',      3),
  ('jl-04', 'Ass. Manager',    4),
  ('jl-05', 'Manager',         5),
  ('jl-06', 'Senior Manager',  6),
  ('jl-07', 'Director',        7),
  ('jl-08', 'Commissioner',    8);

-- Departments
INSERT IGNORE INTO `master_departments` (`id`, `name`, `class`, `code`, `is_active`) VALUES
  ('dept-01', 'IT',               'IT',               'IT',    1),
  ('dept-02', 'Human Resource',   'HR',               'HR',    1),
  ('dept-03', 'Finance',          'Finance',          'FIN',   1),
  ('dept-04', 'Marketing',        'Marketing',        'MKT',   1),
  ('dept-05', 'Operations',       'Operations',       'OPS',   1),
  ('dept-06', 'Board Of Director','Board Of Director','BOD',   1);

-- Admin user (password: Admin@123)
-- Hash dibuat dengan bcrypt rounds=10
INSERT IGNORE INTO `central_users`
  (`id`, `internal_id`, `name`, `email`, `username`, `password`, `job_position`, `job_level_id`, `is_active`)
VALUES
  (
    'usr-admin-01',
    'ADM001',
    'Administrator',
    'admin@pilargroup.com',
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lbu2',
    'System Administrator',
    'jl-01',
    1
  );

-- Assign admin ke dept IT sebagai primary
INSERT IGNORE INTO `central_user_departments` (`id`, `user_id`, `department_id`, `is_primary`) VALUES
  ('cud-admin-01', 'usr-admin-01', 'dept-01', 1);

-- ============================================================
--  SELESAI
--  Login: username=admin  password=Admin@123
-- ============================================================
