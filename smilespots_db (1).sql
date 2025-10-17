-- -----------------------------------------------------
-- Database Creation (FIXED COLLATIONS for XAMPP)
-- Changed 'utf8mb4_0900_ai_ci' to 'utf8mb4_unicode_ci' to fix error #1273.
-- -----------------------------------------------------
CREATE DATABASE IF NOT EXISTS `smilespots_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smilespots_db`;

-- -----------------------------------------------------
-- Table 1: types (Lookup table for location types)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `types` (
  `type_id` INT NOT NULL AUTO_INCREMENT,
  `type_name` VARCHAR(50) NOT NULL UNIQUE,
  PRIMARY KEY (`type_id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table 2: vibes (Lookup table for atmosphere/vibe)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vibes` (
  `vibe_id` INT NOT NULL AUTO_INCREMENT,
  `vibe_name` VARCHAR(50) NOT NULL UNIQUE,
  PRIMARY KEY (`vibe_id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table 3: amenities (Lookup table for available features)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `amenities` (
  `amenity_id` INT NOT NULL AUTO_INCREMENT,
  `amenity_name` VARCHAR(50) NOT NULL UNIQUE,
  `amenity_slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Short name for use in scripts (e.g., wifi, parking)',
  PRIMARY KEY (`amenity_id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table 4: subcategories (Specific details for filtering - CUSTOM LIST)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `subcategories` (
  `subcategory_id` INT NOT NULL AUTO_INCREMENT,
  `subcategory_name` VARCHAR(100) NOT NULL UNIQUE,
  -- Assuming you'll link the subcategory back to its main type in PHP, but storing them all here for simplicity.
  PRIMARY KEY (`subcategory_id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table 5: locations (The main table)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `locations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `type_id` INT NOT NULL COMMENT 'FK to types',
  `subcategory_id` INT NULL COMMENT 'FK to subcategories',
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `vibe_id` INT NULL COMMENT 'FK to vibes',
  `description` TEXT NULL,
  `image_id` VARCHAR(50) NULL COMMENT 'Reference to an image file',
  `date_added` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  
  -- Define Foreign Key Constraints
  CONSTRAINT `fk_locations_type` FOREIGN KEY (`type_id`) REFERENCES `types` (`type_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_locations_vibe` FOREIGN KEY (`vibe_id`) REFERENCES `vibes` (`vibe_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_locations_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`subcategory_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table 6: location_amenities (Junction table for many-to-many relationship)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `location_amenities` (
  `location_id` INT NOT NULL,
  `amenity_id` INT NOT NULL,
  PRIMARY KEY (`location_id`, `amenity_id`),
  
  -- Define Foreign Key Constraints
  CONSTRAINT `fk_location_amenities_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_location_amenities_amenity` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`amenity_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Inserting all specified data (DML)
-- -----------------------------------------------------

-- Types (8 types specified by the user)
INSERT INTO `types` (`type_name`) VALUES
('Restaurant'), 
('Cafe'), 
('Church'), 
('Bar'), 
('Park'), 
('Museum'),
('Mall'),
('Secret'); -- Assuming 'Secret' was the 8th type from the previous full admin list

-- Subcategories (12 specific values provided by the user)
INSERT INTO `subcategories` (`subcategory_name`) VALUES
-- Restaurant Subcategories
('Filipino'), 
('Japanese'), 
('Fast food'), 
('Sea food'),
-- Church Subcategories
('Iglesia'), 
('Christian'), 
('Catholic'), 
('Baptist'), 
('Mormons'),
-- Park Subcategories
('Amusement Park'), 
('Water Park'), 
('Greenspace');

-- Vibes (from index.html)
INSERT INTO `vibes` (`vibe_name`) VALUES
('Romantic'), 
('Family Friendly'), 
('Trendy'), 
('Quiet'), 
('Lively');

-- Amenities (from index.html)
INSERT INTO `amenities` (`amenity_name`, `amenity_slug`) VALUES
('Free WiFi', 'wifi'),
('Parking', 'parking'),
('Outdoor Seating', 'outdoor'),
('Delivery', 'delivery');