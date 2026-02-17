import pool from './index.js';
import bcrypt from 'bcryptjs';

const resetUsers = async () => {
    console.log('🔄 Starting user reset process...\n');

    try {
        // Delete all users
        console.log('🗑️  Deleting all existing users...');

        // First, remove foreign key references safely
        console.log('  → Removing foreign key references...');

        const safeUpdate = async (query) => {
            try {
                await pool.query(query);
            } catch (e) {
                // Column might not exist, skip
            }
        };

        await safeUpdate('UPDATE guides SET created_by = NULL WHERE created_by IS NOT NULL');
        await safeUpdate('UPDATE guides SET updated_by = NULL WHERE updated_by IS NOT NULL');
        await safeUpdate('UPDATE guides SET author_id = NULL WHERE author_id IS NOT NULL');
        await safeUpdate('UPDATE news SET created_by = NULL WHERE created_by IS NOT NULL');
        await safeUpdate('UPDATE news SET updated_by = NULL WHERE updated_by IS NOT NULL');
        await safeUpdate('UPDATE news SET author_id = NULL WHERE author_id IS NOT NULL');
        await safeUpdate('UPDATE platforms SET created_by = NULL WHERE created_by IS NOT NULL');
        await safeUpdate('UPDATE platforms SET updated_by = NULL WHERE updated_by IS NOT NULL');
        await safeUpdate('UPDATE pages SET created_by = NULL WHERE created_by IS NOT NULL');
        await safeUpdate('UPDATE pages SET updated_by = NULL WHERE updated_by IS NOT NULL');
        await safeUpdate('UPDATE top_lists SET created_by = NULL WHERE created_by IS NOT NULL');
        await safeUpdate('UPDATE top_lists SET updated_by = NULL WHERE updated_by IS NOT NULL');
        await safeUpdate('UPDATE settings SET updated_by = NULL WHERE updated_by IS NOT NULL');
        await safeUpdate('UPDATE site_settings SET updated_by = NULL WHERE updated_by IS NOT NULL');
        await safeUpdate('DELETE FROM activity_logs WHERE user_id IS NOT NULL');

        // Now delete all users
        await pool.query('DELETE FROM users');
        console.log('✅ All users deleted\n');

        // Create new users
        console.log('👥 Creating new users...\n');

        const users = [
            {
                username: 'admin',
                email: 'admin@stakegulf.com',
                password: 'Admin@2026',
                name: 'Admin User',
                role: 'superadmin'
            },
            {
                username: 'raiez',
                email: 'raiez@stakegulf.com',
                password: 'Raiez@2026',
                name: 'Raiez (Owner)',
                role: 'superadmin'
            },
            {
                username: 'editor1',
                email: 'editor1@stakegulf.com',
                password: 'Editor@2026',
                name: 'Editor 1',
                role: 'editor'
            },
            {
                username: 'writer1',
                email: 'writer1@stakegulf.com',
                password: 'Writer@2026',
                name: 'Writer 1',
                role: 'writer'
            },
            {
                username: 'viewer1',
                email: 'viewer1@stakegulf.com',
                password: 'Viewer@2026',
                name: 'Viewer 1',
                role: 'viewer'
            }
        ];

        const createdUsers = [];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            const result = await pool.query(`
                INSERT INTO users (username, email, password, name, role, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, username, email, name, role
            `, [user.username, user.email, hashedPassword, user.name, user.role, true]);

            createdUsers.push({
                ...user,
                id: result.rows[0].id
            });

            console.log(`  ✅ Created: ${user.username} (${user.role})`);
        }

        // Display credentials
        console.log('\n' + '='.repeat(70));
        console.log('🔑 USER CREDENTIALS - SAVE THESE SAFELY!');
        console.log('='.repeat(70));
        console.log('\nFormat: Username | Email | Password | Role\n');

        createdUsers.forEach(user => {
            const padding = ' '.repeat(15 - user.username.length);
            const emailPadding = ' '.repeat(30 - user.email.length);
            const passPadding = ' '.repeat(15 - user.password.length);
            console.log(`${user.username}${padding}| ${user.email}${emailPadding}| ${user.password}${passPadding}| ${user.role}`);
        });

        console.log('\n' + '='.repeat(70));
        console.log(`✅ Total users created: ${createdUsers.length}`);
        console.log('='.repeat(70));

        // Save credentials to file
        const fs = await import('fs');
        const credentialsText = `
stakegulf - USER CREDENTIALS
Generated: ${new Date().toLocaleString()}
====================================

${createdUsers.map(user => `
Username: ${user.username}
Email:    ${user.email}
Password: ${user.password}
Role:     ${user.role}
------------------------------------
`).join('')}

⚠️ IMPORTANT: Keep these credentials safe and delete this file after saving them elsewhere!
`;

        fs.writeFileSync('USER_CREDENTIALS.txt', credentialsText);
        console.log('\n📄 Credentials also saved to: USER_CREDENTIALS.txt\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

resetUsers();
