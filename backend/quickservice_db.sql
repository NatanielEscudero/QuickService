-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-11-2025 a las 15:48:59
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `quickservice_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `status` enum('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'pending',
  `total_cost` decimal(10,2) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `appointments`
--

INSERT INTO `appointments` (`id`, `client_id`, `worker_id`, `service_type`, `description`, `scheduled_date`, `scheduled_time`, `status`, `total_cost`, `address`, `contact_phone`, `special_instructions`, `created_at`, `updated_at`) VALUES
(1, 18, 7, 'Plomería', 'Servicio de Plomería programado', '2025-11-03', '16:00:00', 'pending', NULL, NULL, '+54 9 223 624-9033', NULL, '2025-11-02 16:17:57', '2025-11-02 16:17:57'),
(2, 18, 17, 'Plomero', 'Necesito servicios de Plomero urgentemente', '2025-11-02', '10:00:00', 'in_progress', NULL, NULL, NULL, NULL, '2025-11-02 19:17:19', '2025-11-03 14:36:20'),
(3, 18, 17, 'Plomero', 'Necesito servicios de Plomero urgentemente', '2025-11-02', '10:00:00', 'in_progress', NULL, NULL, NULL, NULL, '2025-11-02 19:24:30', '2025-11-03 14:29:02'),
(4, 18, 17, 'Plomero', 'Necesito servicios de Plomero urgentemente', '2025-11-02', '10:00:00', 'in_progress', NULL, NULL, NULL, NULL, '2025-11-02 21:41:36', '2025-11-03 14:28:32'),
(5, 18, 17, 'Plomero', 'Necesito servicios de Plomero urgentemente', '2025-11-02', '10:00:00', 'in_progress', 1000.00, NULL, NULL, NULL, '2025-11-02 21:47:23', '2025-11-03 14:28:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `service_requests`
--

CREATE TABLE `service_requests` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `urgency` enum('low','medium','high','emergency') DEFAULT 'medium',
  `description` text DEFAULT NULL,
  `status` enum('pending','accepted','rejected','completed') DEFAULT 'pending',
  `budget_estimate` decimal(10,2) DEFAULT NULL,
  `preferred_date` date DEFAULT NULL,
  `preferred_time` time DEFAULT NULL,
  `contact_method` enum('call','message','both') DEFAULT 'both',
  `client_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `service_requests`
--

INSERT INTO `service_requests` (`id`, `client_id`, `worker_id`, `service_type`, `urgency`, `description`, `status`, `budget_estimate`, `preferred_date`, `preferred_time`, `contact_method`, `client_phone`, `created_at`) VALUES
(1, 18, 7, 'Plomería', 'emergency', 'Necesito servicios de Plomería urgentemente', 'pending', NULL, NULL, NULL, 'both', NULL, '2025-11-02 16:16:39'),
(2, 18, 7, 'plomería', 'high', 'Solicitud de servicios de plomería', 'pending', NULL, NULL, NULL, 'both', NULL, '2025-11-02 16:24:17'),
(4, 18, 7, 'plomería', 'high', 'Solicitud de servicios de plomería', 'pending', NULL, NULL, NULL, 'both', NULL, '2025-11-02 18:38:55'),
(5, 18, 17, 'Plomero', 'emergency', 'Necesito servicios de Plomero urgentemente', 'accepted', NULL, NULL, NULL, 'both', NULL, '2025-11-02 19:10:10'),
(6, 18, 17, 'Plomero', 'emergency', 'Necesito servicios de Plomero urgentemente', 'rejected', NULL, NULL, NULL, 'both', NULL, '2025-11-02 19:24:10'),
(7, 18, 17, 'Plomero', 'emergency', 'Necesito servicios de Plomero urgentemente', 'accepted', NULL, NULL, NULL, 'both', NULL, '2025-11-02 19:24:12'),
(8, 18, 17, 'Plomero', 'emergency', 'Necesito servicios de Plomero urgentemente', 'rejected', NULL, NULL, NULL, 'both', NULL, '2025-11-02 19:24:12'),
(9, 18, 17, 'Plomero', 'emergency', 'Necesito servicios de Plomero urgentemente', 'accepted', NULL, NULL, NULL, 'both', NULL, '2025-11-02 21:41:09'),
(10, 18, 17, 'Plomero', 'emergency', 'Necesito servicios de Plomero urgentemente', 'accepted', 1000.00, NULL, NULL, 'both', NULL, '2025-11-02 21:46:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('client','worker','admin'),
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `google_id` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `auth_provider` enum('local','google') DEFAULT 'local',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `name`, `phone`, `avatar_url`, `is_verified`, `created_at`, `google_id`, `email_verified`, `auth_provider`, `updated_at`) VALUES
(7, 'juanperez@gmail.com', '$2b$12$skUlKEg.OmEev9XFCA8pbup8LK3LfPDBeCJj3xOlkIg5kbO25hgye', 'worker', 'Juan perez', '+54 9 223 624-9033', NULL, 0, '2025-11-01 18:18:34', NULL, 0, 'local', '2025-11-01 19:11:17'),
(8, 'nacho@gmail.com', '$2b$12$/MLCf1Zr68Lj/lQmJqOdvuRC.bngtgKn/An6MaTDhzyoH8zicOoIq', 'client', 'Nachito Riveras', '+54 9 223 624-9032', NULL, 0, '2025-11-01 18:20:05', NULL, 0, 'local', '2025-11-01 19:11:17'),
(17, 'elhombrepaja2077@gmail.com', '$2b$12$ma5yl3Jo5zBAOyD2ZvUq4ugPBFRXFvuP5JcMHjx8WC0EnBnJajBxK', 'worker', 'Nataniel Escudero', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocJTMxWzindE77_EqtXDPrA9ogY9VPULCNDD4b3ByUMYnW_yYPk=s96-c', 0, '2025-11-01 20:24:46', '114170149263998349239', 1, 'google', '2025-11-03 14:25:41'),
(18, 'natanielescudero15@gmail.com', '$2b$12$t7WSMjhA1vEtmjFlh8DOxu3pLU5KWdRcJnXc2NQUCWJixY0lebegO', 'client', 'Nataniel Escudero', '+54 9 223 624-9033', 'https://lh3.googleusercontent.com/a/ACg8ocK_Ts_glsp_qTivODhLwnSTN7dPpYhpzb1oDfZVd4U_8eBzKMeW=s96-c', 0, '2025-11-02 15:52:45', '103744165271341540615', 1, 'google', '2025-11-03 14:23:53'),
(19, 'jaime@gmail.com', '$2b$12$3cz7TJiVyaa1T.gbkdoBwOj0JnUPVT0nQVeugtuZq2iHfFRwKT9Gu', 'worker', 'jaime julian', '+54 9 223 624 9012', NULL, 0, '2025-11-02 19:22:11', NULL, 0, 'local', '2025-11-02 19:22:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `workers`
--

CREATE TABLE `workers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `profession` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `immediate_service` tinyint(1) DEFAULT 0,
  `availability` enum('available','busy','offline') DEFAULT 'available',
  `rating` decimal(3,2) DEFAULT 0.00,
  `total_ratings` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `coverage_radius` int(11) DEFAULT 15
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `workers`
--

INSERT INTO `workers` (`id`, `user_id`, `profession`, `description`, `hourly_rate`, `immediate_service`, `availability`, `rating`, `total_ratings`, `updated_at`, `coverage_radius`) VALUES
(4, 7, 'Plomería', NULL, NULL, 0, 'available', 0.00, 0, '2025-11-02 17:32:17', 15),
(9, 17, 'Plomero', 'Soy Plomero profesional', NULL, 0, 'available', 0.00, 0, '2025-11-02 20:39:47', 30),
(10, 19, 'Plomería', NULL, NULL, 0, 'available', 0.00, 0, '2025-11-02 19:22:11', 15);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `worker_availability`
--

CREATE TABLE `worker_availability` (
  `id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `enabled` tinyint(1) DEFAULT 0,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `worker_availability`
--

INSERT INTO `worker_availability` (`id`, `worker_id`, `day_of_week`, `enabled`, `start_time`, `end_time`, `created_at`, `updated_at`) VALUES
(1, 17, 'monday', 0, '09:00:00', '18:00:00', '2025-11-02 20:26:13', '2025-11-02 20:39:47'),
(2, 17, 'tuesday', 1, '09:00:00', '18:00:00', '2025-11-02 20:26:13', '2025-11-02 20:39:47'),
(3, 17, 'wednesday', 0, '09:00:00', '18:00:00', '2025-11-02 20:26:13', '2025-11-02 20:39:47'),
(4, 17, 'thursday', 1, '09:00:00', '18:00:00', '2025-11-02 20:26:13', '2025-11-02 20:39:47'),
(5, 17, 'friday', 1, '09:00:00', '18:00:00', '2025-11-02 20:26:13', '2025-11-02 20:39:47'),
(6, 17, 'saturday', 0, '10:00:00', '14:00:00', '2025-11-02 20:26:13', '2025-11-02 20:39:47'),
(7, 17, 'sunday', 0, '10:00:00', '14:00:00', '2025-11-02 20:26:13', '2025-11-02 20:39:47');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `worker_id` (`worker_id`);

--
-- Indices de la tabla `service_requests`
--
ALTER TABLE `service_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `worker_id` (`worker_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`);

--
-- Indices de la tabla `workers`
--
ALTER TABLE `workers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `worker_availability`
--
ALTER TABLE `worker_availability`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_worker_day` (`worker_id`,`day_of_week`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `workers`
--
ALTER TABLE `workers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `worker_availability`
--
ALTER TABLE `worker_availability`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`worker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `service_requests`
--
ALTER TABLE `service_requests`
  ADD CONSTRAINT `service_requests_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_requests_ibfk_2` FOREIGN KEY (`worker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `workers`
--
ALTER TABLE `workers`
  ADD CONSTRAINT `workers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `worker_availability`
--
ALTER TABLE `worker_availability`
  ADD CONSTRAINT `worker_availability_ibfk_1` FOREIGN KEY (`worker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
