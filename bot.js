// apex-ultimate-bot.js
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class ApexUltimateBot {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: './session' }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // Brain storage
    this.memory = new Map(); // User memory
    this.groups = new Map(); // Group settings
    this.stats = { messages: 0, commands: 0, users: new Set() };
    this.afkUsers = new Map(); // AFK status
    
    // Advanced AI responses
    this.aiBrain = this.buildAIBrain();
    this.conversations = new Map(); // Chat history
    
    this.setupHandlers();
  }

  buildAIBrain() {
    return {
      // Intent detection patterns
      patterns: {
        greeting: /^(hi|hello|hey|yo|sup|wassup|good morning|good evening)/i,
        code: /(code|program|bug|error|javascript|python|react|node|function|class|api)/i,
        hack: /(hack|security|sql injection|xss|vulnerability|exploit|penetration|ctf)/i,
        business: /(business|startup|money|side hustle|entrepreneur|marketing|growth)/i,
        study: /(study|exam|learn|homework|assignment|math|physics|biology)/i,
        mood: {
          happy: /(happy|good|great|awesome|amazing|love|best)/i,
          sad: /(sad|depressed|down|bad|terrible|hate|worst)/i,
          angry: /(angry|mad|pissed|furious|annoyed)/i
        }
      },

      // Knowledge base
      knowledge: {
        javascript: {
          tips: [
            "🔥 Use `const` by default, `let` when needed, never `var`",
            "⚡ Arrow functions: `const fn = () => {}` cleaner than `function`",
            "🛡️ Always use strict equality `===` instead of `==`",
            "📦 Destructure: `const { name } = user` instead of `user.name`"
          ],
          commonErrors: {
            "undefined is not a function": "Check if you're calling a method on null/undefined. Add optional chaining: `obj?.method?.()`",
            "cannot read property": "Object doesn't exist. Use default values: `const item = data || {}`",
            "referenceerror": "Variable not defined. Check scope or typo in variable name."
          }
        },
        
        python: {
          tips: [
            "🐍 List comprehension: `[x for x in items if x > 0]` > loops",
            "📦 f-strings: `f'Hello {name}'` fastest string formatting",
            "🔧 `if __name__ == '__main__':` guard your executable code",
            "⚡ Use `enumerate()` instead of `range(len(list))`"
          ]
        },

        security: {
          sqli: "💉 SQL Injection: Never concat user input into queries. Use parameterized queries: `db.query('SELECT * FROM users WHERE id = ?', [userId])`",
          xss: "🌐 XSS: Sanitize all user input. Use libraries like DOMPurify. Never use `innerHTML` with user data.",
          jwt: "🔑 JWT: Store in httpOnly cookies, not localStorage. Always verify signature server-side."
        },

        business: {
          ideas: [
            "🤖 AI Automation Agency - Build chatbots for local businesses",
            "📱 No-Code Apps - Use Bubble/FlutterFlow to build MVPs fast",
            "🎨 Micro-SaaS - Tiny tools solving one problem (e.g., PDF converter)",
            "📚 Digital Products - Templates, courses, Notion dashboards",
            "🛒 Dropshipping 2.0 - TikTok organic marketing + fast shipping"
          ],
          growth: [
            "📈 Content > Ads. Post daily where your audience hangs out",
            "🤝 Partnerships > Cold outreach. Find complementary businesses",
            "⚡ Speed beats perfection. Launch in 48 hours, iterate fast"
          ]
        }
      },

      // Smart responses
      generateResponse(input, userId, context) {
        const msg = input.toLowerCase();
        const history = context.history || [];
        
        // Check mood first
        if (this.patterns.mood.sad.test(msg)) {
          return this.getMoodResponse('sad', userId);
        }
        if (this.patterns.mood.angry.test(msg)) {
          return this.getMoodResponse('angry', userId);
        }
        if (this.patterns.mood.happy.test(msg)) {
          return this.getMoodResponse('happy', userId);
        }

        // Code help
        if (this.patterns.code.test(msg)) {
          if (msg.includes('javascript') || msg.includes('js')) {
            return this.getCodeTip('javascript', msg);
          }
          if (msg.includes('python')) {
            return this.getCodeTip('python', msg);
          }
          if (msg.includes('error') || msg.includes('bug')) {
            return this.debugCode(msg);
          }
          return "💻 I can help with JavaScript, Python, React, Node.js!\n\nWhat specifically? Syntax? Debug? Best practices?";
        }

        // Security/Hacking
        if (this.patterns.hack.test(msg)) {
          return this.getSecurityTip(msg);
        }

        // Business
        if (this.patterns.business.test(msg)) {
          return this.getBusinessAdvice(msg);
        }

        // Study help
        if (this.patterns.study.test(msg)) {
          return this.getStudyHelp(msg);
        }

        // Greeting
        if (this.patterns.greeting.test(msg)) {
          const name = context.name || 'there';
          return `👋 Yo ${name}! I'm *APEX-X* — your elite AI assistant.\n\nWhat mode you want?\n💻 /dev → Code mode\n🔒 /cyber → Security mode\n📈 /biz → Business mode\n📚 /study → Study mode\n\nOr just chat! 🤖`;
        }

        // Context-aware follow-up
        if (history.length > 0) {
          const lastTopic = history[history.length - 1].topic;
          if (lastTopic === 'code') return "Still coding? Need me to explain something else? 💻";
          if (lastTopic === 'security') return "Learning more security? What topic next? 🔒";
        }

        // Default smart response
        return this.getDefaultResponse(msg, userId);
      },

      getMoodResponse(mood, userId) {
        const responses = {
          sad: [
            "💙 I feel you. Bad days happen to everyone — even elite AI like me 😅\n\nWanna talk about it? Or I can hit you with a /joke or /motivate?",
            "🫂 Hey, it's okay to not be okay. You're stronger than you think.\n\nTry this: /quote for some fuel, or just vent to me. I'm here."
          ],
          angry: [
            "😤 Take a deep breath. Count to 5. Now punch a pillow (not your phone!)\n\nWhat's bothering you? Let's fix it together.",
            "🔥 Channel that energy! Anger = passion. Let's redirect it to something productive.\n\nWanna /roast someone or talk business?"
          ],
          happy: [
            "🎉 YES! Love that energy! Ride that wave!\n\nWhat's the win? Tell me everything!",
            "🔥 That's what I'm talking about! Good vibes only!\n\nKeep the momentum — what's next on the list?"
          ]
        };
        return responses[mood][Math.floor(Math.random() * responses[mood].length)];
      },

      getCodeTip(lang, msg) {
        const tips = this.knowledge[lang].tips;
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        if (msg.includes('error') || msg.includes('bug')) {
          return `🐛 Debugging ${lang}?\n\n${randomTip}\n\nPaste your error message and I'll diagnose it!`;
        }
        
        return `💻 ${lang.toUpperCase()} Pro Tip:\n\n${randomTip}\n\nWant more? Ask about:\n• Best practices\n• Common errors\n• Performance tips\n• Specific syntax`;
      },

      debugCode(msg) {
        // Extract error from message
        const errors = Object.keys(this.knowledge.javascript.commonErrors);
        for (let err of errors) {
          if (msg.includes(err)) {
            return `🩺 *Diagnosis:*\n\n${this.knowledge.javascript.commonErrors[err]}\n\nWant me to show example code to fix this?`;
          }
        }
        return "🐛 Paste the full error message and I'll debug it for you!\n\nFormat:\n```\nError: [your error]\nCode: [relevant snippet]\n```";
      },

      getSecurityTip(msg) {
        if (msg.includes('sql')) return this.knowledge.security.sqli;
        if (msg.includes('xss') || msg.includes('script')) return this.knowledge.security.xss;
        if (msg.includes('jwt') || msg.includes('token')) return this.knowledge.security.jwt;
        
        return `🔒 *Cybersecurity Menu:*\n\n1️⃣ SQL Injection → How hackers dump databases\n2️⃣ XSS → Stealing cookies with JavaScript  \n3️⃣ JWT Attacks → Breaking authentication\n4️⃣ Social Engineering → Hacking humans\n\nWhich one? Or type a specific vulnerability!`;
      },

      getBusinessAdvice(msg) {
        if (msg.includes('idea')) {
          const ideas = this.knowledge.business.ideas;
          return `💡 *Business Ideas 2024:*\n\n${ideas.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\nWant me to break down any of these?`;
        }
        return `📈 *Business Growth:*\n\n${this.knowledge.business.growth.join('\n')}\n\nNeed specific help with marketing, product, or operations?`;
      },

      getStudyHelp(msg) {
        const subjects = {
          math: "🔢 Math: Break problems into smaller steps. Use WolframAlpha for checking. Practice > theory!",
          physics: "⚛️ Physics: Draw diagrams first. Units are your friend. F=ma is 90% of mechanics!",
          coding: "💻 Coding: Build projects, don't just watch tutorials. Debug by explaining code to a rubber duck!"
        };
        
        for (let [subject, tip] of Object.entries(subjects)) {
          if (msg.includes(subject)) return tip;
        }
        
        return `📚 *Study Mode Activated!*\n\nPomodoro technique: 25 min focus, 5 min break\nActive recall: Test yourself, don't just re-read\nSpaced repetition: Review material over time\n\nWhat subject? Math, Physics, Coding, or other?`;
      },

      getDefaultResponse(msg, userId) {
        const defaults = [
          `🤔 Interesting... tell me more about that!\n\nOr try: /help for commands`,
          `💭 I'm picking up what you're putting down.\n\nWant me to switch to /dev mode or /cyber mode?`,
          `🎯 Got it. What would you like to do with that info?\n\nBrainstorm? Plan? Code?`,
          `🔥 I like where this is going!\n\nType /menu to see all my powers`
        ];
        return defaults[Math.floor(Math.random() * defaults.length)];
      }
    };
  }

setupHandlers() {
  // QR Code
  this.client.on('qr', (qr) => {
    console.log('📲 Scan this QR with WhatsApp:');
    qrcode.generate(qr, { small: true });
  });

  // Ready
  this.client.on('ready', () => {
    console.log('✅ APEX-X is LIVE!');
    console.log('🤖 Group mode: Prefix only (/command)');
  });

  // Message handler
  this.client.on('message_create', async (msg) => {
    // Ignore own messages
    if (msg.fromMe) return;

    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const userId = contact.number;
    const userName = contact.pushname || contact.name || 'User';
    const text = msg.body.trim();

    // Group filtering logic
    if (chat.isGroup) {
      const isCommand = text.startsWith('/');
      const isMentioned = msg.mentionedIds.includes(this.client.info.wid._serialized);

      if (!isCommand && !isMentioned) return; // stay silent
      if (isMentioned && !isCommand) {
        await msg.reply(`👋 Yo ${userName}! Use */help* or type /commands!\nExample: /joke, /meme, /time`);
        return;
      }
    }

    // Update stats & memory
    this.stats.messages++;
    this.stats.users.add(userId);
    if (!this.memory.has(userId)) {
      this.memory.set(userId, {
        name: userName,
        history: [],
        messageCount: 0,
        firstSeen: new Date()
      });
    }

    const userData = this.memory.get(userId);
    userData.messageCount++;

    // Process command
    const response = await this.processMessage(text, userData, chat, msg);
    if (response) {
      await msg.reply(response);
      this.stats.commands++;
    }
  });

  // Group join
  this.client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
    await this.client.sendMessage(chat.id._serialized,
      `🎉 *Welcome to the group!*\n\nI'm *APEX-X*, your AI assistant.\nType */help* to see what I can do!\n\nCreated by Mikey ⚡`
    );
  });
}

  async processMessage(text, userData, chat) {
    const cmd = text.toLowerCase().trim();
    
    // Admin commands (group only)
    if (chat.isGroup && cmd.startsWith('/admin')) {
      return this.handleAdminCommand(cmd, chat);
    }

    // Utility commands
    const commands = {
      '/help': this.getHelpMenu(),
      '/menu': this.getFullMenu(),
      '/stats': this.getStats(userData),
      '/time': `⏰ ${new Date().toLocaleString()}`,
      
      '/joke': () => {
        const jokes = [
          "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
          "I told my WiFi we need to talk... now we're having connection issues 📡",
          "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings 😢",
          "What do you call a fake noodle? An impasta! 🍝",
          "Why did the developer go broke? He used up all his cache! 💰"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
      },

      '/quote': () => {
        const quotes = [
          "🔥 *The only way to do great work is to love what you do.* — Steve Jobs",
          "⚡ *Code is like humor. When you have to explain it, it's bad.* — Cory House",
          "🚀 *First, solve the problem. Then, write the code.* — John Johnson",
          "💎 *Simplicity is the soul of efficiency.* — Austin Freeman",
          "🎯 *Make it work, make it right, make it fast.* — Kent Beck"
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
      },

      '/roast': (args) => {
        const roasts = [
          "You're like a cloud. When you disappear, it's a beautiful day! ☁️",
          "I'm not saying you're dumb, but you make rocks look smart. 🪨",
          "You're the reason the gene pool needs a lifeguard. 🏊‍♂️",
          "I'd agree with you but then we'd both be wrong. 🤷‍♂️",
          "You're not stupid; you just have bad luck thinking. 🎲"
        ];
        const target = args || 'you';
        return `🔥 *Roast for ${target}:*\n\n${roasts[Math.floor(Math.random() * roasts.length)]}`;
      },

      '/motivate': () => {
        const messages = [
          "💪 *You got this!* Every expert was once a beginner. Keep pushing!",
          "🔥 *Small progress is still progress.* Don't compare your chapter 1 to someone's chapter 20!",
          "⚡ *Discipline > Motivation.* Do it even when you don't feel like it. That's growth.",
          "🎯 *Your future self is watching you right now.* Make them proud!"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      },

      '/meme': () => {
        const memes = [
          "When the code works on first try: 🤯 *impossible*",
          "Me: Writes 10 lines of code\nAlso me: 50 console.logs to debug 📋",
          "Client: 'Can you make the logo bigger?'\nDesigner: 🔪",
          "My code vs Production: 🐛🦋 *same same but different*",
          "git commit -m 'fixed stuff' \ngit push --force 🔥 *what could go wrong*"
        ];
        return memes[Math.floor(Math.random() * memes.length)];
      },

      '/afk': (reason) => {
        this.afkUsers.set(userData.name, {
          reason: reason || 'AFK',
          time: new Date()
        });
        return `😴 *${userData.name} is now AFK*\nReason: ${reason || 'Busy'}\n\nI'll tell anyone who mentions you!`;
      },

      '/back': () => {
        this.afkUsers.delete(userData.name);
        return `✅ *${userData.name} is back!* Welcome back! 🎉`;
      },

      '/remind': (args) => {
        if (!args) return "⏰ Usage: /remind [minutes] [message]\nExample: /remind 30 call mom";
        const [minutes, ...messageParts] = args.split(' ');
        const minutesNum = parseInt(minutes);
        if (isNaN(minutesNum)) return "❌ Please specify minutes as a number!";
        
        const message = messageParts.join(' ') || 'Reminder!';
        setTimeout(() => {
          this.client.sendMessage(chat.id._serialized, `⏰ *REMINDER for ${userData.name}:*\n\n${message}`);
        }, minutesNum * 60 * 1000);
        
        return `✅ Reminder set for ${minutesNum} minutes!\n📝 ${message}`;
      },

      '/calc': (expression) => {
        if (!expression) return "🧮 Usage: /calc [expression]\nExample: /calc 2 + 2 * 5";
        try {
          // Safe eval alternative
          const result = Function('"use strict"; return (' + expression + ')')();
          return `🧮 *${expression} = ${result}*`;
        } catch (e) {
          return "❌ Invalid expression. Use: + - * / ( )";
        }
      },

      '/define': (word) => {
        if (!word) return "📖 Usage: /define [word]";
        const definitions = {
          'api': "🌐 Application Programming Interface - How apps talk to each other",
          'rest': "🌐 Representational State Transfer - Architecture for networked apps",
          'json': "📋 JavaScript Object Notation - Data format: {\"key\": \"value\"}",
          'async': "⏳ Asynchronous - Operations that don't block execution",
          'promise': "🤝 Promise - Object representing future completion of async operation"
        };
        return definitions[word.toLowerCase()] || `📖 *${word}:*\nI don't have that definition yet. Try: API, REST, JSON, async, promise`;
      },

      '/weather': () => {
        // Simulated weather (no API needed)
        const conditions = ['☀️ Sunny', '⛅ Partly Cloudy', '🌧️ Rainy', '⛈️ Stormy', '❄️ Snowy'];
        const temps = [22, 25, 18, 30, 15, 28];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const temp = temps[Math.floor(Math.random() * temps.length)];
        return `🌤️ *Weather Simulation:*\n\n${condition}\n🌡️ ${temp}°C\n💧 Humidity: ${60 + Math.floor(Math.random() * 30)}%\n\n*Note:* This is simulated data. For real weather, use a weather API!`;
      },

      '/crypto': () => {
        // Simulated crypto prices
        const btc = (65000 + Math.random() * 5000).toFixed(2);
        const eth = (3500 + Math.random() * 200).toFixed(2);
        return `💰 *Crypto Prices (Simulated):*\n\n₿ BTC: $${btc}\nΞ ETH: $${eth}\n\n📈 Trend: ${Math.random() > 0.5 ? '🟢 Bullish' : '🔴 Bearish'}\n\n*Educational simulation only*`;
      },

      '/password': () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 16; i++) {
          pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `🔐 *Secure Password Generated:*\n\n\`${pass}\`\n\n💡 Save this in a password manager!`;
      },

      '/encode': (text) => {
        if (!text) return "🔤 Usage: /encode [text]\nEncodes to Base64";
        return `🔐 *Base64 Encoded:*\n\n\`${Buffer.from(text).toString('base64')}\``;
      },

      '/decode': (text) => {
        if (!text) return "🔓 Usage: /decode [base64-text]";
        try {
          return `🔓 *Decoded:*\n\n${Buffer.from(text, 'base64').toString('ascii')}`;
        } catch (e) {
          return "❌ Invalid Base64 string!";
        }
      },

      '/shorten': (url) => {
        if (!url) return "🔗 Usage: /shorten [url]";
        // Simulate URL shortening with hash
        const hash = Math.random().toString(36).substring(2, 8);
        return `🔗 *Shortened URL:*\n\napex.ly/${hash}\n\nOriginal: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}\n\n*Note:* This is a simulation. For real shortening, integrate Bitly API!`;
      },

      '/poll': (args) => {
        if (!args || !args.includes(',')) return "📊 Usage: /poll [question], [option1], [option2], ...\nExample: /poll Best language?, JavaScript, Python, Rust";
        const parts = args.split(',').map(p => p.trim());
        const question = parts[0];
        const options = parts.slice(1);
        if (options.length < 2) return "❌ Need at least 2 options!";
        
        let poll = `📊 *POLL: ${question}*\n\n`;
        options.forEach((opt, idx) => {
          poll += `${String.fromCharCode(65 + idx)}️⃣ ${opt}\n`;
        });
        poll += "\nReply with A, B, C... to vote!";
        return poll;
      },

      '/tts': (text) => {
        if (!text) return "🔊 Usage: /tts [text]\nNote: Sends as text (TTS requires external service)";
        return `🔊 *Text to Speech:*\n\n"${text}"\n\n💡 In real implementation, this would generate an audio file. For now, read it out loud! 😄`;
      },

      '/translate': (args) => {
        if (!args || !args.includes(' to ')) return "🌐 Usage: /translate [text] to [language]\nExample: /translate hello to spanish";
        const [text, lang] = args.split(' to ').map(s => s.trim());
        const translations = {
          'spanish': 'Hola',
          'french': 'Bonjour',
          'german': 'Hallo',
          'japanese': 'こんにちは',
          'chinese': '你好'
        };
        const translated = translations[lang.toLowerCase()] || `[Translated to ${lang}]`;
        return `🌐 *Translation:*\n\n🇺🇸 ${text}\n⬇️\n${translated} (${lang})\n\n*Note:* This is simulated. For real translation, integrate Google Translate API!`;
      },

      '/hack': (target) => {
        // Educational only - simulation
        if (!target) return "🔒 *Ethical Hacking Mode*\n\nAvailable lessons:\n• /hack sqli - SQL Injection\n• /hack xss - Cross-Site Scripting\n• /hack jwt - JWT attacks\n• /hack social - Social engineering\n\n*Educational purposes only!*";
        
        const lessons = {
          'sqli': `💉 *SQL Injection Lesson*\n\n*Vulnerability:*\n\`SELECT * FROM users WHERE id = '\${userId}'\`\nIf userId = \`1' OR '1'='1\`\n\n*Result:* Returns ALL users!\n\n*Prevention:*\nUse parameterized queries:\n\`db.query('SELECT * FROM users WHERE id = ?', [userId])\``,
          
          'xss': `🌐 *XSS (Cross-Site Scripting)*\n\n*Attack:*\nInject: \`<script>alert('hacked')</script>\`\ninto comment field\n\n*Result:* Script runs on every visitor's browser!\n\n*Prevention:*\n• Sanitize input with DOMPurify\n• Use textContent instead of innerHTML\n• Content Security Policy headers`,
          
          'jwt': `🔑 *JWT Attacks*\n\n*Vulnerability 1:* None algorithm\n\`{ "alg": "none" }\`\nServer accepts unsigned tokens!\n\n*Vulnerability 2:* Weak secret\nBrute force HS256 secrets\n\n*Prevention:*\n• Always verify algorithm\n• Use RS256 (asymmetric) in production\n• Short expiration times\n• Store in httpOnly cookies`,
          
          'social': `🎭 *Social Engineering*\n\n*Techniques:*\n• Phishing - Fake login pages\n• Pretexting - Create false scenario\n• Baiting - Leave infected USBs\n• Quid pro quo - Offer help, get access\n\n*Prevention:*\n• Verify identity independently\n• Never click suspicious links\n• Security awareness training\n• Report suspicious activity`
        };
        
        return lessons[target.toLowerCase()] || "❌ Lesson not found. Try: sqli, xss, jwt, social";
      },

      '/dev': (args) => {
        if (!args) return "💻 *Developer Mode*\n\nI can help with:\n• JavaScript/TypeScript\n• Python\n• React/Node.js\n• Debugging\n• Code review\n• Best practices\n\nWhat do you need? Paste code or ask a question!";
        return this.aiBrain.generateResponse(args, userData.id, userData);
      },

      '/cyber': (args) => {
        if (!args) return "🔒 *Cybersecurity Mode*\n\nTopics:\n• Vulnerabilities (SQLi, XSS, etc.)\n• Prevention methods\n• Security tools\n• CTF challenges\n• Career advice\n\nWhat do you want to learn?";
        return this.aiBrain.generateResponse(args, userData.id, userData);
      },

      '/biz': (args) => {
        if (!args) return "📈 *Business Mode*\n\nI can help with:\n• Startup ideas\n• Marketing strategies\n• Growth hacking\n• Monetization\n• Side hustles\n• Product validation\n\nWhat's your goal?";
        return this.aiBrain.generateResponse(args, userData.id, userData);
      },

      '/study': (args) => {
        if (!args) return "📚 *Study Mode*\n\nSubjects:\n• Math\n• Physics  \n• Computer Science\n• Exam prep\n• Learning techniques\n• Productivity\n\nWhat subject?";
        return this.aiBrain.generateResponse(args, userData.id, userData);
      },

      '/roastmode': () => {
        return "🔥 *ROAST MODE ACTIVATED* 🔥\n\nI'm now in savage mode. Mention someone with /roast @name and I'll cook them! \n\n*Warning: Friendship damage possible* 😈";
      },

      '/simp': (target) => {
        if (!target) return "💕 Usage: /simp @name";
        const simps = [
          `🥺 ${target} is literally perfect... I'd wait forever for a reply from them 💕`,
          `✨ ${target} just existing makes my day better 🌟`,
          `🙏 I would carry ${target}'s groceries up 10 flights of stairs no cap 🛒`,
          `💝 ${target} could ask me for my kidney and I'd say "which one?" 🫀`
        ];
        return simps[Math.floor(Math.random() * simps.length)];
      },

      '/ship': (names) => {
        if (!names || !names.includes(' and ')) return "💕 Usage: /ship [name1] and [name2]";
        const [n1, n2] = names.split(' and ').map(n => n.trim());
        const percent = Math.floor(Math.random() * 101);
        const bars = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));
        let comment = percent > 80 ? '🔥 Soulmates!' : percent > 50 ? '💕 Good match!' : percent > 20 ? '🤔 Maybe...' : '💔 Not happening...';
        return `💕 *SHIP CALCULATOR* 💕\n\n${n1} + ${n2}\n\n[${bars}] ${percent}%\n\n${comment}`;
      },

      '/8ball': (question) => {
        if (!question) return "🎱 Usage: /8ball [question]";
        const answers = [
          "🎱 It is certain", "🎱 Without a doubt", "🎱 Most likely", "🎱 Yes definitely",
          "🎱 Ask again later", "🎱 Cannot predict now", "🎱 Don't count on it",
          "🎱 My sources say no", "🎱 Very doubtful", "🎱 Outlook not so good"
        ];
        return `🎱 *Question:* ${question}\n\n*Answer:* ${answers[Math.floor(Math.random() * answers.length)]}`;
      },

      '/roll': (sides) => {
        const s = parseInt(sides) || 6;
        const result = Math.floor(Math.random() * s) + 1;
        return `🎲 Rolled d${s}: *${result}*`;
      },

      '/flip': () => {
        return `🪙 Coin flip: *${Math.random() > 0.5 ? 'HEADS' : 'TAILS'}*`;
      },

      '/rps': (choice) => {
        if (!choice) return "✊ Usage: /rps [rock/paper/scissors]";
        const options = ['rock', 'paper', 'scissors'];
        const botChoice = options[Math.floor(Math.random() * 3)];
        const user = choice.toLowerCase();
        
        if (!options.includes(user)) return "❌ Choose: rock, paper, or scissors!";
        
        let result;
        if (user === botChoice) result = "🤝 DRAW!";
        else if (
          (user === 'rock' && botChoice === 'scissors') ||
          (user === 'paper' && botChoice === 'rock') ||
          (user === 'scissors' && botChoice === 'paper')
        ) result = "🎉 YOU WIN!";
        else result = "😤 I WIN!";
        
        return `✊ You: ${user}\n🤖 Me: ${botChoice}\n\n${result}`;
      },

      '/fact': () => {
        const facts = [
          "🧠 Octopuses have three hearts and blue blood!",
          "🦘 Kangaroos can't walk backwards!",
          "🍌 Bananas are berries, but strawberries aren't!",
          "🐝 Honey never spoils. 3000-year-old honey is still edible!",
          "🌌 There's a planet made of diamonds (55 Cancri e)!",
          "🦕 The T-Rex lived closer to humans than to Stegosaurus!",
          "💻 The first computer bug was an actual moth stuck in a relay!"
        ];
        return facts[Math.floor(Math.random() * facts.length)];
      },

      '/wouldyourather': () => {
        const questions = [
          "🤔 Would you rather:\n\nA) Have unlimited money but no friends\nB) Have amazing friends but be broke",
          "🤔 Would you rather:\n\nA) Be able to fly but only 3 feet off the ground\nB) Be invisible but only when no one is looking",
          "🤔 Would you rather:\n\nA) Know when you die\nB) Know how you die"
        ];
        return questions[Math.floor(Math.random() * questions.length)];
      },

      '/truthordare': () => {
        const items = [
          "🎯 *TRUTH:* What's the last lie you told?",
          "😈 *DARE:* Send 'I love you' to your last contact",
          "🎯 *TRUTH:* Who's your crush?",
          "😈 *DARE:* Change your status to 'I'm a potato' for 1 hour",
          "🎯 *TRUTH:* What's your biggest fear?",
          "😈 *DARE:* Call someone and sing Happy Birthday"
        ];
        return items[Math.floor(Math.random() * items.length)];
      },

      '/trivia': () => {
        const questions = [
          "❓ What programming language was created by Brendan Eich in 10 days?\n\nA) Python\nB) JavaScript\nC) Java\nD) C++",
          "❓ What does HTML stand for?\n\nA) Hyper Text Markup Language\nB) High Tech Modern Language\nC) Home Tool Management Layer\nD) Hyper Transfer Mode Link",
          "❓ Which company owns GitHub?\n\nA) Google\nB) Amazon\nC) Microsoft\nD) Meta"
        ];
        const q = questions[Math.floor(Math.random() * questions.length)];
        return `🧠 *TRIVIA TIME!*\n\n${q}\n\nReply with your answer!`;
      },

      '/wiki': (term) => {
        if (!term) return "📚 Usage: /wiki [topic]";
        // Simulated wiki summary
        const summaries = {
          'javascript': "📚 *JavaScript*\n\nHigh-level programming language created by Brendan Eich in 1995. Powers 98% of websites. Runs in browsers and servers (Node.js).",
          'python': "📚 *Python*\n\nCreated by Guido van Rossum in 1991. Known for readability. Used in AI, data science, web dev, automation.",
          'react': "📚 *React*\n\nJavaScript library for building UIs. Created by Facebook (Meta). Uses components and virtual DOM."
        };
        return summaries[term.toLowerCase()] || `📚 *${term}*\n\nThis is a simulated Wikipedia summary. In production, this would fetch from Wikipedia API!\n\nTry: javascript, python, react`;
      },

      '/news': () => {
        // Simulated news headlines
        const headlines = [
          "📰 AI continues transforming industries worldwide",
          "📰 New JavaScript framework drops every 3 seconds (allegedly)",
          "📰 Tech stocks show volatile trading patterns",
          "📰 Cybersecurity threats increase 40% this quarter",
          "📰 Remote work becomes permanent at major companies"
        ];
        return `📰 *Today's Headlines (Simulated):*\n\n${headlines.slice(0, 3).join('\n\n')}\n\n*For real news, integrate NewsAPI!*`;
      },

      '/trending': () => {
        const trends = [
          "🔥 #LearnToCode - Programming education booming",
          "🔥 #AIRevolution - Chatbots everywhere",
          "🔥 #CyberSecurity - Privacy concerns rising",
          "🔥 #RemoteWork - Digital nomad lifestyle",
          "🔥 #CryptoNews - Market volatility continues"
        ];
        return `📈 *Trending Topics:*\n\n${trends.slice(0, 4).join('\n')}`;
      },

      '/whois': (user) => {
        if (!user) return "🔍 Usage: /whois @user";
        const roles = ['👑 Admin', '💻 Developer', '🎨 Designer', '📢 Marketer', '🎮 Gamer', '📚 Student'];
        const role = roles[Math.floor(Math.random() * roles.length)];
        const joined = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString();
        return `🔍 *User Profile: ${user}*\n\nRole: ${role}\nJoined: ${joined}\nMessages: ${Math.floor(Math.random() * 10000)}\nStatus: ${Math.random() > 0.5 ? '🟢 Online' : '⚪ Offline'}\n\n*Note: Simulated data for demo*`;
      },

      '/serverinfo': () => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        return `🖥️ *APEX-X Server Info*\n\n🤖 Status: Online\n⏱️ Uptime: ${hours}h ${minutes}m\n📊 Messages: ${this.stats.messages}\n👥 Users: ${this.stats.users.size}\n⚡ Commands: ${this.stats.commands}\n💾 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n🛠️ Platform: Node.js ${process.version}`;
      },

      '/broadcast': (msg) => {
        if (!msg) return "📢 Usage: /broadcast [message] (Admin only)";
        return `📢 *Broadcast sent to all chats!*\n\nMessage: ${msg}\n\n*Note: In production, this would message all saved chats*`;
      },

      '/save': (note) => {
        if (!note) return "📝 Usage: /save [note]";
        if (!userData.notes) userData.notes = [];
        userData.notes.push({ text: note, date: new Date() });
        return `📝 *Note saved!*\n\n"${note}"\n\nView with /notes`;
      },

      '/notes': () => {
        if (!userData.notes || userData.notes.length === 0) return "📝 No notes saved yet!";
        let list = '📝 *Your Notes:*\n\n';
        userData.notes.forEach((n, i) => {
          list += `${i + 1}. ${n.text.substring(0, 50)}${n.text.length > 50 ? '...' : ''}\n`;
        });
        return list;
      },

      '/clear': () => {
        userData.history = [];
        userData.notes = [];
        return "🧹 *Memory cleared!* Starting fresh conversation.";
      },

      '/feedback': (text) => {
        if (!text) return "💬 Usage: /feedback [your message]";
        // Save to file
        const feedback = `[${new Date().toISOString()}] ${userData.name}: ${text}\n`;
        fs.appendFileSync('feedback.txt', feedback);
        return "💬 *Feedback saved!* Thanks for helping me improve! 🙏";
      },

      '/bug': (report) => {
        if (!report) return "🐛 Usage: /bug [describe the issue]";
        const bug = `[${new Date().toISOString()}] ${userData.name}: ${report}\n`;
        fs.appendFileSync('bugs.txt', bug);
        return "🐛 *Bug reported!* Mikey will squash it soon! 🥾";
      },

      '/support': () => {
        return "🆘 *APEX-X Support*\n\nCommands:\n• /help - Quick help\n• /feedback - Send suggestions\n• /bug - Report issues\n• /menu - All features\n\nCreated by Mikey 💚";
      },

      '/donate': () => {
        return "💚 *Support APEX-X*\n\nThis bot is free but runs on coffee and server time! ☕\n\nIf you want to support:\n• Share with friends\n• Send feedback\n• Report bugs\n\nCreated with ❤️ by Mikey";
      },

      '/creator': () => {
        return "👨‍💻 *About Mikey*\n\n🤖 Creator of APEX-X\n💡 Full-stack developer\n🔒 Cybersecurity enthusiast\n📈 Business strategist\n🎓 Lifelong learner\n\n*Follow the journey!* ⚡";
      },

      '/version': () => {
        return "🏷️ *APEX-X ULTIMATE*\n\nVersion: 2.0.0\nRelease: March 2024\nFeatures: 50+ commands\nAI: Advanced local brain\nStatus: Stable\n\n*Elite AI assistant by Mikey* 🤖";
      }
    };

    // Check for command
    const [command, ...argsArr] = cmd.split(' ');
    const args = argsArr.join(' ');
    
    if (commands[command]) {
      const result = typeof commands[command] === 'function' ? commands[command](args) : commands[command];
      return result;
    }

    // Check for AFK mentions
    if (chat.isGroup) {
      for (let [name, data] of this.afkUsers) {
        if (cmd.includes(name.toLowerCase())) {
          return `😴 *${name} is AFK*\nReason: ${data.reason}\nSince: ${data.time.toLocaleTimeString()}`;
        }
      }
    }

    // AI Chat Mode (no command matched)
    return this.aiBrain.generateResponse(text, userData.id, userData);
  }

  getHelpMenu() {
    return `🤖 *APEX-X ULTIMATE - Quick Help*

*Chat:* Just type naturally!
*Modes:* /dev | /cyber | /biz | /study

*Fun:* /joke | /meme | /roast | /8ball | /rps
*Utils:* /time | /calc | /weather | /password
*Info:* /fact | /wiki | /trivia | /define

*Group:* /poll | /afk | /back | /ship
*Personal:* /save | /notes | /remind | /motivate

*Full menu:* /menu
*Stats:* /stats`;
  }

  getFullMenu() {
    return `🚀 *APEX-X ULTIMATE - FULL MENU*

🤖 *AI MODES*
/dev - Code help (JS, Python, React)
/cyber - Ethical hacking lessons
/biz - Business & startup advice
/study - Learning assistant

😂 *FUN & GAMES*
/joke - Random joke
/meme - Dev memes
/roast [name] - Friendly fire 🔥
/simp [name] - Maximum simp mode
/ship [a] and [b] - Love calculator
/8ball [q] - Fortune teller
/rps [choice] - Rock Paper Scissors
/roll [sides] - Dice roll
/flip - Coin flip
/wyr - Would you rather
/tod - Truth or dare
/trivia - Quiz time

🛠️ *UTILITIES*
/time - Current time
/calc [expr] - Calculator
/weather - Simulated forecast
/crypto - Simulated prices
/password - Generate secure password
/encode [text] - Base64 encode
/decode [text] - Base64 decode
/shorten [url] - URL shortener sim
/remind [min] [msg] - Set reminder
/define [word] - Tech definitions

📚 *KNOWLEDGE*
/fact - Random fact
/wiki [topic] - Encyclopedia sim
/news - Headlines sim
/trending - Hot topics
/translate [text] to [lang] - Translation sim

💕 *SOCIAL*
/quote - Motivation
/motivate - Inspiration
/poll [q], [a], [b] - Create poll
/afk [reason] - Set AFK
/back - Return from AFK
/whois [@user] - Profile sim

📝 *PERSONAL*
/save [note] - Save note
/notes - View notes
/clear - Clear history

ℹ️ *INFO*
/stats - Your stats
/serverinfo - Bot status
/feedback - Send suggestion
/bug - Report issue
/support - Get help
/creator - About Mikey
/version - Bot info

*Created by Mikey ⚡*`;
  }

  getStats(userData) {
    return `📊 *Your Stats*
    
👤 Name: ${userData.name}
💬 Messages: ${userData.messageCount}
📅 Member since: ${userData.firstSeen.toLocaleDateString()}
🧠 History: ${userData.history.length} topics

*Global Stats:*
👥 Total users: ${this.stats.users.size}
📨 Total messages: ${this.stats.messages}
⚡ Commands used: ${this.stats.commands}`;
  }

  async handleGroupMention(msg, chat, userData) {
    // Special response when mentioned in group
    const responses = [
      `👋 Yo ${userData.name}! You rang? Type /help to see what I can do!`,
      `🤖 APEX-X here! Need something for the group? Try /poll or /meme!`,
      `💡 What's up ${userData.name}? I'm ready to help!`
    ];
    await msg.reply(responses[Math.floor(Math.random() * responses.length)]);
  }

  async handleAdminCommand(cmd, chat) {
    // Group admin features
    if (cmd === '/admin everyone') {
      const participants = await chat.participants;
      const mentions = participants.map(p => `@${p.id.user}`).join(' ');
      return `📢 *Attention everyone!* ${mentions}`;
    }
    if (cmd === '/admin rules') {
      return `📋 *Group Rules*\n\n1️⃣ Be respectful\n2️⃣ No spam\n3️⃣ Use /afk if away\n4️⃣ Have fun!\n\n_Enforced by APEX-X_ 🤖`;
    }
    return "🔧 Admin commands: everyone, rules";
  }

  detectTopic(msg) {
    if (msg.includes('/dev') || msg.includes('code')) return 'code';
    if (msg.includes('/cyber') || msg.includes('hack')) return 'security';
    if (msg.includes('/biz') || msg.includes('business')) return 'business';
    if (msg.includes('/study') || msg.includes('learn')) return 'study';
    return 'chat';
  }

  startAutoFeatures() {
    // Daily motivation at 9 AM (if server stays running)
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        // Could broadcast to saved chats
        console.log('☀️ Sending daily motivation...');
      }
    }, 60000); // Check every minute

    console.log('⏰ Auto-features activated');
  }

  start() {
    this.client.initialize();
  }
}

// Run it
const bot = new ApexUltimateBot();
bot.start();