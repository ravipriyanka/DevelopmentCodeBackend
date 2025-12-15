const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
    console.log('\n🚀 Starting Database Setup...\n');

    // Connection config WITHOUT database (to create it)
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    let connection;

    try {
        // Connect to MySQL
        console.log('📡 Connecting to MySQL...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to MySQL\n');

        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('📝 Creating database and tables...');
        await connection.query(schema);

        console.log('\n✅ Database setup completed successfully!\n');
        console.log('📋 Tables created:');
        console.log('   - users');
        console.log('   - user_settings');
        console.log('   - otp_records');
        console.log('   - bookings');
        console.log('   - favorites');
        console.log('   - search_history');
        console.log('   - api_logs');
        console.log('\n🎉 You can now start the server with: npm run dev\n');

    } catch (error) {
        console.error('\n❌ Database setup failed!\n');
        console.error('Error:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Solution: Check your MySQL credentials in .env file');
            console.log('   DB_USER=your_mysql_username');
            console.log('   DB_PASSWORD=your_mysql_password\n');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Solution: Make sure MySQL server is running');
            console.log('   sudo service mysql start  (Linux)');
            console.log('   brew services start mysql (Mac)\n');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

setupDatabase();

