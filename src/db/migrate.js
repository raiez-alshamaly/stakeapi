import pool from './index.js';
import bcrypt from 'bcryptjs';

const migrate = async () => {
  console.log('🚀 Running database migrations...');

  try {
    // Create roles enum type
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'editor', 'writer', 'viewer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ user_role enum created');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role user_role DEFAULT 'viewer',
        avatar VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ users table created');

    // Create activity_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ activity_logs table created');

    // Create platforms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        rating DECIMAL(2,1) DEFAULT 0,
        payout_speed VARCHAR(100),
        bonus VARCHAR(255),
        type TEXT[] DEFAULT '{}',
        strengths TEXT[] DEFAULT '{}',
        considerations TEXT[] DEFAULT '{}',
        logo VARCHAR(500),
        description TEXT,
        markets TEXT[] DEFAULT '{}',
        payments TEXT[] DEFAULT '{}',
        security TEXT,
        support TEXT,
        features JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ platforms table created');

    // Create guides table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guides (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(100),
        excerpt TEXT,
        content TEXT,
        read_time VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ guides table created');

    // Create news table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(100),
        platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
        content TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ news table created');

    // Create top_lists table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS top_lists (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        platform_ids INTEGER[] DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'published',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ top_lists table created');

    // Create pages table (New)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT,
        meta_description VARCHAR(500),
        status VARCHAR(50) DEFAULT 'published',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ pages table created');

    // Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ settings table created');

    // Seed superadmin user
    const hashedPassword = await bcrypt.hash('raiez411', 10);
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (username) DO UPDATE SET 
        password = $3,
        role = $5,
        updated_at = CURRENT_TIMESTAMP
    `, ['raiez', 'raiez@stakegulf.com', hashedPassword, 'Raiez (Super Admin)', 'superadmin', true]);
    console.log('✅ Superadmin user created: raiez');

    // Seed default settings and content blocks
    const defaultSettings = [
      { key: 'site_title', value: { en: 'stakegulf - Compare the Best Betting Platforms' } },
      { key: 'site_description', value: { en: 'Compare and choose the best betting platforms with expert reviews.' } },
      { key: 'contact_info', value: { email: 'support@stakegulf.com', telegram: '@stakegulf_support', address: '123 Betting St.' } },
      { key: 'social_links', value: { facebook: '', twitter: '', telegram: '', instagram: '' } },
      {
        key: 'home_hero',
        value: {
          title: 'Find Your Perfect Betting Platform',
          subtitle: 'Unbiased reviews, exclusive bonuses, and expert guides for the modern bettor.',
          cta_text: 'Compare Now',
          cta_link: '/casino'
        }
      },
      {
        key: 'home_features',
        value: [
          { title: 'Trusted Reviews', description: 'We thoroughly test every platform for safety and fairness.' },
          { title: 'Exclusive Bonuses', description: 'Get access to special offers you won\'t find anywhere else.' },
          { title: 'Expert Guides', description: 'Learn strategies and tips to improve your game.' }
        ]
      },
      {
        key: 'footer_content',
        value: {
          about_text: 'stakegulf is your trusted source for online betting reviews and guides. We help you make informed decisions.',
          copyright_text: '© 2026 stakegulf. All rights reserved.'
        }
      }
    ];

    for (const setting of defaultSettings) {
      const keyCheck = await pool.query('SELECT id FROM settings WHERE key = $1', [setting.key]);
      if (keyCheck.rows.length === 0) {
        await pool.query(`
                   INSERT INTO settings (key, value)
                   VALUES ($1, $2)
                 `, [setting.key, JSON.stringify(setting.value)]);
      }
    }
    console.log('✅ Default settings seeded');

    // Seed default pages
    const defaultPages = [
      { title: 'About Us', slug: 'about', content: '<h1>About stakegulf</h1><p>We are a team of experts dedicated to providing the best betting platform reviews.</p>' },
      { title: 'Privacy Policy', slug: 'privacy', content: '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>' },
      { title: 'Terms of Service', slug: 'terms', content: '<h1>Terms of Service</h1><p>By using this site, you agree to...</p>' },
      { title: 'Contact Us', slug: 'contact', content: '<h1>Contact Us</h1><p>Get in touch with us via email or Telegram.</p>' }
    ];

    for (const page of defaultPages) {
      const pageCheck = await pool.query('SELECT id FROM pages WHERE slug = $1', [page.slug]);
      if (pageCheck.rows.length === 0) {
        await pool.query(`
                   INSERT INTO pages (title, slug, content, status)
                   VALUES ($1, $2, $3, 'published')
                 `, [page.title, page.slug, page.content]);
      }
    }
    console.log('✅ Default pages seeded');

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
};

migrate();
