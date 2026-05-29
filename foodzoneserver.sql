-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 29, 2026 at 10:54 AM
-- Server version: 8.0.44
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `foodzoneserver`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auditable_id` bigint UNSIGNED DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blocks`
--

CREATE TABLE `blocks` (
  `id` bigint UNSIGNED NOT NULL,
  `blocker_id` bigint UNSIGNED NOT NULL,
  `blocked_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-324d1e170a4eafd9477d0b0955e94d93', 'i:1;', 1779852768),
('laravel-cache-324d1e170a4eafd9477d0b0955e94d93:timer', 'i:1779852768;', 1779852768),
('laravel-cache-6de5838134878a6ac4af10e77312fed6', 'i:8;', 1779852768),
('laravel-cache-6de5838134878a6ac4af10e77312fed6:timer', 'i:1779852768;', 1779852768),
('laravel-cache-cd0d0eff5253d47ad913f93df93ad326', 'i:2;', 1779852768),
('laravel-cache-cd0d0eff5253d47ad913f93df93ad326:timer', 'i:1779852767;', 1779852768),
('laravel-cache-health:ping', 's:1:\"1\";', 1779767932);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` bigint UNSIGNED NOT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `last_message_at`, `created_at`, `updated_at`) VALUES
(1, '2026-05-25 03:31:45', '2026-05-25 03:31:44', '2026-05-25 03:31:45');

-- --------------------------------------------------------

--
-- Table structure for table `conversation_user`
--

CREATE TABLE `conversation_user` (
  `id` bigint UNSIGNED NOT NULL,
  `conversation_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `last_read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `is_muted` tinyint(1) NOT NULL DEFAULT '0',
  `muted_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversation_user`
--

INSERT INTO `conversation_user` (`id`, `conversation_id`, `user_id`, `last_read_at`, `created_at`, `updated_at`, `is_pinned`, `is_muted`, `muted_until`) VALUES
(1, 1, 10, '2026-05-25 03:31:45', '2026-05-25 03:31:44', '2026-05-25 03:31:45', 0, 0, NULL),
(2, 1, 1, NULL, '2026-05-25 03:31:44', '2026-05-25 03:31:44', 0, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `vendor_id`, `created_at`, `updated_at`) VALUES
(1, 10, 1, '2026-05-21 02:19:00', '2026-05-21 02:19:00');

-- --------------------------------------------------------

--
-- Table structure for table `flash_deals`
--

CREATE TABLE `flash_deals` (
  `id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `discount_percent` tinyint UNSIGNED NOT NULL,
  `starts_at` timestamp NOT NULL,
  `ends_at` timestamp NOT NULL,
  `quantity_limit` int UNSIGNED DEFAULT NULL,
  `claimed_count` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `follows`
--

CREATE TABLE `follows` (
  `id` bigint UNSIGNED NOT NULL,
  `follower_id` bigint UNSIGNED NOT NULL,
  `following_id` bigint UNSIGNED NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'accepted',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `follows`
--

INSERT INTO `follows` (`id`, `follower_id`, `following_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 10, 2, 'accepted', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(2, 10, 3, 'accepted', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(3, 10, 4, 'accepted', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(4, 1, 10, 'accepted', '2026-05-20 22:04:52', '2026-05-20 22:04:52');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unit',
  `stock` decimal(12,3) NOT NULL DEFAULT '0.000',
  `threshold` decimal(12,3) NOT NULL DEFAULT '0.000',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_addons`
--

CREATE TABLE `item_addons` (
  `id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_images`
--

CREATE TABLE `item_images` (
  `id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_variants`
--

CREATE TABLE `item_variants` (
  `id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_modifier` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(1, 'default', '{\"uuid\":\"4831bc57-4150-4fc5-a952-362323cea8e7\",\"displayName\":\"App\\\\Events\\\\MessageSent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"deleteWhenMissingModels\":false,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":18:{s:5:\\\"event\\\";O:22:\\\"App\\\\Events\\\\MessageSent\\\":1:{s:7:\\\"message\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Message\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:6:\\\"sender\\\";i:1;s:14:\\\"sender.profile\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:13:\\\"debounceOwner\\\";s:0:\\\"\\\";s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1779699707,\"delay\":null}', 0, NULL, 1779699707, 1779699707),
(2, 'default', '{\"uuid\":\"fbad4ff4-6626-45d5-86c1-70dc56010552\",\"displayName\":\"App\\\\Events\\\\NotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"deleteWhenMissingModels\":false,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":18:{s:5:\\\"event\\\";O:30:\\\"App\\\\Events\\\\NotificationCreated\\\":1:{s:12:\\\"notification\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:23:\\\"App\\\\Models\\\\Notification\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:13:\\\"debounceOwner\\\";s:0:\\\"\\\";s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1779699707,\"delay\":null}', 0, NULL, 1779699707, 1779699707),
(3, 'default', '{\"uuid\":\"ada2f63e-a0b9-4262-981a-f1dc679ea611\",\"displayName\":\"App\\\\Notifications\\\\VerifyEmailNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"deleteWhenMissingModels\":false,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;i:15;}s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:41:\\\"App\\\\Notifications\\\\VerifyEmailNotification\\\":2:{s:5:\\\"token\\\";s:64:\\\"NGWRuzdxOhMXolrtWcrH0xa7tpU3ezU7If4XAa5zVRpdso9W30b0OnDtg07tLXD4\\\";s:2:\\\"id\\\";s:36:\\\"7fee417c-b626-40d7-a577-631eb70cd08b\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:4:\\\"mail\\\";}}\",\"batchId\":null},\"createdAt\":1779852708,\"delay\":null}', 0, NULL, 1779852708, 1779852708);

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_categories`
--

CREATE TABLE `menu_categories` (
  `id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu_categories`
--

INSERT INTO `menu_categories` (`id`, `vendor_id`, `name`, `description`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Starters', NULL, 0, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(2, 1, 'Mains', NULL, 1, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(3, 1, 'Desserts', NULL, 2, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(4, 1, 'Beverages', NULL, 3, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(5, 2, 'Starters', NULL, 0, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(6, 2, 'Mains', NULL, 1, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(7, 2, 'Desserts', NULL, 2, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(8, 2, 'Beverages', NULL, 3, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(9, 3, 'Starters', NULL, 0, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(10, 3, 'Mains', NULL, 1, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(11, 3, 'Desserts', NULL, 2, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(12, 3, 'Beverages', NULL, 3, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(13, 4, 'Starters', NULL, 0, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(14, 4, 'Mains', NULL, 1, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(15, 4, 'Desserts', NULL, 2, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(16, 4, 'Beverages', NULL, 3, 'approved', '2026-05-20 06:19:18', '2026-05-20 06:19:18');

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `dietary_tags` json DEFAULT NULL,
  `allergens` json DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `prep_time_minutes` int UNSIGNED DEFAULT NULL,
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `rating_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `orders_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`id`, `vendor_id`, `category_id`, `name`, `description`, `price`, `dietary_tags`, `allergens`, `is_available`, `prep_time_minutes`, `rating_avg`, `rating_count`, `orders_count`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Veg Burger', 'Repudiandae qui similique eligendi ducimus neque.', 273.02, NULL, NULL, 1, 23, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(2, 1, 1, 'Margherita Pizza', 'Omnis repellendus voluptatem et.', 126.26, NULL, NULL, 1, 18, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(3, 1, 1, 'Veg Burger', 'Nostrum ex aspernatur perferendis tempora nisi ut nisi.', 280.20, NULL, NULL, 1, 28, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(4, 1, 2, 'Cold Coffee', 'Nam voluptas ut iure aliquid dolorum voluptas ex.', 130.96, NULL, NULL, 1, 19, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(5, 1, 2, 'Margherita Pizza', 'Est harum vel autem voluptas culpa.', 258.35, NULL, NULL, 1, 17, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(6, 1, 2, 'Veg Burger', 'Sunt voluptates in eum architecto.', 145.62, NULL, NULL, 1, 21, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(7, 1, 3, 'Veg Burger', 'Aliquid ut ab quibusdam modi impedit necessitatibus id.', 478.97, NULL, NULL, 1, 14, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(8, 1, 3, 'Paneer Tikka', 'Ad voluptas voluptatem ab aut quidem ut ut.', 487.49, NULL, NULL, 1, 30, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(9, 1, 3, 'Chocolate Brownie', 'Quis nostrum veniam voluptas.', 297.66, NULL, NULL, 1, 11, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(10, 1, 3, 'Cold Coffee', 'Omnis eum minus labore repudiandae sit laudantium.', 163.70, NULL, NULL, 1, 39, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(11, 1, 4, 'Chocolate Brownie', 'Excepturi unde ab omnis impedit nobis voluptatum.', 298.53, NULL, NULL, 1, 29, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(12, 1, 4, 'Cold Coffee', 'Aut dicta saepe soluta fugiat quia qui.', 222.53, NULL, NULL, 1, 27, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(13, 1, 4, 'Veg Burger', 'Voluptas cumque delectus et in eveniet consequatur ut dolorum.', 366.54, NULL, NULL, 1, 22, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(14, 2, 5, 'Chocolate Brownie', 'Saepe eos aspernatur totam laborum quia quae et in.', 120.98, NULL, NULL, 1, 35, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(15, 2, 5, 'Chocolate Brownie', 'Numquam vel ex quam et non.', 217.83, NULL, NULL, 1, 19, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(16, 2, 5, 'Veg Burger', 'Reprehenderit aspernatur ratione modi ab.', 333.75, NULL, NULL, 1, 28, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(17, 2, 5, 'Veg Burger', 'Veniam nesciunt ut voluptas labore nostrum.', 380.71, NULL, NULL, 1, 26, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(18, 2, 6, 'Margherita Pizza', 'Iste quis est perspiciatis eveniet est recusandae.', 368.47, NULL, NULL, 1, 16, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(19, 2, 6, 'Chocolate Brownie', 'Pariatur perferendis est qui molestiae numquam quo exercitationem.', 115.20, NULL, NULL, 1, 24, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(20, 2, 6, 'Paneer Tikka', 'Tempore cupiditate reprehenderit consectetur quos.', 407.17, NULL, NULL, 1, 33, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(21, 2, 6, 'Cold Coffee', 'A atque id soluta qui.', 419.16, NULL, NULL, 1, 29, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(22, 2, 7, 'Chocolate Brownie', 'Exercitationem corrupti et dolores et architecto recusandae.', 333.92, NULL, NULL, 1, 14, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(23, 2, 7, 'Veg Burger', 'Doloribus quibusdam quia illo ut qui.', 216.51, NULL, NULL, 1, 36, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(24, 2, 7, 'Chocolate Brownie', 'Reprehenderit et aspernatur sint explicabo magni labore molestiae.', 74.76, NULL, NULL, 1, 16, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(25, 2, 7, 'Veg Burger', 'Accusantium sed aut eaque est incidunt.', 401.88, NULL, NULL, 1, 35, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(26, 2, 8, 'Paneer Tikka', 'Sed architecto unde aut architecto dolores neque ipsum.', 447.75, NULL, NULL, 1, 18, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(27, 2, 8, 'Chocolate Brownie', 'Similique tenetur illum totam aut fugit amet non fugiat.', 138.85, NULL, NULL, 1, 17, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(28, 2, 8, 'Paneer Tikka', 'Amet ut aut praesentium assumenda minima reiciendis nam.', 469.01, NULL, NULL, 1, 24, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(29, 2, 8, 'Cold Coffee', 'Animi dolore cumque enim incidunt dignissimos.', 264.08, NULL, NULL, 1, 18, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(30, 2, 8, 'Margherita Pizza', 'Eum eligendi voluptas porro sequi et ipsum saepe.', 428.54, NULL, NULL, 1, 40, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(31, 3, 9, 'Paneer Tikka', 'Nisi sit vel corrupti odit quia consequatur enim dolor.', 458.46, NULL, NULL, 1, 39, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(32, 3, 9, 'Cold Coffee', 'Quis eius ut voluptas officiis quia non ut tenetur.', 473.17, NULL, NULL, 1, 17, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(33, 3, 9, 'Margherita Pizza', 'Eos quae repellat illum ducimus sunt adipisci labore.', 341.09, NULL, NULL, 1, 13, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(34, 3, 9, 'Paneer Tikka', 'Dolorum ut quibusdam provident consectetur rerum.', 447.59, NULL, NULL, 1, 33, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(35, 3, 9, 'Cold Coffee', 'Cupiditate perspiciatis animi ut laboriosam voluptatem nihil sunt quidem.', 363.37, NULL, NULL, 1, 32, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(36, 3, 10, 'Chocolate Brownie', 'Qui ut blanditiis iste consequuntur vitae dolorem cumque.', 135.93, NULL, NULL, 1, 34, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(37, 3, 10, 'Veg Burger', 'Fuga molestiae animi libero autem voluptatibus quibusdam rem.', 208.14, NULL, NULL, 1, 40, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(38, 3, 10, 'Paneer Tikka', 'Eaque voluptatum veniam et ut ad non.', 273.62, NULL, NULL, 1, 14, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(39, 3, 10, 'Margherita Pizza', 'Neque qui voluptatem animi eligendi deleniti qui sint porro.', 166.52, NULL, NULL, 1, 20, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(40, 3, 11, 'Veg Burger', 'Consectetur optio facere quis ad hic blanditiis.', 189.57, NULL, NULL, 1, 16, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(41, 3, 11, 'Cold Coffee', 'Eos dolores atque facere dolorum illum ad voluptas porro.', 138.43, NULL, NULL, 1, 16, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(42, 3, 11, 'Veg Burger', 'Sed possimus porro dolorum quibusdam totam dolor necessitatibus non.', 196.60, NULL, NULL, 1, 20, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(43, 3, 12, 'Cold Coffee', 'Et harum saepe voluptatibus atque.', 273.78, NULL, NULL, 1, 23, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(44, 3, 12, 'Chocolate Brownie', 'Fuga animi explicabo quo consequatur temporibus repudiandae.', 307.41, NULL, NULL, 1, 36, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(45, 3, 12, 'Paneer Tikka', 'Enim magni ullam odit laborum hic consequatur iure.', 274.19, NULL, NULL, 1, 33, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(46, 4, 13, 'Veg Burger', 'Id dicta asperiores reiciendis optio dicta.', 82.48, NULL, NULL, 1, 25, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(47, 4, 13, 'Chocolate Brownie', 'Omnis pariatur molestiae nulla voluptas maiores autem voluptas sed.', 56.06, NULL, NULL, 1, 21, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(48, 4, 13, 'Margherita Pizza', 'Tempore debitis natus veritatis molestiae possimus libero.', 97.86, NULL, NULL, 1, 24, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(49, 4, 13, 'Chocolate Brownie', 'Doloremque eos voluptatem sint expedita vel sunt.', 457.44, NULL, NULL, 1, 26, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(50, 4, 14, 'Margherita Pizza', 'Et sit error ducimus inventore sed.', 85.56, NULL, NULL, 1, 31, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(51, 4, 14, 'Chocolate Brownie', 'Ipsa non reiciendis odit laudantium illo aut consequatur.', 395.59, NULL, NULL, 1, 26, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(52, 4, 14, 'Margherita Pizza', 'Ut velit mollitia veniam non sint.', 405.95, NULL, NULL, 1, 10, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(53, 4, 14, 'Cold Coffee', 'Et dolores quo et.', 152.22, NULL, NULL, 1, 13, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(54, 4, 14, 'Cold Coffee', 'Qui minus maxime et asperiores voluptatum voluptatem aut.', 334.16, NULL, NULL, 1, 10, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(55, 4, 15, 'Veg Burger', 'Sed temporibus voluptatem ut libero fuga nisi modi perspiciatis.', 374.60, NULL, NULL, 1, 10, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(56, 4, 15, 'Cold Coffee', 'Nesciunt rerum enim libero quam.', 222.35, NULL, NULL, 1, 16, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(57, 4, 15, 'Paneer Tikka', 'Optio aspernatur magnam voluptate eius voluptatem soluta.', 464.85, NULL, NULL, 1, 37, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(58, 4, 15, 'Paneer Tikka', 'Est id quas distinctio nemo vel adipisci ut.', 347.52, NULL, NULL, 1, 31, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(59, 4, 15, 'Chocolate Brownie', 'Hic ex excepturi quasi neque et libero.', 386.69, NULL, NULL, 1, 30, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(60, 4, 16, 'Margherita Pizza', 'Impedit illum dignissimos voluptatem nesciunt.', 157.96, NULL, NULL, 1, 39, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(61, 4, 16, 'Chocolate Brownie', 'Labore nisi ea libero quos praesentium.', 194.62, NULL, NULL, 1, 12, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(62, 4, 16, 'Chocolate Brownie', 'Et minus cumque nam ipsam maiores itaque.', 161.41, NULL, NULL, 1, 13, 0.00, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` bigint UNSIGNED NOT NULL,
  `conversation_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `replied_to_message_id` bigint UNSIGNED DEFAULT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `media_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `user_id`, `body`, `created_at`, `updated_at`, `replied_to_message_id`, `type`, `media_url`, `deleted_at`) VALUES
(1, 1, 10, 'Hi admin, testing chat!', '2026-05-25 03:31:45', '2026-05-25 03:31:45', NULL, 'text', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `message_reactions`
--

CREATE TABLE `message_reactions` (
  `id` bigint UNSIGNED NOT NULL,
  `message_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `emoji` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_05_20_061705_create_personal_access_tokens_table', 1),
(5, '2026_05_20_070001_create_user_profiles_table', 1),
(6, '2026_05_20_070002_create_user_addresses_table', 1),
(7, '2026_05_20_070003_create_vendors_table', 1),
(8, '2026_05_20_070004_create_operating_hours_table', 1),
(9, '2026_05_20_070005_create_menu_categories_table', 1),
(10, '2026_05_20_070006_create_menu_items_table', 1),
(11, '2026_05_20_070007_create_item_variants_table', 1),
(12, '2026_05_20_070008_create_item_addons_table', 1),
(13, '2026_05_20_070009_create_item_images_table', 1),
(14, '2026_05_20_070010_create_orders_table', 1),
(15, '2026_05_20_070011_create_order_items_table', 1),
(16, '2026_05_20_070012_create_order_status_history_table', 1),
(17, '2026_05_20_070013_create_order_ratings_table', 1),
(18, '2026_05_20_070014_create_posts_table', 1),
(19, '2026_05_20_070015_create_post_media_table', 1),
(20, '2026_05_20_070016_create_post_likes_table', 1),
(21, '2026_05_20_070017_create_post_comments_table', 1),
(22, '2026_05_20_070018_create_follows_table', 1),
(23, '2026_05_20_070019_create_blocks_table', 1),
(24, '2026_05_20_070020_create_notifications_table', 1),
(25, '2026_05_20_070021_create_vouchers_table', 1),
(26, '2026_05_20_070022_create_voucher_redemptions_table', 1),
(27, '2026_05_20_070023_create_violations_table', 1),
(28, '2026_05_20_080001_create_favorites_table', 2),
(29, '2026_05_20_080002_create_conversations_table', 3),
(30, '2026_05_26_000001_create_payments_table', 4),
(31, '2026_05_26_000002_add_delivery_partner_to_orders', 5),
(32, '2026_05_26_000003_create_push_tokens_table', 6),
(33, '2026_05_26_000004_create_audit_logs_table', 7),
(34, '2026_05_27_000001_create_feed_engagement_tables', 8),
(35, '2026_05_27_000002_extend_profile_and_highlights', 9),
(36, '2026_05_27_000003_chat_v2_schema', 10),
(37, '2026_05_27_000004_vendor_discovery', 11),
(38, '2026_05_27_000005_vendor_dashboard_v3', 12);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data` json DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `data`, `read_at`, `created_at`, `updated_at`) VALUES
(1, 10, 'like', 'New like', 'admin liked your post.', '{\"actor\": {\"id\": 1, \"name\": \"FoodZone Admin\", \"avatar\": null, \"username\": \"admin\"}, \"post_id\": 16}', NULL, '2026-05-20 06:19:24', '2026-05-20 06:19:24'),
(2, 10, 'follow', 'New follower', 'admin started following you.', '{\"actor\": {\"id\": 1, \"name\": \"FoodZone Admin\", \"avatar\": null, \"username\": \"admin\"}}', NULL, '2026-05-20 22:04:52', '2026-05-20 22:04:52'),
(3, 1, 'message', 'New message', 'alice: Hi admin, testing chat!', '{\"actor\": {\"id\": 10, \"name\": \"Alice Diner\", \"avatar\": null, \"username\": \"alice\"}, \"conversation_id\": 1}', NULL, '2026-05-25 03:31:47', '2026-05-25 03:31:47');

-- --------------------------------------------------------

--
-- Table structure for table `operating_hours`
--

CREATE TABLE `operating_hours` (
  `id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `day_of_week` tinyint UNSIGNED NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `operating_hours`
--

INSERT INTO `operating_hours` (`id`, `vendor_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '08:30:00', '23:00:00', 0, '2026-05-21 22:25:06', '2026-05-21 22:25:06');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint UNSIGNED NOT NULL,
  `order_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `address_id` bigint UNSIGNED DEFAULT NULL,
  `status` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `delivery_charge` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `commission` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cod',
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `voucher_id` bigint UNSIGNED DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancellation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address` json DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `delivery_partner_id` bigint UNSIGNED DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `picked_up_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `vendor_id`, `address_id`, `status`, `subtotal`, `discount`, `delivery_charge`, `tax`, `total`, `commission`, `payment_method`, `payment_status`, `voucher_id`, `notes`, `cancellation_reason`, `delivery_address`, `accepted_at`, `delivered_at`, `cancelled_at`, `created_at`, `updated_at`, `delivery_partner_id`, `assigned_at`, `picked_up_at`) VALUES
(1, 'FZ-LIVE-5469', 10, 1, NULL, 'delivered', 100.00, 0.00, 0.00, 0.00, 100.00, 0.00, 'cod', 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-20 06:44:42', '2026-05-20 06:44:42', NULL, NULL, NULL),
(2, 'FZ-LIVE7-2457', 10, 1, NULL, 'pending', 150.00, 0.00, 0.00, 0.00, 150.00, 0.00, 'cod', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-20 22:20:19', '2026-05-20 22:20:19', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED DEFAULT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int UNSIGNED NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  `customizations` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_ratings`
--

CREATE TABLE `order_ratings` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `rating` tinyint UNSIGNED NOT NULL,
  `review` text COLLATE utf8mb4_unicode_ci,
  `images` json DEFAULT NULL,
  `vendor_reply` text COLLATE utf8mb4_unicode_ci,
  `vendor_replied_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_ratings`
--

INSERT INTO `order_ratings` (`id`, `order_id`, `user_id`, `vendor_id`, `rating`, `review`, `images`, `vendor_reply`, `vendor_replied_at`, `created_at`, `updated_at`) VALUES
(1, 1, 10, 1, 5, 'Live test: outstanding food and lightning-fast delivery!', NULL, NULL, NULL, '2026-05-20 06:44:42', '2026-05-20 06:44:42');

-- --------------------------------------------------------

--
-- Table structure for table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `status` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` bigint UNSIGNED DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `gateway` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'created',
  `intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 10, 'auth', '1b093c81f7757e28400b0ccea7d8988a2e58553a7b9725c7706d3175e12d04db', '[\"*\"]', '2026-05-20 06:19:25', NULL, '2026-05-20 06:19:23', '2026-05-20 06:19:25'),
(2, 'App\\Models\\User', 1, 'auth', '442133c58582c7aacde2d344c7e0b9a9f5ab2ece65190bab4fe8a4a333a04248', '[\"*\"]', '2026-05-20 06:19:24', NULL, '2026-05-20 06:19:24', '2026-05-20 06:19:24'),
(3, 'App\\Models\\User', 10, 'auth', '57b4c64c1d67f8726ab88754b6744603becb3bfcf7839d821f4c9c3e38c86507', '[\"*\"]', '2026-05-20 22:04:50', NULL, '2026-05-20 22:04:50', '2026-05-20 22:04:50'),
(4, 'App\\Models\\User', 1, 'auth', '3d4ab77eee3a2d0c73f8f5925382532367ef6a568ed6c7fcb9418b4e0179706d', '[\"*\"]', '2026-05-20 22:04:53', NULL, '2026-05-20 22:04:51', '2026-05-20 22:04:53'),
(5, 'App\\Models\\User', 11, 'smoke', 'a45db89ef3a20069744f28823d353dd3689cd1e15de1ff5c2fdf955a7deab6a6', '[\"*\"]', '2026-05-20 22:20:20', NULL, '2026-05-20 22:20:19', '2026-05-20 22:20:20'),
(6, 'App\\Models\\User', 1, 'auth', 'fcd590921e22a920f76d161f03d4c41bb68b6b88b93a9b3cfcedade198dbede6', '[\"*\"]', '2026-05-20 22:31:30', NULL, '2026-05-20 22:31:30', '2026-05-20 22:31:30'),
(7, 'App\\Models\\User', 10, 'auth', '653033390f3fcc2ad6826bb645f68cc9e237aa96d380d225c487001da9183b4d', '[\"*\"]', '2026-05-20 22:31:31', NULL, '2026-05-20 22:31:31', '2026-05-20 22:31:31'),
(8, 'App\\Models\\User', 10, 'auth', '185998612315dc3724d9db9bb491d31648e70f15a0a909d408c226140613a991', '[\"*\"]', '2026-05-21 02:19:01', NULL, '2026-05-21 02:18:59', '2026-05-21 02:19:01'),
(9, 'App\\Models\\User', 1, 'auth', '442a30a2f08bdd26783a49a9ba3fe2ae9f698151ed5281ee7952cc3580f4c3f0', '[\"*\"]', '2026-05-21 22:07:08', NULL, '2026-05-21 22:07:07', '2026-05-21 22:07:08'),
(10, 'App\\Models\\User', 11, 'smoke', '9df9b1f44c49485999490f8059b2a6a467e6bb72f6e4e8efc63a917d6b35b6fb', '[\"*\"]', NULL, NULL, '2026-05-21 22:23:51', '2026-05-21 22:23:51'),
(11, 'App\\Models\\User', 11, 'smoke', '9826442dde78577501868bef470ace2a80e7669a39b408c70ae0eb392c1fbd83', '[\"*\"]', NULL, NULL, '2026-05-21 22:24:30', '2026-05-21 22:24:30'),
(12, 'App\\Models\\User', 11, 'smoke', '9bf1239bb63f7f171191dd6552af0fd66d9d87b18580ddf0a5e31a1d1f38dac2', '[\"*\"]', '2026-05-21 22:25:06', NULL, '2026-05-21 22:25:01', '2026-05-21 22:25:06'),
(13, 'App\\Models\\User', 10, 'smoke', 'e674c2a4f93da28f5fb4db9df95e96dc3b393a327d3bf69b5ac73975d532ad2e', '[\"*\"]', NULL, NULL, '2026-05-22 02:11:33', '2026-05-22 02:11:33'),
(14, 'App\\Models\\User', 10, 'smoke', 'e3bf5b8eda2623f88c5a9daaab1191dffc74568268be448ed83305b94e3161e4', '[\"*\"]', NULL, NULL, '2026-05-22 02:17:14', '2026-05-22 02:17:14'),
(15, 'App\\Models\\User', 10, 'smoke', '86e920e396990de07010bc186549924a282443f216c0b04d91821a48eb87c206', '[\"*\"]', '2026-05-22 02:23:49', NULL, '2026-05-22 02:23:41', '2026-05-22 02:23:49'),
(16, 'App\\Models\\User', 10, 'auth', '00bcb99abd207b5be055d9b9dd1fb846fd73082c72385597ea46800b8d6e8989', '[\"*\"]', NULL, NULL, '2026-05-25 03:31:22', '2026-05-25 03:31:22'),
(17, 'App\\Models\\User', 10, 'auth', '17564d86ffe2a96ebb595d1fc2523e6bd17d35077ca6c55c2e1446bd6d06183d', '[\"*\"]', '2026-05-25 03:31:45', NULL, '2026-05-25 03:31:42', '2026-05-25 03:31:45'),
(18, 'App\\Models\\User', 1, 'auth', '59d91accadafe8f0db473174b9783fb09d1b185a8825a34f5da3fdb5df9b3d1e', '[\"*\"]', '2026-05-25 03:31:47', NULL, '2026-05-25 03:31:43', '2026-05-25 03:31:47');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `privacy` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `tagged_vendor_id` bigint UNSIGNED DEFAULT NULL,
  `tagged_item_id` bigint UNSIGNED DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shared_post_id` bigint UNSIGNED DEFAULT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `likes_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `comments_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `shares_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `user_id`, `body`, `privacy`, `type`, `tagged_vendor_id`, `tagged_item_id`, `location`, `shared_post_id`, `is_pinned`, `likes_count`, `comments_count`, `shares_count`, `created_at`, `updated_at`) VALUES
(1, 4, 'Consectetur vel ut voluptatem ea consequatur consequuntur dolore accusantium tenetur sed unde voluptatem ipsa distinctio alias ipsa.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(2, 10, 'Commodi sint facilis eum ut et architecto ut dolore voluptatem.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(3, 2, 'Iste quis accusamus repellendus vel repellat ullam et quia animi.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(4, 3, 'Tempore enim et minus nisi natus velit voluptas harum possimus.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(5, 3, 'Ut rerum saepe ut rerum ipsa esse ut.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(6, 10, 'Cumque facere sed dignissimos ea ducimus voluptas facilis provident nobis excepturi quo qui alias.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(7, 7, 'Facilis at inventore odit autem natus ratione enim ab dolore iure cupiditate sed.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(8, 9, 'Adipisci odit ea neque occaecati ea sit expedita nihil minima dicta veniam corrupti fugit tempore sint facere.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(9, 4, 'Assumenda quia magnam autem sit deleniti eligendi rerum exercitationem ea ipsam est eos dolores odio.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(10, 2, 'Consequatur ratione in voluptas quia ipsum sit quia nihil dolorem nihil a rerum vel.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(11, 10, 'Voluptatem est nesciunt velit nemo sapiente eveniet quasi voluptatum ea omnis sint vel.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(12, 8, 'Unde et maxime ut voluptatem qui ullam sed natus itaque.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(13, 7, 'Tempora ullam quaerat temporibus fugiat nulla qui recusandae aut iste hic ut consequatur quam dolores ipsa omnis.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(14, 6, 'Quidem tempore quia facere voluptatem laboriosam sit architecto reiciendis et dolore omnis non vero hic quis.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(15, 8, 'Soluta aspernatur fuga sequi quo nihil aut aliquid sed aut labore sunt nostrum consequuntur facilis repellat est.', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 06:19:18', '2026-05-20 06:19:18'),
(16, 10, 'Notification test post', 'public', 'text', NULL, NULL, NULL, NULL, 0, 1, 0, 0, '2026-05-20 06:19:23', '2026-05-20 06:19:24'),
(17, 10, 'Alice public profile post', 'public', 'text', NULL, NULL, NULL, NULL, 0, 0, 0, 0, '2026-05-20 22:04:50', '2026-05-20 22:04:50');

-- --------------------------------------------------------

--
-- Table structure for table `post_comments`
--

CREATE TABLE `post_comments` (
  `id` bigint UNSIGNED NOT NULL,
  `post_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `likes_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `replies_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_likes`
--

CREATE TABLE `post_likes` (
  `id` bigint UNSIGNED NOT NULL,
  `post_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_likes`
--

INSERT INTO `post_likes` (`id`, `post_id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 16, 1, '2026-05-20 06:19:24', '2026-05-20 06:19:24');

-- --------------------------------------------------------

--
-- Table structure for table `post_media`
--

CREATE TABLE `post_media` (
  `id` bigint UNSIGNED NOT NULL,
  `post_id` bigint UNSIGNED NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image',
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_shares`
--

CREATE TABLE `post_shares` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `post_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `push_tokens`
--

CREATE TABLE `push_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `platform` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saved_posts`
--

CREATE TABLE `saved_posts` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `post_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `starred_messages`
--

CREATE TABLE `starred_messages` (
  `id` bigint UNSIGNED NOT NULL,
  `message_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stories`
--

CREATE TABLE `stories` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `media_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image',
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `story_highlights`
--

CREATE TABLE `story_highlights` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `story_ids` json NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `story_views`
--

CREATE TABLE `story_views` (
  `id` bigint UNSIGNED NOT NULL,
  `story_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `email_verification_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `dob` date DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suspended_until` timestamp NULL DEFAULT NULL,
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `referral_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referred_by` bigint UNSIGNED DEFAULT NULL,
  `last_active_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `email`, `phone`, `email_verified_at`, `email_verification_token`, `password`, `role`, `status`, `dob`, `gender`, `suspended_until`, `deactivated_at`, `referral_code`, `referred_by`, `last_active_at`, `remember_token`, `created_at`, `updated_at`, `is_verified`) VALUES
(1, 'FoodZone Admin', 'admin', 'admin@foodzone.app', '+919849243381', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'admin', 'active', NULL, 'male', NULL, NULL, 'SB9AULC1', NULL, '2026-05-25 03:31:43', 'VBUlcfifM0', '2026-05-20 06:19:17', '2026-05-25 03:31:43', 1),
(2, 'Dr. Nelson Kihn', 'flatley.rory3450', 'wallace.orn@example.net', '+919896709730', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'female', NULL, NULL, 'ZYY1IRGR', NULL, NULL, 'GdWkp1A5qe', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(3, 'Eleanora Ward', 'taurean462679', 'gzulauf@example.org', '+919877499976', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'other', NULL, NULL, 'T4FYHLZW', NULL, NULL, 'Ii6tas6TMW', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(4, 'Dr. Jimmie Stiedemann IV', 'rashawn213082', 'cosinski@example.net', NULL, '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'male', NULL, NULL, '6ALROXWA', NULL, NULL, 'zTeqQrfF6J', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(5, 'Korey Hansen', 'wanda423642', 'xgraham@example.org', '+919865649989', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'other', NULL, NULL, 'ZAWX0PLL', NULL, NULL, 'QA7fQxxaN5', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(6, 'Pietro Wyman', 'hodkiewicz.tanya8913', 'goodwin.virginie@example.net', '+919823752083', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'male', NULL, NULL, 'AOGYONP7', NULL, NULL, 'cNlKCcV3WD', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(7, 'Jackson Cormier', 'susanna397210', 'cristopher71@example.net', '+919818910247', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'female', NULL, NULL, 'JCSMNEVL', NULL, NULL, 'M5kbwNXw8K', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(8, 'Prof. Lisette Strosin Sr.', 'yolson7547', 'titus90@example.org', NULL, '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'female', NULL, NULL, '5CGYKMHJ', NULL, NULL, '6XUt8szjbu', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(9, 'Ashton Stiedemann', 'drake993561', 'abbey.white@example.net', '+919872966553', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'other', NULL, NULL, 'CZOAGCTY', NULL, NULL, 'cdgTDZkHf9', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(10, 'Alice Diner', 'alice', 'alice@example.com', '+919852795576', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'user', 'active', NULL, 'other', NULL, NULL, '17O0YJRP', NULL, '2026-05-25 03:31:42', 'PFDhtFCiEt', '2026-05-20 06:19:17', '2026-05-25 03:31:42', 0),
(11, 'Lottie Haley', 'viola.morissette1630', 'guy.connelly@example.net', '+919848079380', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'vendor', 'active', NULL, 'female', NULL, NULL, 'SMPRVDYG', NULL, NULL, 'gc2KJAUns1', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(12, 'Zachery Hermann', 'fboyer1775', 'angus37@example.com', NULL, '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'vendor', 'active', NULL, 'other', NULL, NULL, '9QW9NMKT', NULL, NULL, 'ZDHeZ8u81H', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(13, 'Alexandra Hermiston', 'baumbach.vivien8133', 'pnitzsche@example.org', '+919887294214', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'vendor', 'active', NULL, 'male', NULL, NULL, 'CAUZAR9Q', NULL, NULL, 'nYHhpGOXYc', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(14, 'Mrs. Celestine Breitenberg', 'stella.king8785', 'jmclaughlin@example.org', '+919872078592', '2026-05-20 06:19:17', NULL, '$2y$12$lhfndoNUuF8TakWxQYzkHeDDxDrUixbtfVfaDxDwP085IESK11KGO', 'vendor', 'active', NULL, 'female', NULL, NULL, 'O874GF6K', NULL, NULL, 'keCb1yMDEO', '2026-05-20 06:19:17', '2026-05-20 06:19:17', 0),
(15, 'Abhishek', 'ap_clasher', 'dev.abhishek.ap11@gmail.com', NULL, NULL, 'NGWRuzdxOhMXolrtWcrH0xa7tpU3ezU7If4XAa5zVRpdso9W30b0OnDtg07tLXD4', '$2y$12$IBvkxq1kg5NFUMeIxu9MN.rE9EXIunxngGNPKJ72CMDXB3dRJeEvy', 'user', 'active', NULL, NULL, NULL, NULL, '5EWSNQWJ', NULL, NULL, NULL, '2026-05-26 22:01:48', '2026-05-26 22:01:48', 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `label` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Home',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `landmark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_private` tinyint(1) NOT NULL DEFAULT '0',
  `food_preferences` json DEFAULT NULL,
  `dietary_restrictions` json DEFAULT NULL,
  `followers_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `following_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `posts_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `user_id`, `bio`, `avatar`, `cover`, `website`, `is_private`, `food_preferences`, `dietary_restrictions`, `followers_count`, `following_count`, `posts_count`, `created_at`, `updated_at`, `location`) VALUES
(1, 1, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 1, 0, '2026-05-20 06:19:17', '2026-05-20 22:04:52', NULL),
(2, 2, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(3, 3, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(4, 4, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(5, 5, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(6, 6, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(7, 7, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(8, 8, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(9, 9, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(10, 10, NULL, NULL, NULL, NULL, 0, NULL, NULL, 1, 3, 2, '2026-05-20 06:19:17', '2026-05-20 22:04:52', NULL),
(11, 11, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(12, 12, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(13, 13, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(14, 14, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(15, 15, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, 0, 0, '2026-05-26 22:01:48', '2026-05-26 22:01:48', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banner` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_license` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `radius_km` decimal(6,2) NOT NULL DEFAULT '5.00',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `is_open` tinyint(1) NOT NULL DEFAULT '1',
  `closed_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '5.00',
  `min_order_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `delivery_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `free_delivery_above` decimal(10,2) DEFAULT NULL,
  `prep_time_minutes` int UNSIGNED NOT NULL DEFAULT '30',
  `cod_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `rating_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `orders_count` bigint UNSIGNED NOT NULL DEFAULT '0',
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `tags` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `user_id`, `name`, `slug`, `description`, `logo`, `banner`, `business_license`, `tax_id`, `bank_account`, `contact_phone`, `contact_email`, `address`, `city`, `lat`, `lng`, `radius_km`, `status`, `rejection_reason`, `is_open`, `closed_message`, `commission_rate`, `min_order_value`, `delivery_enabled`, `delivery_fee`, `free_delivery_above`, `prep_time_minutes`, `cod_enabled`, `is_featured`, `rating_avg`, `rating_count`, `orders_count`, `approved_at`, `created_at`, `updated_at`, `tags`) VALUES
(1, 11, 'Bartell and Sons Kitchen', 'bartell-and-sons-kitchen-712975', 'Excepturi minus alias laboriosam et.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'West Earlineview', NULL, NULL, 5.00, 'approved', NULL, 1, NULL, 5.00, 0.00, 1, 20.00, NULL, 30, 1, 0, 0.00, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(2, 12, 'Reinger, Towne and Legros Kitchen', 'reinger-towne-and-legros-kitchen-457644', 'Voluptates sit facere quia cum aut reiciendis.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'North Bethany', NULL, NULL, 5.00, 'approved', NULL, 1, NULL, 5.00, 0.00, 1, 20.00, NULL, 30, 1, 0, 0.00, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(3, 13, 'Turner and Sons Kitchen', 'turner-and-sons-kitchen-596849', 'Dolores quibusdam laborum est.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'New Christaton', NULL, NULL, 5.00, 'approved', NULL, 1, NULL, 5.00, 0.00, 1, 20.00, NULL, 30, 1, 0, 0.00, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:17', '2026-05-20 06:19:17', NULL),
(4, 14, 'Rippin, O\'Conner and Pouros Kitchen', 'rippin-oconner-and-pouros-kitchen-489287', 'Veniam aut porro eius et facere officia fuga.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'East Antonietta', NULL, NULL, 5.00, 'approved', NULL, 1, NULL, 5.00, 0.00, 1, 20.00, NULL, 30, 1, 0, 0.00, 0, 0, '2026-05-20 06:19:17', '2026-05-20 06:19:18', '2026-05-20 06:19:18', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendor_reports`
--

CREATE TABLE `vendor_reports` (
  `id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `reason` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendor_user_blocks`
--

CREATE TABLE `vendor_user_blocks` (
  `id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `violations`
--

CREATE TABLE `violations` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evidence` text COLLATE utf8mb4_unicode_ci,
  `severity` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'low',
  `warning_number` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `subject_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject_id` bigint UNSIGNED DEFAULT NULL,
  `reported_by` bigint UNSIGNED DEFAULT NULL,
  `handled_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `violation_actions`
--

CREATE TABLE `violation_actions` (
  `id` bigint UNSIGNED NOT NULL,
  `violation_id` bigint UNSIGNED NOT NULL,
  `action_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `performed_by` bigint UNSIGNED DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vouchers`
--

CREATE TABLE `vouchers` (
  `id` bigint UNSIGNED NOT NULL,
  `vendor_id` bigint UNSIGNED DEFAULT NULL,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percentage',
  `amount` decimal(10,2) NOT NULL,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `min_order` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_uses` int UNSIGNED DEFAULT NULL,
  `per_user_limit` int UNSIGNED NOT NULL DEFAULT '1',
  `used_count` int UNSIGNED NOT NULL DEFAULT '0',
  `stackable` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_to` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vouchers`
--

INSERT INTO `vouchers` (`id`, `vendor_id`, `code`, `description`, `type`, `amount`, `max_discount`, `min_order`, `max_uses`, `per_user_limit`, `used_count`, `stackable`, `is_active`, `valid_from`, `valid_to`, `created_at`, `updated_at`) VALUES
(1, NULL, 'WELCOME50', '50 off your first order', 'flat', 50.00, NULL, 200.00, 1000, 1, 0, 0, 1, NULL, '2026-08-20 06:19:18', '2026-05-20 06:19:18', '2026-05-20 06:19:18');

-- --------------------------------------------------------

--
-- Table structure for table `voucher_redemptions`
--

CREATE TABLE `voucher_redemptions` (
  `id` bigint UNSIGNED NOT NULL,
  `voucher_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED DEFAULT NULL,
  `discount_applied` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_auditable_type_auditable_id_index` (`auditable_type`,`auditable_id`),
  ADD KEY `audit_logs_user_id_index` (`user_id`),
  ADD KEY `audit_logs_action_index` (`action`),
  ADD KEY `audit_logs_created_at_index` (`created_at`);

--
-- Indexes for table `blocks`
--
ALTER TABLE `blocks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blocks_blocker_id_blocked_id_unique` (`blocker_id`,`blocked_id`),
  ADD KEY `blocks_blocked_id_foreign` (`blocked_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversations_last_message_at_index` (`last_message_at`);

--
-- Indexes for table `conversation_user`
--
ALTER TABLE `conversation_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `conversation_user_conversation_id_user_id_unique` (`conversation_id`,`user_id`),
  ADD KEY `conversation_user_user_id_foreign` (`user_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  ADD KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `favorites_user_id_vendor_id_unique` (`user_id`,`vendor_id`),
  ADD KEY `favorites_vendor_id_foreign` (`vendor_id`);

--
-- Indexes for table `flash_deals`
--
ALTER TABLE `flash_deals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `flash_deals_vendor_id_ends_at_index` (`vendor_id`,`ends_at`),
  ADD KEY `flash_deals_item_id_index` (`item_id`);

--
-- Indexes for table `follows`
--
ALTER TABLE `follows`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `follows_follower_id_following_id_unique` (`follower_id`,`following_id`),
  ADD KEY `follows_following_id_status_index` (`following_id`,`status`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventory_items_vendor_id_index` (`vendor_id`);

--
-- Indexes for table `item_addons`
--
ALTER TABLE `item_addons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_addons_item_id_foreign` (`item_id`);

--
-- Indexes for table `item_images`
--
ALTER TABLE `item_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_images_item_id_foreign` (`item_id`);

--
-- Indexes for table `item_variants`
--
ALTER TABLE `item_variants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_variants_item_id_foreign` (`item_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu_categories`
--
ALTER TABLE `menu_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_categories_vendor_id_sort_order_index` (`vendor_id`,`sort_order`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_items_vendor_id_is_available_index` (`vendor_id`,`is_available`),
  ADD KEY `menu_items_category_id_index` (`category_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messages_user_id_foreign` (`user_id`),
  ADD KEY `messages_conversation_id_created_at_index` (`conversation_id`,`created_at`),
  ADD KEY `messages_replied_to_message_id_index` (`replied_to_message_id`);

--
-- Indexes for table `message_reactions`
--
ALTER TABLE `message_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `message_reactions_message_id_user_id_emoji_unique` (`message_id`,`user_id`,`emoji`),
  ADD KEY `message_reactions_user_id_foreign` (`user_id`),
  ADD KEY `message_reactions_message_id_index` (`message_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_read_at_index` (`user_id`,`read_at`);

--
-- Indexes for table `operating_hours`
--
ALTER TABLE `operating_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `operating_hours_vendor_id_day_of_week_unique` (`vendor_id`,`day_of_week`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_order_number_unique` (`order_number`),
  ADD KEY `orders_address_id_foreign` (`address_id`),
  ADD KEY `orders_user_id_status_index` (`user_id`,`status`),
  ADD KEY `orders_vendor_id_status_index` (`vendor_id`,`status`),
  ADD KEY `orders_status_index` (`status`),
  ADD KEY `orders_voucher_id_index` (`voucher_id`),
  ADD KEY `orders_delivery_partner_id_index` (`delivery_partner_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_order_id_foreign` (`order_id`),
  ADD KEY `order_items_item_id_foreign` (`item_id`);

--
-- Indexes for table `order_ratings`
--
ALTER TABLE `order_ratings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_ratings_order_id_unique` (`order_id`),
  ADD KEY `order_ratings_user_id_foreign` (`user_id`),
  ADD KEY `order_ratings_vendor_id_rating_index` (`vendor_id`,`rating`);

--
-- Indexes for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_status_history_changed_by_foreign` (`changed_by`),
  ADD KEY `order_status_history_order_id_created_at_index` (`order_id`,`created_at`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_user_id_foreign` (`user_id`),
  ADD KEY `payments_order_id_status_index` (`order_id`,`status`),
  ADD KEY `payments_intent_id_index` (`intent_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `posts_tagged_vendor_id_foreign` (`tagged_vendor_id`),
  ADD KEY `posts_tagged_item_id_foreign` (`tagged_item_id`),
  ADD KEY `posts_shared_post_id_foreign` (`shared_post_id`),
  ADD KEY `posts_user_id_created_at_index` (`user_id`,`created_at`),
  ADD KEY `posts_privacy_created_at_index` (`privacy`,`created_at`);

--
-- Indexes for table `post_comments`
--
ALTER TABLE `post_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `post_comments_user_id_foreign` (`user_id`),
  ADD KEY `post_comments_parent_id_foreign` (`parent_id`),
  ADD KEY `post_comments_post_id_parent_id_index` (`post_id`,`parent_id`);

--
-- Indexes for table `post_likes`
--
ALTER TABLE `post_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `post_likes_post_id_user_id_unique` (`post_id`,`user_id`),
  ADD KEY `post_likes_user_id_foreign` (`user_id`);

--
-- Indexes for table `post_media`
--
ALTER TABLE `post_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `post_media_post_id_foreign` (`post_id`);

--
-- Indexes for table `post_shares`
--
ALTER TABLE `post_shares`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `post_shares_user_id_post_id_unique` (`user_id`,`post_id`),
  ADD KEY `post_shares_post_id_foreign` (`post_id`);

--
-- Indexes for table `push_tokens`
--
ALTER TABLE `push_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `push_tokens_token_unique` (`token`),
  ADD KEY `push_tokens_user_id_index` (`user_id`);

--
-- Indexes for table `saved_posts`
--
ALTER TABLE `saved_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `saved_posts_user_id_post_id_unique` (`user_id`,`post_id`),
  ADD KEY `saved_posts_post_id_foreign` (`post_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `starred_messages`
--
ALTER TABLE `starred_messages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `starred_messages_message_id_user_id_unique` (`message_id`,`user_id`),
  ADD KEY `starred_messages_user_id_foreign` (`user_id`);

--
-- Indexes for table `stories`
--
ALTER TABLE `stories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stories_user_id_expires_at_index` (`user_id`,`expires_at`),
  ADD KEY `stories_expires_at_index` (`expires_at`);

--
-- Indexes for table `story_highlights`
--
ALTER TABLE `story_highlights`
  ADD PRIMARY KEY (`id`),
  ADD KEY `story_highlights_user_id_index` (`user_id`);

--
-- Indexes for table `story_views`
--
ALTER TABLE `story_views`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `story_views_story_id_user_id_unique` (`story_id`,`user_id`),
  ADD KEY `story_views_user_id_foreign` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_phone_unique` (`phone`),
  ADD UNIQUE KEY `users_referral_code_unique` (`referral_code`),
  ADD KEY `users_referred_by_foreign` (`referred_by`),
  ADD KEY `users_role_index` (`role`),
  ADD KEY `users_status_index` (`status`),
  ADD KEY `users_is_verified_index` (`is_verified`);

--
-- Indexes for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_addresses_user_id_is_default_index` (`user_id`,`is_default`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_profiles_user_id_unique` (`user_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendors_slug_unique` (`slug`),
  ADD KEY `vendors_user_id_foreign` (`user_id`),
  ADD KEY `vendors_status_is_open_index` (`status`,`is_open`),
  ADD KEY `vendors_city_index` (`city`),
  ADD KEY `vendors_status_index` (`status`);

--
-- Indexes for table `vendor_reports`
--
ALTER TABLE `vendor_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_reports_vendor_id_foreign` (`vendor_id`),
  ADD KEY `vendor_reports_user_id_foreign` (`user_id`),
  ADD KEY `vendor_reports_status_index` (`status`);

--
-- Indexes for table `vendor_user_blocks`
--
ALTER TABLE `vendor_user_blocks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendor_user_blocks_vendor_id_user_id_unique` (`vendor_id`,`user_id`),
  ADD KEY `vendor_user_blocks_user_id_foreign` (`user_id`);

--
-- Indexes for table `violations`
--
ALTER TABLE `violations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `violations_subject_type_subject_id_index` (`subject_type`,`subject_id`),
  ADD KEY `violations_reported_by_foreign` (`reported_by`),
  ADD KEY `violations_handled_by_foreign` (`handled_by`),
  ADD KEY `violations_user_id_status_index` (`user_id`,`status`);

--
-- Indexes for table `violation_actions`
--
ALTER TABLE `violation_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `violation_actions_violation_id_foreign` (`violation_id`),
  ADD KEY `violation_actions_performed_by_foreign` (`performed_by`);

--
-- Indexes for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vouchers_code_unique` (`code`),
  ADD KEY `vouchers_vendor_id_foreign` (`vendor_id`),
  ADD KEY `vouchers_is_active_valid_to_index` (`is_active`,`valid_to`);

--
-- Indexes for table `voucher_redemptions`
--
ALTER TABLE `voucher_redemptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucher_redemptions_user_id_foreign` (`user_id`),
  ADD KEY `voucher_redemptions_order_id_foreign` (`order_id`),
  ADD KEY `voucher_redemptions_voucher_id_user_id_index` (`voucher_id`,`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `blocks`
--
ALTER TABLE `blocks`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `conversation_user`
--
ALTER TABLE `conversation_user`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `flash_deals`
--
ALTER TABLE `flash_deals`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `follows`
--
ALTER TABLE `follows`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_addons`
--
ALTER TABLE `item_addons`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_images`
--
ALTER TABLE `item_images`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_variants`
--
ALTER TABLE `item_variants`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `menu_categories`
--
ALTER TABLE `menu_categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `message_reactions`
--
ALTER TABLE `message_reactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `operating_hours`
--
ALTER TABLE `operating_hours`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_ratings`
--
ALTER TABLE `order_ratings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `post_comments`
--
ALTER TABLE `post_comments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `post_likes`
--
ALTER TABLE `post_likes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `post_media`
--
ALTER TABLE `post_media`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `post_shares`
--
ALTER TABLE `post_shares`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `push_tokens`
--
ALTER TABLE `push_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `saved_posts`
--
ALTER TABLE `saved_posts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `starred_messages`
--
ALTER TABLE `starred_messages`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stories`
--
ALTER TABLE `stories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `story_highlights`
--
ALTER TABLE `story_highlights`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `story_views`
--
ALTER TABLE `story_views`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `vendor_reports`
--
ALTER TABLE `vendor_reports`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vendor_user_blocks`
--
ALTER TABLE `vendor_user_blocks`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `violations`
--
ALTER TABLE `violations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `violation_actions`
--
ALTER TABLE `violation_actions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `voucher_redemptions`
--
ALTER TABLE `voucher_redemptions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `blocks`
--
ALTER TABLE `blocks`
  ADD CONSTRAINT `blocks_blocked_id_foreign` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blocks_blocker_id_foreign` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conversation_user`
--
ALTER TABLE `conversation_user`
  ADD CONSTRAINT `conversation_user_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversation_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `flash_deals`
--
ALTER TABLE `flash_deals`
  ADD CONSTRAINT `flash_deals_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `follows`
--
ALTER TABLE `follows`
  ADD CONSTRAINT `follows_follower_id_foreign` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `follows_following_id_foreign` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD CONSTRAINT `inventory_items_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `item_addons`
--
ALTER TABLE `item_addons`
  ADD CONSTRAINT `item_addons_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `item_images`
--
ALTER TABLE `item_images`
  ADD CONSTRAINT `item_images_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `item_variants`
--
ALTER TABLE `item_variants`
  ADD CONSTRAINT `item_variants_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_categories`
--
ALTER TABLE `menu_categories`
  ADD CONSTRAINT `menu_categories_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `menu_items_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `message_reactions`
--
ALTER TABLE `message_reactions`
  ADD CONSTRAINT `message_reactions_message_id_foreign` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_reactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `operating_hours`
--
ALTER TABLE `operating_hours`
  ADD CONSTRAINT `operating_hours_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_address_id_foreign` FOREIGN KEY (`address_id`) REFERENCES `user_addresses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_ratings`
--
ALTER TABLE `order_ratings`
  ADD CONSTRAINT `order_ratings_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_ratings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_ratings_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `order_status_history_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `order_status_history_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_shared_post_id_foreign` FOREIGN KEY (`shared_post_id`) REFERENCES `posts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `posts_tagged_item_id_foreign` FOREIGN KEY (`tagged_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `posts_tagged_vendor_id_foreign` FOREIGN KEY (`tagged_vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `posts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `post_comments`
--
ALTER TABLE `post_comments`
  ADD CONSTRAINT `post_comments_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `post_comments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `post_comments_post_id_foreign` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `post_comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `post_likes`
--
ALTER TABLE `post_likes`
  ADD CONSTRAINT `post_likes_post_id_foreign` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `post_likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `post_media`
--
ALTER TABLE `post_media`
  ADD CONSTRAINT `post_media_post_id_foreign` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `post_shares`
--
ALTER TABLE `post_shares`
  ADD CONSTRAINT `post_shares_post_id_foreign` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `post_shares_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `push_tokens`
--
ALTER TABLE `push_tokens`
  ADD CONSTRAINT `push_tokens_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_posts`
--
ALTER TABLE `saved_posts`
  ADD CONSTRAINT `saved_posts_post_id_foreign` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_posts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `starred_messages`
--
ALTER TABLE `starred_messages`
  ADD CONSTRAINT `starred_messages_message_id_foreign` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `starred_messages_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stories`
--
ALTER TABLE `stories`
  ADD CONSTRAINT `stories_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `story_highlights`
--
ALTER TABLE `story_highlights`
  ADD CONSTRAINT `story_highlights_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `story_views`
--
ALTER TABLE `story_views`
  ADD CONSTRAINT `story_views_story_id_foreign` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `story_views_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_referred_by_foreign` FOREIGN KEY (`referred_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendors`
--
ALTER TABLE `vendors`
  ADD CONSTRAINT `vendors_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_reports`
--
ALTER TABLE `vendor_reports`
  ADD CONSTRAINT `vendor_reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vendor_reports_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_user_blocks`
--
ALTER TABLE `vendor_user_blocks`
  ADD CONSTRAINT `vendor_user_blocks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vendor_user_blocks_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `violations`
--
ALTER TABLE `violations`
  ADD CONSTRAINT `violations_handled_by_foreign` FOREIGN KEY (`handled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `violations_reported_by_foreign` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `violations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `violation_actions`
--
ALTER TABLE `violation_actions`
  ADD CONSTRAINT `violation_actions_performed_by_foreign` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `violation_actions_violation_id_foreign` FOREIGN KEY (`violation_id`) REFERENCES `violations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD CONSTRAINT `vouchers_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `voucher_redemptions`
--
ALTER TABLE `voucher_redemptions`
  ADD CONSTRAINT `voucher_redemptions_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `voucher_redemptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `voucher_redemptions_voucher_id_foreign` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
