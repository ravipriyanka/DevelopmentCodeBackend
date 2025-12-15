const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create users table if not exists
const createUsersTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                uuid VARCHAR(36) UNIQUE NOT NULL,
                firebase_uid VARCHAR(128) UNIQUE,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(20) UNIQUE,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                profile_image VARCHAR(500),
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other'),
                address TEXT,
                city VARCHAR(100),
                country VARCHAR(100),
                is_email_verified BOOLEAN DEFAULT FALSE,
                is_phone_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table ready');
    } catch (error) {
        console.log('⚠️  Users table error:', error.message);
        console.log('💡 Run: npm run setup-db to create database');
    }
};

// User Model
const UserModel = {
    // Create new user
    async create(userData) {
        const uuid = uuidv4();
        const { firebaseUid, email, phone, firstName, lastName } = userData;
    

        const [result] = await pool.query(`
            INSERT INTO users (uuid, firebase_uid, email, phone, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [uuid, firebaseUid, email, phone, firstName, lastName]);

        return { id: result.insertId, uuid };
    },

    // Find by Firebase UID
    async findByFirebaseUid(firebaseUid) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE firebase_uid = ?',
            [firebaseUid]
        );
        return rows[0] || null;
    },

    // Find by email
    async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    },

    // Find by phone
    async findByPhone(phone) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );
        return rows[0] || null;
    },

    // Find by UUID
    async findByUuid(uuid) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE uuid = ?',
            [uuid]
        );
        return rows[0] || null;
    },

    // Find by ID
    async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },
    

    //
    async update(uuid, updateData) {
        const fields = [];
        const values = [];
        

        Object.keys(updateData).forEach(key => {
            // Convert camelCase to snake_case
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            fields.push(`${snakeKey} = ?`);
            values.push(updateData[key]);
        });

        if (fields.length === 0) return null;
        //if(fields.length===0) return null;
      //  values.push(uuid);

        values.push(uuid);

        const [result] = await pool.query(

            `UPDATE users SET ${fields.join(', ')} WHERE uuid = ?`,
            values
        );
        

        return result.affectedRows > 0;
    },

    // Update last login
    async updateLastLogin(uuid) {
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE uuid = ?',
            [uuid]
        );
    },

    // Delete user (soft delete) delete (soft delt)
    async delete(uuid) {
        const [result] = await pool.query(
            'UPDATE users SET is_active = FALSE WHERE uuid = ?',
            [uuid]
        );
        return result.affectedRows > 0;
    },

    // Hard delete user
    async hardDelete(uuid) {
        const [result] = await pool.query(
            'DELETE FROM users WHERE uuid = ?',
            [uuid]
        );
        return result.affectedRows > 0;
        
    },

    // Get all users (for admin)
    async getAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE is_active = TRUE ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE is_active = TRUE'
        );

        return {
            users: rows,
            total: countResult[0].total,
            page,
            limit
        };
    }
};

module.exports = { UserModel, createUsersTable };






