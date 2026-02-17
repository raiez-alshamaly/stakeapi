import pool from './index.js';

async function migrateAffiliateUrl() {
    console.log('🔗 Adding affiliate_url field to platforms...\n');

    try {
        // Add affiliate_url column to platforms table
        await pool.query(`
            ALTER TABLE platforms
            ADD COLUMN IF NOT EXISTS affiliate_url VARCHAR(500)
        `);
        console.log('✅ affiliate_url column added to platforms\n');

        // Update existing platforms with sample affiliate URLs
        await pool.query(`
            UPDATE platforms SET affiliate_url = 
                CASE slug
                    WHEN 'stake' THEN 'https://stake.com/?ref=stakegulf'
                    WHEN 'bc-game' THEN 'https://bc.game/?ref=stakegulf'
                    WHEN 'bet365' THEN 'https://bet365.com/?ref=stakegulf'
                    WHEN 'roobet' THEN 'https://roobet.com/?ref=stakegulf'
                    WHEN '1xbet' THEN 'https://1xbet.com/?ref=stakegulf'
                    WHEN 'cloudbet' THEN 'https://cloudbet.com/?ref=stakegulf'
                    ELSE 'https://' || slug || '.com'
                END
            WHERE affiliate_url IS NULL
        `);
        console.log('✅ Affiliate URLs updated for existing platforms\n');

        console.log('🎉 Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

migrateAffiliateUrl();
