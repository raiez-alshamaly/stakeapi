import pool from './index.js';

async function seedActivityLog() {
    try {
        console.log('📝 Seeding activity log and updating author info...\n');

        // Get superadmin user
        const superadminResult = await pool.query("SELECT id, username FROM users WHERE role = 'superadmin' LIMIT 1");
        let userId = superadminResult.rows[0]?.id;
        let username = superadminResult.rows[0]?.username;

        // Fallback to any admin
        if (!userId) {
            const adminResult = await pool.query("SELECT id, username, name FROM users WHERE role = 'admin' LIMIT 1");
            userId = adminResult.rows[0]?.id || 1;
            username = adminResult.rows[0]?.username || 'system';
        }

        console.log(`Using user: ${username} (ID: ${userId})\n`);

        // ========================================
        // UPDATE GUIDES WITH AUTHOR INFO
        // ========================================
        console.log('📚 Updating guides with author info...');
        const guides = await pool.query('SELECT id, title FROM guides');

        for (const guide of guides.rows) {
            // Update guide with author
            await pool.query(
                'UPDATE guides SET author_id = $1, author_name = $2 WHERE id = $3',
                [userId, username, guide.id]
            );

            // Add activity log entry
            await pool.query(
                `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_title, details)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, username, 'create', 'guide', guide.id, guide.title, JSON.stringify({ seeded: true })]
            );
        }
        console.log(`✅ Updated ${guides.rows.length} guides\n`);

        // ========================================
        // UPDATE NEWS WITH AUTHOR INFO
        // ========================================
        console.log('📰 Updating news with author info...');
        const news = await pool.query('SELECT id, title FROM news');

        for (const article of news.rows) {
            // Update news with author
            await pool.query(
                'UPDATE news SET author_id = $1, author_name = $2 WHERE id = $3',
                [userId, username, article.id]
            );

            // Add activity log entry
            await pool.query(
                `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_title, details)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, username, 'create', 'news', article.id, article.title, JSON.stringify({ seeded: true })]
            );
        }
        console.log(`✅ Updated ${news.rows.length} news articles\n`);

        // ========================================
        // ADD ACTIVITY LOGS FOR PLATFORMS
        // ========================================
        console.log('🎰 Adding activity logs for platforms...');
        const platforms = await pool.query('SELECT id, name FROM platforms');

        for (const platform of platforms.rows) {
            await pool.query(
                `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_title, details)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, username, 'create', 'platform', platform.id, platform.name, JSON.stringify({ seeded: true })]
            );
        }
        console.log(`✅ Added ${platforms.rows.length} platform logs\n`);

        // ========================================
        // ADD ACTIVITY LOGS FOR PAGES
        // ========================================
        console.log('📄 Adding activity logs for pages...');
        const pages = await pool.query('SELECT id, title FROM pages');

        for (const page of pages.rows) {
            await pool.query(
                `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_title, details)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, username, 'create', 'page', page.id, page.title, JSON.stringify({ seeded: true })]
            );
        }
        console.log(`✅ Added ${pages.rows.length} page logs\n`);

        // ========================================
        // ADD ACTIVITY LOGS FOR USERS
        // ========================================
        console.log('👥 Adding activity logs for users...');
        const users = await pool.query("SELECT id, username FROM users WHERE role != 'superadmin'");

        for (const user of users.rows) {
            await pool.query(
                `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_title, details)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, username, 'create_user', 'user', user.id, user.username, JSON.stringify({ seeded: true })]
            );
        }
        console.log(`✅ Added ${users.rows.length} user logs\n`);

        // ========================================
        // ADD ACTIVITY LOGS FOR TOP LISTS
        // ========================================
        console.log('📋 Adding activity logs for top lists...');
        const topLists = await pool.query('SELECT id, title FROM top_lists');

        for (const list of topLists.rows) {
            await pool.query(
                `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_title, details)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, username, 'create', 'top_list', list.id, list.title, JSON.stringify({ seeded: true })]
            );
        }
        console.log(`✅ Added ${topLists.rows.length} top list logs\n`);

        console.log('🎉 Activity log seeding completed successfully!');

        // Show summary
        const activityCount = await pool.query('SELECT COUNT(*) FROM activity_log');
        console.log(`\n📊 Total activity log entries: ${activityCount.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedActivityLog();
