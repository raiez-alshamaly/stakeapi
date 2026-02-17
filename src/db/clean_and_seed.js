import pool from './index.js';

async function cleanAndSeedDatabase() {
    try {
        console.log('🧹 Starting database cleanup and seeding...\n');

        // ============================================
        // STEP 1: Clean all tables except users
        // ============================================
        console.log('📋 Cleaning tables (keeping users)...');

        const safeDelete = async (table) => {
            try {
                await pool.query(`DELETE FROM ${table}`);
                console.log(`  ✓ Cleaned ${table}`);
            } catch (e) {
                console.log(`  - Table ${table} doesn't exist, skipping`);
            }
        };

        await safeDelete('notifications');
        await safeDelete('top_list_platforms');
        await safeDelete('top_lists');
        await safeDelete('news');
        await safeDelete('guides');
        await safeDelete('platforms');
        await safeDelete('pages');

        console.log('✅ All tables cleaned\n');

        // ============================================
        // STEP 2: Update site settings
        // ============================================
        console.log('⚙️ Updating site settings...');

        try {
            await pool.query(`
                INSERT INTO site_settings (setting_key, setting_value) VALUES ('site_font', 'Poppins')
                ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'Poppins'
            `);
            await pool.query(`
                INSERT INTO site_settings (setting_key, setting_value) VALUES ('site_name', 'stakegulf')
                ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'stakegulf'
            `);
            console.log('✅ Site settings updated\n');
        } catch (e) {
            console.log('  - Site settings table not found, skipping\n');
        }

        // ============================================
        // STEP 3: Seed Platforms
        // ============================================
        console.log('🎰 Seeding platforms...');

        const platforms = [
            {
                name: 'Stake',
                slug: 'stake',
                logo: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=200',
                rating: 9.8,
                type: ['casino', 'sportsbook'],
                payout_speed: '< 1 hour',
                bonus: '200% Welcome Bonus up to $1000',
                description: 'One of the leading cryptocurrency casinos and sportsbooks with an extensive game library and competitive odds.',
                strengths: ['Crypto Native', 'Instant Withdrawals', 'VIP Program', 'Live Casino'],
                considerations: ['Not available in some countries', 'No traditional payments'],
                markets: ['Football', 'Basketball', 'Tennis', 'Esports', 'MMA'],
                payments: ['Bitcoin', 'Ethereum', 'Litecoin', 'USDT', 'Dogecoin'],
                security: 'Curacao license, 2FA, Provably fair games',
                support: '24/7 Live Chat, Email Support',
                features: { live_streaming: true, cash_out: true, bet_builder: true },
                affiliate_url: 'https://stake.com/?ref=stakegulf',
                status: 'published'
            },
            {
                name: 'BC.Game',
                slug: 'bc-game',
                logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200',
                rating: 9.5,
                type: ['casino'],
                payout_speed: '< 10 minutes',
                bonus: 'Up to 360% Deposit Bonus + Daily Spin',
                description: 'A crypto-focused online casino known for its innovative games and generous rewards program.',
                strengths: ['Original Games', 'Lucky Spin', 'Rakeback', '10K+ Games'],
                considerations: ['Complex interface', 'Limited sports betting'],
                markets: ['Slots', 'Table Games', 'Live Casino'],
                payments: ['Bitcoin', 'Ethereum', 'BNB', 'USDT', 'DOGE', 'NFTs'],
                security: 'Curacao license, Provably fair',
                support: '24/7 Live Chat, Telegram Group',
                features: { provably_fair: true, nft_support: true },
                affiliate_url: 'https://bc.game/?ref=stakegulf',
                status: 'published'
            },
            {
                name: 'Bet365',
                slug: 'bet365',
                logo: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=200',
                rating: 9.4,
                type: ['sportsbook'],
                payout_speed: '1-5 business days',
                bonus: 'Bet $10 Get $30 in Free Bets',
                description: 'The world\'s favorite online sports betting company with a massive range of sports and markets.',
                strengths: ['Live Streaming', 'Cash Out', 'In-Play Betting', 'Best Odds'],
                considerations: ['Account restrictions', 'Complex bonus terms'],
                markets: ['Football', 'Horse Racing', 'Tennis', 'Cricket', 'Golf'],
                payments: ['Visa', 'Mastercard', 'PayPal', 'Bank Transfer'],
                security: 'UK Gambling Commission, Gibraltar license, SSL encryption',
                support: '24/7 Live Chat, Phone, Email',
                features: { live_streaming: true, cash_out: true, stats: true },
                affiliate_url: 'https://bet365.com/?ref=stakegulf',
                status: 'published'
            },
            {
                name: 'Roobet',
                slug: 'roobet',
                logo: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?w=200',
                rating: 9.2,
                type: ['casino'],
                payout_speed: '< 5 minutes',
                bonus: 'Weekly Cashback + Rakeback + Free Spins',
                description: 'A modern crypto casino with a sleek interface and unique original games.',
                strengths: ['Beautiful Design', 'Crash Game', 'Fast Payouts', 'Giveaways'],
                considerations: ['Limited payment options', 'Geo-restrictions'],
                markets: ['Slots', 'Crash', 'Roulette', 'Dice'],
                payments: ['Bitcoin', 'Ethereum', 'Litecoin'],
                security: 'Curacao license, Provably fair',
                support: '24/7 Live Chat, Twitter Support',
                features: { provably_fair: true, vip_program: true },
                affiliate_url: 'https://roobet.com/?ref=stakegulf',
                status: 'published'
            },
            {
                name: '1xBet',
                slug: '1xbet',
                logo: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=200',
                rating: 9.0,
                type: ['casino', 'sportsbook'],
                payout_speed: '15 minutes - 7 days',
                bonus: '100% Welcome Bonus up to €300 + 150 Free Spins',
                description: 'A comprehensive betting platform offering thousands of sports events and casino games daily.',
                strengths: ['Huge Variety', 'Multiple Currencies', 'Good Odds', 'Many Bonuses'],
                considerations: ['Cluttered interface', 'Slow withdrawals sometimes'],
                markets: ['Football', 'Basketball', 'Tennis', 'Esports', 'Virtual Sports'],
                payments: ['Bitcoin', 'Visa', 'Mastercard', 'Skrill', 'Neteller'],
                security: 'Curacao license, SSL encryption',
                support: '24/7 Live Chat, Email, Phone',
                features: { live_streaming: true, bet_builder: true, esports: true },
                affiliate_url: 'https://1xbet.com/?ref=stakegulf',
                status: 'published'
            },
            {
                name: 'Cloudbet',
                slug: 'cloudbet',
                logo: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=200',
                rating: 8.9,
                type: ['casino', 'sportsbook'],
                payout_speed: '< 24 hours',
                bonus: '100% Welcome Bonus up to 5 BTC',
                description: 'Pioneer in Bitcoin gambling with a solid reputation and high betting limits.',
                strengths: ['High Limits', 'BTC Native', 'Esports', 'Zero Margin Odds'],
                considerations: ['Limited fiat options', 'Basic design'],
                markets: ['Football', 'Basketball', 'Esports', 'MMA', 'Cricket'],
                payments: ['Bitcoin', 'Ethereum', 'Bitcoin Cash', 'USDT'],
                security: 'Curacao license, 2FA, Cold storage',
                support: '24/7 Live Chat, Email',
                features: { high_limits: true, esports: true, zero_margin: true },
                affiliate_url: 'https://cloudbet.com/?ref=stakegulf',
                status: 'published'
            }
        ];

        const platformIds = {};
        for (const platform of platforms) {
            const result = await pool.query(`
                INSERT INTO platforms (name, slug, logo, rating, type, payout_speed, bonus, description, strengths, considerations, markets, payments, security, support, features, affiliate_url, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id
            `, [
                platform.name,
                platform.slug,
                platform.logo,
                platform.rating,
                platform.type,
                platform.payout_speed,
                platform.bonus,
                platform.description,
                platform.strengths,
                platform.considerations,
                platform.markets,
                platform.payments,
                platform.security,
                platform.support,
                JSON.stringify(platform.features),
                platform.affiliate_url,
                platform.status
            ]);
            platformIds[platform.slug] = result.rows[0].id;
        }

        console.log(`✅ ${platforms.length} platforms created\n`);

        // ============================================
        // STEP 4: Seed Guides with Rich Content
        // ============================================
        console.log('📚 Seeding guides with rich content...');

        const guides = [
            {
                title: 'Complete Beginner\'s Guide to Online Betting',
                slug: 'beginners-guide-to-online-betting',
                category: 'Beginners',
                excerpt: 'Learn everything you need to know about online betting, from choosing platforms to placing your first bet.',
                content: `<h2>Welcome to Online Betting</h2>
<p>Online betting has revolutionized how we enjoy sports and casino games. This comprehensive guide will walk you through everything you need to know to get started safely and responsibly.</p>

<h3>What is Online Betting?</h3>
<p>Online betting refers to placing wagers on <strong>sports events</strong>, <em>casino games</em>, or other outcomes through internet-based platforms. It offers convenience, variety, and often better odds than traditional betting.</p>

<h2>Getting Started</h2>
<ol>
<li><strong>Choose a reputable platform</strong> - Look for licensed operators with good reviews</li>
<li><strong>Create an account</strong> - Register with accurate information</li>
<li><strong>Verify your identity</strong> - Complete KYC requirements</li>
<li><strong>Make your first deposit</strong> - Start with an amount you can afford to lose</li>
<li><strong>Place your first bet</strong> - Start small and learn the ropes</li>
</ol>

<h3>Key Terms to Know</h3>
<ul>
<li><strong>Odds</strong> - The probability of an outcome, determines your potential payout</li>
<li><strong>Stake</strong> - The amount of money you bet</li>
<li><strong>Bankroll</strong> - Your total betting budget</li>
<li><strong>House Edge</strong> - The advantage the casino has over players</li>
</ul>

<blockquote>
<p>"The key to successful betting is discipline and proper bankroll management."</p>
</blockquote>

<h2>Responsible Gambling Tips</h2>
<p>Always remember that gambling should be <strong>entertainment</strong>, not a way to make money. Set limits, take breaks, and never chase losses.</p>`,
                read_time: '8 min read',
                status: 'published'
            },
            {
                title: 'Understanding Sports Betting Odds',
                slug: 'understanding-sports-betting-odds',
                category: 'Sports Betting',
                excerpt: 'Master the three main odds formats: American, Decimal, and Fractional odds explained simply.',
                content: `<h2>The Three Major Odds Formats</h2>
<p>Understanding odds is <strong>crucial</strong> for any sports bettor. Let's break down the three main formats used worldwide.</p>

<h3>1. Decimal Odds (European)</h3>
<p>The most straightforward format. Your potential return = <code>Stake × Odds</code></p>
<ul>
<li>Odds of 2.50 means a $100 bet returns $250 total</li>
<li>Your profit would be $150</li>
</ul>

<h3>2. American Odds (Moneyline)</h3>
<p>Shows how much you need to bet to win $100 (negative) or how much you win from $100 (positive).</p>
<ul>
<li><strong>-150:</strong> Bet $150 to win $100</li>
<li><strong>+200:</strong> Bet $100 to win $200</li>
</ul>

<h3>3. Fractional Odds (British)</h3>
<p>Expressed as fractions like 5/1 or 3/2.</p>
<ul>
<li><strong>5/1:</strong> Win $5 for every $1 bet</li>
<li><strong>3/2:</strong> Win $3 for every $2 bet</li>
</ul>

<h2>Converting Between Formats</h2>
<p>Here's a quick reference:</p>
<ul>
<li>Decimal 2.00 = American +100 = Fractional 1/1</li>
<li>Decimal 3.00 = American +200 = Fractional 2/1</li>
<li>Decimal 1.50 = American -200 = Fractional 1/2</li>
</ul>

<blockquote>Pro tip: Always compare odds across multiple bookmakers to get the best value!</blockquote>`,
                read_time: '6 min read',
                status: 'published'
            },
            {
                title: 'Crypto Casino Guide: Bitcoin Betting Explained',
                slug: 'crypto-casino-guide-bitcoin-betting',
                category: 'Crypto',
                excerpt: 'Everything you need to know about gambling with cryptocurrency - benefits, risks, and top platforms.',
                content: `<h2>Why Use Cryptocurrency for Gambling?</h2>
<p>Crypto gambling has exploded in popularity. Here's why many bettors prefer it:</p>

<h3>Benefits of Crypto Betting</h3>
<ul>
<li><strong>Anonymity</strong> - Less personal information required</li>
<li><strong>Fast Transactions</strong> - Deposits and withdrawals in minutes</li>
<li><strong>Lower Fees</strong> - No bank or payment processor fees</li>
<li><strong>Provably Fair</strong> - Verify game fairness yourself</li>
<li><strong>No Restrictions</strong> - Access from more countries</li>
</ul>

<h3>Supported Cryptocurrencies</h3>
<ol>
<li><strong>Bitcoin (BTC)</strong> - The original and most widely accepted</li>
<li><strong>Ethereum (ETH)</strong> - Fast with smart contract support</li>
<li><strong>Litecoin (LTC)</strong> - Quick confirmations</li>
<li><strong>Tether (USDT)</strong> - Stable value, no volatility</li>
<li><strong>Dogecoin (DOGE)</strong> - Low fees, fun community</li>
</ol>

<h2>Getting Started</h2>
<ol>
<li>Buy crypto from an exchange (Coinbase, Binance, etc.)</li>
<li>Transfer to your personal wallet</li>
<li>Send to the casino's deposit address</li>
<li>Start playing!</li>
</ol>

<blockquote>
<p>⚠️ Always use a VPN if needed and never bet more than you can afford to lose.</p>
</blockquote>`,
                read_time: '7 min read',
                status: 'published'
            },
            {
                title: 'Bankroll Management: The Key to Long-Term Success',
                slug: 'bankroll-management-guide',
                category: 'Strategy',
                excerpt: 'Learn proven strategies to manage your betting bankroll and avoid going broke.',
                content: `<h2>What is Bankroll Management?</h2>
<p>Bankroll management is the <strong>most important</strong> skill for any gambler. It's the practice of controlling how much you bet relative to your total gambling budget.</p>

<h3>The Golden Rules</h3>
<ol>
<li><strong>Never bet more than 5% of your bankroll</strong> on a single wager</li>
<li><strong>Set win and loss limits</strong> for each session</li>
<li><strong>Keep gambling money separate</strong> from living expenses</li>
<li><strong>Track all your bets</strong> in a spreadsheet</li>
</ol>

<h2>Staking Strategies</h2>

<h3>Flat Betting</h3>
<p>Bet the same amount on every wager. Simple and effective.</p>
<ul>
<li>Recommended: <strong>1-2% of bankroll</strong> per bet</li>
<li>Best for: Beginners and casual bettors</li>
</ul>

<h3>Percentage Betting</h3>
<p>Adjust bet size based on current bankroll.</p>
<ul>
<li>Winning streak = Larger bets</li>
<li>Losing streak = Smaller bets</li>
</ul>

<blockquote>
<p>"The goal isn't to win every bet, it's to make money over time while protecting your bankroll."</p>
</blockquote>`,
                read_time: '5 min read',
                status: 'published'
            }
        ];

        for (const guide of guides) {
            await pool.query(`
                INSERT INTO guides (title, slug, category, excerpt, content, read_time, status, author_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
            `, [
                guide.title,
                guide.slug,
                guide.category,
                guide.excerpt,
                guide.content,
                guide.read_time,
                guide.status
            ]);
        }

        console.log(`✅ ${guides.length} guides created\n`);

        // ============================================
        // STEP 5: Seed News
        // ============================================
        console.log('📰 Seeding news articles...');

        const news = [
            {
                title: 'Stake Launches New VIP Program with Enhanced Rewards',
                slug: 'stake-new-vip-program-2024',
                type: 'Platform News',
                content: `<h2>Major VIP Program Overhaul</h2>
<p><strong>Stake.com</strong> has unveiled significant changes to its VIP program, offering players enhanced rewards and new exclusive benefits.</p>

<h3>Key Changes Include:</h3>
<ul>
<li><strong>Higher Rakeback</strong> - Up to 15% for top-tier VIPs</li>
<li><strong>Weekly Bonuses</strong> - Increased bonus percentages</li>
<li><strong>Dedicated Support</strong> - Personal VIP hosts</li>
<li><strong>Exclusive Events</strong> - Real-world invitations</li>
</ul>

<p>The new program takes effect immediately for all existing VIP members.</p>`,
                status: 'published',
                platform_slug: 'stake'
            },
            {
                title: 'BC.Game Adds 500 New Slot Games',
                slug: 'bc-game-500-new-slots',
                type: 'Game Releases',
                content: `<h2>Massive Game Library Expansion</h2>
<p><strong>BC.Game</strong> has added an impressive 500 new slot games from leading providers.</p>

<h3>New Providers Added:</h3>
<ol>
<li><strong>Pragmatic Play</strong> - 150 games</li>
<li><strong>NetEnt</strong> - 100 games</li>
<li><strong>Play'n GO</strong> - 120 games</li>
<li><strong>Hacksaw Gaming</strong> - 80 games</li>
<li><strong>Push Gaming</strong> - 50 games</li>
</ol>

<p>All games are available now in both demo mode and real money play.</p>`,
                status: 'published',
                platform_slug: 'bc-game'
            },
            {
                title: 'Cryptocurrency Gambling Reaches Record High in 2024',
                slug: 'crypto-gambling-record-2024',
                type: 'Industry',
                content: `<h2>Explosive Growth in Crypto Gambling</h2>
<p>According to a new industry report, <strong>cryptocurrency gambling</strong> has reached unprecedented levels in 2024.</p>

<h3>Key Statistics</h3>
<ul>
<li><strong>$50 Billion+</strong> wagered in crypto this year</li>
<li><strong>Bitcoin</strong> remains most popular (45%)</li>
<li><strong>Ethereum</strong> growing rapidly (30%)</li>
<li><strong>Stablecoins</strong> gaining traction (20%)</li>
</ul>

<p><em>Experts predict continued growth as more casinos adopt cryptocurrency.</em></p>`,
                status: 'published',
                platform_slug: null
            }
        ];

        for (const item of news) {
            const platform_id = item.platform_slug ? platformIds[item.platform_slug] : null;
            await pool.query(`
                INSERT INTO news (title, slug, type, content, status, platform_id, author_id)
                VALUES ($1, $2, $3, $4, $5, $6, 1)
            `, [
                item.title,
                item.slug,
                item.type,
                item.content,
                item.status,
                platform_id
            ]);
        }

        console.log(`✅ ${news.length} news articles created\n`);

        // ============================================
        // STEP 6: Seed Top Lists
        // ============================================
        console.log('🏆 Seeding top lists...');

        const topLists = [
            { title: 'Best Crypto Casinos 2024', slug: 'best-crypto-casinos-2024', description: 'Our top picks for cryptocurrency gambling', status: 'published' },
            { title: 'Top Sportsbooks for Football', slug: 'top-sportsbooks-football', description: 'The best platforms for football betting', status: 'published' },
            { title: 'Best Welcome Bonuses', slug: 'best-welcome-bonuses', description: 'Platforms with the most generous sign-up offers', status: 'published' },
        ];

        for (const list of topLists) {
            await pool.query(`
                INSERT INTO top_lists (title, slug, description, status)
                VALUES ($1, $2, $3, $4)
            `, [list.title, list.slug, list.description, list.status]);
        }

        console.log(`✅ ${topLists.length} top lists created\n`);

        // ============================================
        // STEP 7: Seed Pages
        // ============================================
        console.log('📄 Seeding pages...');

        const pages = [
            {
                title: 'Privacy Policy',
                slug: 'privacy-policy',
                content: '<h1>Privacy Policy</h1><p>Your privacy is important to us.</p><h2>Data Collection</h2><p>We collect information you provide directly when creating an account.</p>',
                status: 'published'
            },
            {
                title: 'Cookie Policy',
                slug: 'cookie-policy',
                content: '<h1>Cookie Policy</h1><p>This website uses cookies to enhance your experience.</p><h2>Types of Cookies</h2><ul><li><strong>Essential</strong> - Required for site functionality</li><li><strong>Functional</strong> - Remember your preferences</li></ul>',
                status: 'published'
            },
            {
                title: 'Terms of Service',
                slug: 'terms',
                content: '<h1>Terms of Service</h1><p>By using our website, you agree to these terms.</p>',
                status: 'published'
            },
            {
                title: 'About Us',
                slug: 'about',
                content: '<h1>About stakegulf</h1><p>We are a team of gambling enthusiasts providing honest reviews of online betting platforms.</p>',
                status: 'published'
            }
        ];

        for (const page of pages) {
            await pool.query(`
                INSERT INTO pages (title, slug, content, status)
                VALUES ($1, $2, $3, $4)
            `, [page.title, page.slug, page.content, page.status]);
        }

        console.log(`✅ ${pages.length} pages created\n`);

        // ============================================
        // Done!
        // ============================================
        console.log('='.repeat(50));
        console.log('🎉 Database cleanup and seeding completed!');
        console.log('='.repeat(50));
        console.log('\nSummary:');
        console.log(`  • ${platforms.length} Platforms`);
        console.log(`  • ${guides.length} Guides (with rich HTML)`);
        console.log(`  • ${news.length} News Articles`);
        console.log(`  • ${topLists.length} Top Lists`);
        console.log(`  • ${pages.length} Pages`);
        console.log(`  • Site Font: Poppins`);
        console.log('\n✅ All done!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanAndSeedDatabase();
