-- Model: sample
-- Database: MySQL 8
-- Exported At: 2026-03-14T07:55:12.795Z
-- Include Foreign Keys: NO

CREATE TABLE `student` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `student_no` varchar(20) NOT NULL COMMENT 'Student number',
  `name` varchar(50) NOT NULL COMMENT 'Student name',
  `age` int COMMENT 'Age',
  `class_name` varchar(50) COMMENT 'Class name',
  `teacher_id` bigint NOT NULL COMMENT 'Homeroom teacher',
  `Field1` varchar(50) COMMENT 'Template field',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student';

-- --------------------------------------------------

CREATE TABLE `teacher` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `job_no` varchar(20) NOT NULL COMMENT 'Teacher job number',
  `name` varchar(50) NOT NULL COMMENT 'Teacher name',
  `phone` varchar(20) COMMENT 'Phone number',
  `Field1` varchar(50) COMMENT 'Template field',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Teacher';

-- --------------------------------------------------

CREATE TABLE `course` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `course_code` varchar(20) NOT NULL COMMENT 'Course code',
  `course_name` varchar(100) NOT NULL COMMENT 'Course name',
  `credit` decimal(4,1) COMMENT 'Credit',
  `Field1` varchar(50) COMMENT 'Template field',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Course';

-- --------------------------------------------------

CREATE TABLE `student_course_selection` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `student_id` bigint NOT NULL COMMENT 'FK -> student.id',
  `teacher_id` bigint NOT NULL COMMENT 'FK -> teacher.id',
  `course_id` bigint NOT NULL COMMENT 'FK -> course.id',
  `selected_at` datetime COMMENT 'Selection time',
  `Field1` varchar(50) COMMENT 'Template field',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student selects a course taught by a teacher';
