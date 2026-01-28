-- Create additional databases for services that need them

-- Metabase database
CREATE DATABASE metabase;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE metabase TO motochefe;
