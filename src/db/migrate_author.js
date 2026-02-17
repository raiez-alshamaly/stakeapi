import pool from './index.js';

async function migrateAuthorFields() {
    try {
        console.log('📝 Starting author fields migration...\n');

        // Add author_id to guides
        console.log('📚 Adding author fields to guides...');
        await pool.query(`
            ALTER TABLE guides 
            ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id)
        `);
        console.log('✅ Guides table updated\n');

        // Add author_id to news
        console.log('📰 Adding author fields to news...');
        await pool.query(`
            ALTER TABLE news 
            ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id)
        `);
        console.log('✅ News table updated\n');

        console.log('🎉 Author fields migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateAuthorFields();
