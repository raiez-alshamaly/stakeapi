import pool from './index.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');

        // ========================================
        // 1. USERS (No superadmin)
        // ========================================
        console.log('👥 Seeding users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = [
            { username: 'admin_john', email: 'john@stakegulf.com', name: 'John Smith', role: 'admin' },
            { username: 'editor_sara', email: 'sara@stakegulf.com', name: 'Sara Johnson', role: 'editor' },
            { username: 'writer_mike', email: 'mike@stakegulf.com', name: 'Mike Wilson', role: 'writer' },
            { username: 'writer_emma', email: 'emma@stakegulf.com', name: 'Emma Davis', role: 'writer' },
            { username: 'viewer_alex', email: 'alex@stakegulf.com', name: 'Alex Brown', role: 'viewer' }
        ];

        for (const user of users) {
            await pool.query(
                `INSERT INTO users (username, email, password, name, role, is_active) 
                 VALUES ($1, $2, $3, $4, $5, true) 
                 ON CONFLICT (username) DO NOTHING`,
                [user.username, user.email, hashedPassword, user.name, user.role]
            );
        }
        console.log('✅ Users seeded\n');

        // ========================================
        // 2. PLATFORMS
        // ========================================
        console.log('🎰 Seeding platforms...');
        const platforms = [
            {
                name: 'Stake',
                slug: 'stake',
                rating: 4.9,
                payout_speed: 'Instant',
                bonus: '200% Welcome Bonus',
                type: ['casino', 'sportsbook'],
                strengths: ['Crypto-friendly', 'Fast payouts', 'Great VIP program'],
                considerations: ['No fiat currency support'],
                logo: 'https://via.placeholder.com/100x100?text=Stake',
                description: 'Stake is a leading crypto casino and sportsbook known for its provably fair games and instant withdrawals.',
                status: 'published'
            },
            {
                name: 'BetWinner',
                slug: 'betwinner',
                rating: 4.7,
                payout_speed: '1-24 hours',
                bonus: '100% up to $100',
                type: ['sportsbook'],
                strengths: ['Wide market coverage', 'Live streaming', 'Mobile app'],
                considerations: ['Complex bonus terms'],
                logo: 'https://via.placeholder.com/100x100?text=BetWinner',
                description: 'BetWinner offers comprehensive sports betting with excellent odds and live streaming.',
                status: 'published'
            },
            {
                name: '1xBet',
                slug: '1xbet',
                rating: 4.6,
                payout_speed: '15 minutes - 24 hours',
                bonus: '100% up to €130',
                type: ['casino', 'sportsbook'],
                strengths: ['Huge game selection', 'Many payment methods', 'Live betting'],
                considerations: ['Verification can be slow'],
                logo: 'https://via.placeholder.com/100x100?text=1xBet',
                description: '1xBet is a global betting platform with thousands of sports events and casino games.',
                status: 'published'
            },
            {
                name: 'BC.Game',
                slug: 'bcgame',
                rating: 4.8,
                payout_speed: 'Instant',
                bonus: 'Up to 180% + Free Spins',
                type: ['casino'],
                strengths: ['Crypto casino', 'Original games', 'Daily bonuses'],
                considerations: ['Limited customer support hours'],
                logo: 'https://via.placeholder.com/100x100?text=BC.Game',
                description: 'BC.Game is a crypto-native casino featuring unique games and generous rewards.',
                status: 'published'
            },
            {
                name: 'Bet365',
                slug: 'bet365',
                rating: 4.9,
                payout_speed: '24-48 hours',
                bonus: 'Bet Credits up to $30',
                type: ['sportsbook'],
                strengths: ['Best live betting', 'Trusted brand', 'Great mobile app'],
                considerations: ['Strict bonus wagering'],
                logo: 'https://via.placeholder.com/100x100?text=Bet365',
                description: 'Bet365 is one of the world\'s leading online gambling companies with premium sports betting.',
                status: 'published'
            }
        ];

        for (const p of platforms) {
            await pool.query(
                `INSERT INTO platforms (name, slug, rating, payout_speed, bonus, type, strengths, considerations, logo, description, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (slug) DO NOTHING`,
                [p.name, p.slug, p.rating, p.payout_speed, p.bonus, p.type, p.strengths, p.considerations, p.logo, p.description, p.status]
            );
        }
        console.log('✅ Platforms seeded\n');

        // ========================================
        // 3. GUIDES
        // ========================================
        console.log('📚 Seeding guides...');
        const guides = [
            {
                title: 'Complete Beginner\'s Guide to Sports Betting',
                slug: 'beginners-guide-sports-betting',
                category: 'Betting Basics',
                excerpt: 'Learn everything you need to know about sports betting, from odds to bankroll management.',
                content_blocks: [
                    { type: 'h2', content: 'Understanding Betting Odds' },
                    { type: 'paragraph', content: 'Betting odds represent the probability of an event occurring and determine your potential payout.' },
                    { type: 'h2', content: 'Types of Bets' },
                    { type: 'list', content: 'Moneyline bets\nSpread bets\nOver/Under bets\nParlay bets' }
                ],
                read_time: '10 min read',
                status: 'published'
            },
            {
                title: 'How to Choose the Best Betting Site',
                slug: 'how-to-choose-betting-site',
                category: 'Betting Basics',
                excerpt: 'A comprehensive guide on what to look for when selecting an online betting platform.',
                content_blocks: [
                    { type: 'h2', content: 'Key Factors to Consider' },
                    { type: 'paragraph', content: 'Choosing the right betting site is crucial for a safe and enjoyable experience.' },
                    { type: 'list', content: 'License and regulation\nPayment methods\nCustomer support\nBonuses and promotions' }
                ],
                read_time: '8 min read',
                status: 'published'
            },
            {
                title: 'Bankroll Management Strategies',
                slug: 'bankroll-management-strategies',
                category: 'Strategies',
                excerpt: 'Learn how to manage your betting funds effectively to maximize profits and minimize losses.',
                content_blocks: [
                    { type: 'h2', content: 'The Importance of Bankroll Management' },
                    { type: 'paragraph', content: 'Proper bankroll management is the foundation of successful betting.' },
                    { type: 'h2', content: 'Popular Strategies' },
                    { type: 'list', content: 'Flat betting\nPercentage betting\nKelly Criterion' }
                ],
                read_time: '12 min read',
                status: 'published'
            },
            {
                title: 'Understanding Casino House Edge',
                slug: 'understanding-casino-house-edge',
                category: 'Casino',
                excerpt: 'Discover how the house edge works and which games offer the best odds for players.',
                content_blocks: [
                    { type: 'h2', content: 'What is House Edge?' },
                    { type: 'paragraph', content: 'House edge is the mathematical advantage the casino has over players.' },
                    { type: 'h2', content: 'Games with Lowest House Edge' },
                    { type: 'list', content: 'Blackjack (0.5%)\nBaccarat (1.06%)\nCraps (1.36%)\nVideo Poker (0.5-2%)' }
                ],
                read_time: '7 min read',
                status: 'published'
            },
            {
                title: 'Responsible Gambling: Know Your Limits',
                slug: 'responsible-gambling-guide',
                category: 'Responsible Gambling',
                excerpt: 'Important information about gambling responsibly and recognizing problem gambling.',
                content_blocks: [
                    { type: 'h2', content: 'Signs of Problem Gambling' },
                    { type: 'paragraph', content: 'Recognizing warning signs early is crucial for maintaining healthy gambling habits.' },
                    { type: 'h2', content: 'Tools for Responsible Gambling' },
                    { type: 'list', content: 'Deposit limits\nSelf-exclusion\nReality checks\nTimeout periods' }
                ],
                read_time: '6 min read',
                status: 'published'
            }
        ];

        for (const g of guides) {
            await pool.query(
                `INSERT INTO guides (title, slug, category, excerpt, content, content_blocks, read_time, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (slug) DO NOTHING`,
                [g.title, g.slug, g.category, g.excerpt, '', JSON.stringify(g.content_blocks), g.read_time, g.status]
            );
        }
        console.log('✅ Guides seeded\n');

        // ========================================
        // 4. NEWS
        // ========================================
        console.log('📰 Seeding news...');
        const news = [
            {
                title: 'Stake Launches New VIP Program with Exclusive Rewards',
                slug: 'stake-new-vip-program',
                type: 'Platform Update',
                content_blocks: [
                    { type: 'paragraph', content: 'Stake has announced a revamped VIP program offering better rewards and exclusive bonuses.' },
                    { type: 'h2', content: 'New VIP Tiers' },
                    { type: 'list', content: 'Bronze - 5% rakeback\nSilver - 10% rakeback\nGold - 15% rakeback\nPlatinum - 20% rakeback' }
                ],
                status: 'published'
            },
            {
                title: 'New Cryptocurrency Payment Options Added to Major Betting Sites',
                slug: 'new-crypto-payment-options',
                type: 'Trending',
                content_blocks: [
                    { type: 'paragraph', content: 'Several major betting platforms have expanded their cryptocurrency support to include more altcoins.' },
                    { type: 'h2', content: 'Newly Supported Coins' },
                    { type: 'list', content: 'Solana (SOL)\nPolkadot (DOT)\nAvalanche (AVAX)' }
                ],
                status: 'published'
            },
            {
                title: 'BC.Game Introduces Revolutionary Provably Fair Games',
                slug: 'bcgame-provably-fair-games',
                type: 'New Platform',
                content_blocks: [
                    { type: 'paragraph', content: 'BC.Game continues to innovate with new provably fair games that allow players to verify results.' },
                    { type: 'h2', content: 'Featured New Games' },
                    { type: 'list', content: 'Crash 2.0\nPlinko Pro\nDice Duel' }
                ],
                status: 'published'
            },
            {
                title: 'Sports Betting Legalization Expands to More States',
                slug: 'sports-betting-legalization-expansion',
                type: 'General',
                content_blocks: [
                    { type: 'paragraph', content: 'The legalization of sports betting continues to expand across the United States.' },
                    { type: 'h2', content: 'Latest States to Legalize' },
                    { type: 'list', content: 'Maine\nVermont\nKentucky' }
                ],
                status: 'published'
            },
            {
                title: '1xBet Adds Live Streaming for All Major Sports Events',
                slug: '1xbet-live-streaming-update',
                type: 'Platform Update',
                content_blocks: [
                    { type: 'paragraph', content: '1xBet now offers free live streaming for registered users across all major sports.' },
                    { type: 'h2', content: 'Available Sports' },
                    { type: 'list', content: 'Football\nBasketball\nTennis\nCricket\nEsports' }
                ],
                status: 'published'
            }
        ];

        for (const n of news) {
            await pool.query(
                `INSERT INTO news (title, slug, type, content, content_blocks, status)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (slug) DO NOTHING`,
                [n.title, n.slug, n.type, '', JSON.stringify(n.content_blocks), n.status]
            );
        }
        console.log('✅ News seeded\n');

        // ========================================
        // 5. TOP LISTS
        // ========================================
        console.log('📋 Seeding top lists...');

        // Get platform IDs
        const platformIds = await pool.query('SELECT id FROM platforms ORDER BY rating DESC LIMIT 5');
        const ids = platformIds.rows.map(r => r.id);

        const topLists = [
            {
                title: 'Best Crypto Casinos 2024',
                slug: 'best-crypto-casinos-2024',
                description: 'Top cryptocurrency gambling sites with the best bonuses and fastest payouts.',
                platform_ids: ids.slice(0, 3),
                status: 'published'
            },
            {
                title: 'Best Sports Betting Sites',
                slug: 'best-sports-betting-sites',
                description: 'The top platforms for sports betting with competitive odds and live streaming.',
                platform_ids: ids.slice(1, 4),
                status: 'published'
            },
            {
                title: 'Fastest Payout Casinos',
                slug: 'fastest-payout-casinos',
                description: 'Casinos with instant or same-day withdrawals.',
                platform_ids: ids.slice(0, 2),
                status: 'published'
            },
            {
                title: 'Best Welcome Bonuses',
                slug: 'best-welcome-bonuses',
                description: 'Platforms offering the most generous welcome bonuses for new players.',
                platform_ids: ids,
                status: 'published'
            }
        ];

        for (const t of topLists) {
            await pool.query(
                `INSERT INTO top_lists (title, slug, description, platform_ids, status)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (slug) DO NOTHING`,
                [t.title, t.slug, t.description, t.platform_ids, t.status]
            );
        }
        console.log('✅ Top Lists seeded\n');

        // ========================================
        // 6. PAGES
        // ========================================
        console.log('📄 Seeding pages...');
        const pages = [
            {
                title: 'About Us',
                slug: 'about-us',
                meta_description: 'Learn about stakegulf and our mission to provide honest betting reviews.',
                content_blocks: [
                    { type: 'h2', content: 'Our Mission' },
                    { type: 'paragraph', content: 'stakegulf is dedicated to providing honest, comprehensive reviews of online betting platforms.' },
                    { type: 'h2', content: 'Our Team' },
                    { type: 'paragraph', content: 'We are a team of experienced gamblers and industry experts committed to helping you make informed decisions.' }
                ],
                status: 'published'
            },
            {
                title: 'Privacy Policy',
                slug: 'privacy-policy',
                meta_description: 'Read our privacy policy to understand how we handle your data.',
                content_blocks: [
                    { type: 'h2', content: 'Data Collection' },
                    { type: 'paragraph', content: 'We collect minimal data necessary to provide our services.' },
                    { type: 'h2', content: 'Data Usage' },
                    { type: 'paragraph', content: 'Your data is never sold to third parties.' }
                ],
                status: 'published'
            },
            {
                title: 'Terms of Service',
                slug: 'terms-of-service',
                meta_description: 'Terms and conditions for using stakegulf services.',
                content_blocks: [
                    { type: 'h2', content: 'Acceptance of Terms' },
                    { type: 'paragraph', content: 'By using this website, you agree to these terms.' },
                    { type: 'h2', content: 'User Responsibilities' },
                    { type: 'paragraph', content: 'Users must be of legal gambling age in their jurisdiction.' }
                ],
                status: 'published'
            },
            {
                title: 'Contact Us',
                slug: 'contact-us',
                meta_description: 'Get in touch with the stakegulf team.',
                content_blocks: [
                    { type: 'h2', content: 'How to Reach Us' },
                    { type: 'paragraph', content: 'Email: support@stakegulf.com' },
                    { type: 'paragraph', content: 'We typically respond within 24 hours.' }
                ],
                status: 'published'
            }
        ];

        for (const p of pages) {
            await pool.query(
                `INSERT INTO pages (title, slug, meta_description, content, content_blocks, status)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (slug) DO NOTHING`,
                [p.title, p.slug, p.meta_description, '', JSON.stringify(p.content_blocks), p.status]
            );
        }
        console.log('✅ Pages seeded\n');

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   - 5 Users (password: password123)');
        console.log('   - 5 Platforms');
        console.log('   - 5 Guides');
        console.log('   - 5 News articles');
        console.log('   - 4 Top Lists');
        console.log('   - 4 Pages');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
