import pool from './index.js';

async function migrateSettings() {
    try {
        console.log('⚙️ Creating settings table...\n');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS site_settings (
                id SERIAL PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                setting_type VARCHAR(50) DEFAULT 'string',
                description TEXT,
                updated_by INTEGER REFERENCES users(id),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ site_settings table created\n');

        // Insert default settings
        console.log('📝 Inserting default settings...');

        const defaultSettings = [
            { key: 'site_font', value: 'Inter', type: 'font', description: 'Default font for the website' },
            { key: 'site_name', value: 'stakegulf', type: 'string', description: 'Website name' },
            { key: 'site_description', value: 'Your trusted gambling reviews platform', type: 'string', description: 'Website description' }
        ];

        for (const setting of defaultSettings) {
            await pool.query(`
                INSERT INTO site_settings (setting_key, setting_value, setting_type, description)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (setting_key) DO NOTHING
            `, [setting.key, setting.value, setting.type, setting.description]);
        }

        console.log('✅ Default settings inserted\n');
        console.log('🎉 Settings migration completed!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateSettings();
