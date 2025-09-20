-- MySQL Master Initialization Script
-- WinTrades Global Trading Platform

-- Create replication user
CREATE USER 'replication'@'%' IDENTIFIED BY 'WinTrades2024!';
GRANT REPLICATION SLAVE ON *.* TO 'replication'@'%';

-- Create application user with appropriate permissions
CREATE USER 'wintradesgo'@'%' IDENTIFIED BY 'WinTrades2024!';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP ON wintradesgo.* TO 'wintradesgo'@'%';

-- Create monitoring user
CREATE USER 'monitor'@'%' IDENTIFIED BY 'Monitor2024!';
GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'monitor'@'%';
GRANT SELECT ON performance_schema.* TO 'monitor'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Enable semi-synchronous replication
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = 1;

-- Show master status for slave configuration
SHOW MASTER STATUS;