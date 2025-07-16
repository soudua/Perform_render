#!/bin/bash

# Database deployment script for Render production
echo "🚀 Starting database deployment for production..."

# Set variables
DB_PATH="/tmp/timetracker.db"
BACKUP_PATH="/tmp/timetracker-backup.db"
SQL_DUMP="database-production.sql"

# Ensure we're in the correct directory
cd "$(dirname "$0")"
echo "📍 Working directory: $(pwd)"
echo "📄 Checking for SQL dump file: $SQL_DUMP"

# Check if database already exists and has data
if [ -f "$DB_PATH" ]; then
    echo "📊 Checking existing database..."
    
    # Count users in existing database
    USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM utilizadores WHERE active = 1;" 2>/dev/null || echo "0")
    
    if [ "$USER_COUNT" -gt "0" ]; then
        echo "✅ Found $USER_COUNT active users in existing database"
        echo "🔄 Database exists with data, proceeding with migrations only..."
        
        # Run migrations to ensure database schema is up to date
        echo "🔄 Running database migrations..."
        
        # Check if github_account column exists and add it if missing
        COLUMN_EXISTS=$(sqlite3 "$DB_PATH" "PRAGMA table_info(utilizadores);" | grep -c "github_account" || true)
        if [ "$COLUMN_EXISTS" -eq "0" ]; then
            echo "📝 Adding github_account column to utilizadores table..."
            sqlite3 "$DB_PATH" "ALTER TABLE utilizadores ADD COLUMN github_account TEXT DEFAULT NULL;"
            
            if [ $? -eq 0 ]; then
                echo "✅ github_account column added successfully"
                
                # Set default GitHub account for admin user (user_id = 1)
                echo "🔧 Setting default GitHub account for admin user..."
                sqlite3 "$DB_PATH" "UPDATE utilizadores SET github_account = 'soudua' WHERE user_id = 1;"
                
                # Also set GitHub accounts for other key users if they exist
                sqlite3 "$DB_PATH" "UPDATE utilizadores SET github_account = 'soudua' WHERE email = 'suporte@grupoerre.pt';"
                
                echo "✅ Default GitHub account set for admin user"
            else
                echo "❌ Failed to add github_account column"
                exit 1
            fi
        else
            echo "✅ github_account column already exists"
            
            # Check if admin user has github_account set
            ADMIN_GITHUB=$(sqlite3 "$DB_PATH" "SELECT github_account FROM utilizadores WHERE user_id = 1;" 2>/dev/null || echo "")
            if [ -z "$ADMIN_GITHUB" ] || [ "$ADMIN_GITHUB" = "NULL" ]; then
                echo "🔧 Setting GitHub account for admin user (was empty)..."
                sqlite3 "$DB_PATH" "UPDATE utilizadores SET github_account = 'soudua' WHERE user_id = 1;"
                echo "✅ Admin GitHub account updated"
            else
                echo "✅ Admin user already has GitHub account: $ADMIN_GITHUB"
            fi
        fi
        
        echo "✅ Database migrations completed"
        exit 0
    else
        echo "⚠️  Database exists but no active users found"
    fi
else
    echo "📝 No existing database found, will restore from SQL dump"
fi

# Backup existing database if it exists
if [ -f "$DB_PATH" ]; then
    echo "💾 Backing up existing database..."
    cp "$DB_PATH" "$BACKUP_PATH"
fi

# Restore from SQL dump if available
if [ -f "$SQL_DUMP" ]; then
    echo "📄 Restoring database from SQL dump: $SQL_DUMP"
    
    # Remove existing database
    rm -f "$DB_PATH"
    
    # Restore from SQL dump
    sqlite3 "$DB_PATH" < "$SQL_DUMP"
    
    if [ $? -eq 0 ]; then
        # Verify restoration
        USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM utilizadores WHERE active = 1;" 2>/dev/null || echo "0")
        TIMESHEET_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM timesheet;" 2>/dev/null || echo "0")
        
        if [ "$USER_COUNT" -gt "0" ]; then
            echo "✅ Database restored successfully!"
            echo "👥 Users: $USER_COUNT"
            echo "📊 Timesheet records: $TIMESHEET_COUNT"
        else
            echo "⚠️  Database restored but no users found"
        fi
    else
        echo "❌ Failed to restore from SQL dump"
        # Restore backup if restoration failed
        if [ -f "$BACKUP_PATH" ]; then
            echo "🔄 Restoring from backup..."
            cp "$BACKUP_PATH" "$DB_PATH"
        fi
        exit 1
    fi
else
    echo "❌ No SQL dump file found: $SQL_DUMP"
    echo "🔄 Database will be initialized with empty schema"
fi

echo "✅ Database deployment completed"

# Run migrations to ensure database schema is up to date
echo "🔄 Running database migrations..."

# Check if github_account column exists and add it if missing
COLUMN_EXISTS=$(sqlite3 "$DB_PATH" "PRAGMA table_info(utilizadores);" | grep -c "github_account" || true)
if [ "$COLUMN_EXISTS" -eq "0" ]; then
    echo "📝 Adding github_account column to utilizadores table..."
    sqlite3 "$DB_PATH" "ALTER TABLE utilizadores ADD COLUMN github_account TEXT DEFAULT NULL;"
    
    if [ $? -eq 0 ]; then
        echo "✅ github_account column added successfully"
        
        # Set default GitHub account for admin user (user_id = 1)
        echo "🔧 Setting default GitHub account for admin user..."
        sqlite3 "$DB_PATH" "UPDATE utilizadores SET github_account = 'soudua' WHERE user_id = 1;"
        
        # Also set GitHub accounts for other key users if they exist
        sqlite3 "$DB_PATH" "UPDATE utilizadores SET github_account = 'soudua' WHERE email = 'suporte@grupoerre.pt';"
        
        echo "✅ Default GitHub account set for admin user"
    else
        echo "❌ Failed to add github_account column"
        exit 1
    fi
else
    echo "✅ github_account column already exists"
    
    # Check if admin user has github_account set
    ADMIN_GITHUB=$(sqlite3 "$DB_PATH" "SELECT github_account FROM utilizadores WHERE user_id = 1;" 2>/dev/null || echo "")
    if [ -z "$ADMIN_GITHUB" ] || [ "$ADMIN_GITHUB" = "NULL" ]; then
        echo "🔧 Setting GitHub account for admin user (was empty)..."
        sqlite3 "$DB_PATH" "UPDATE utilizadores SET github_account = 'soudua' WHERE user_id = 1;"
        echo "✅ Admin GitHub account updated"
    else
        echo "✅ Admin user already has GitHub account: $ADMIN_GITHUB"
    fi
fi

echo "✅ Database migrations completed"
