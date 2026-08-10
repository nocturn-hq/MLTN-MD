const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const introMessage = `⛧═══════════════════⛧
   👑 *MLTN IS ARISING FROM SHADOWS* 👑
⛧═══════════════════⛧

   *${settings.botName || 'MLTN-MD'}*
   Rank: *${settings.version || '3.0.0'}*
   Monarch: ${settings.botOwner || 'MILITAN'}

⛧ The shadow gathers its strength... ⛧`;

    const fullMenuMessage = `⛧═══════════════════⛧
*The Shadow Army Answers Your Call:*
⛧═══════════════════⛧

⛧═══════════════════⛧
🌐 *General Arsenal*:
║ ➤ .help or .menu
║ ➤ .ping
║ ➤ .alive
║ ➤ .tts <text>
║ ➤ .owner
║ ➤ .joke
║ ➤ .quote
║ ➤ .fact
║ ➤ .weather <city>
║ ➤ .news
║ ➤ .attp <text>
║ ➤ .lyrics <song_title>
║ ➤ .8ball <question>
║ ➤ .groupinfo
║ ➤ .staff or .admins 
║ ➤ .vv
║ ➤ .trt <text> <lang>
║ ➤ .ss <link>
║ ➤ .jid
║ ➤ .url
⛧═══════════════════⛧ 

⛧═══════════════════⛧
👮‍♂️ *Commander's Authority*:
║ ➤ .ban @user
║ ➤ .promote @user
║ ➤ .demote @user
║ ➤ .mute <minutes>
║ ➤ .unmute
║ ➤ .delete or .del
║ ➤ .kick @user
║ ➤ .warnings @user
║ ➤ .warn @user
║ ➤ .antilink
║ ➤ .antibadword
║ ➤ .clear
║ ➤ .tag <message>
║ ➤ .tagall
║ ➤ .tagnotadmin
║ ➤ .hidetag <message>
║ ➤ .chatbot
║ ➤ .resetlink
║ ➤ .antitag <on/off>
║ ➤ .welcome <on/off>
║ ➤ .goodbye <on/off>
║ ➤ .setgdesc <description>
║ ➤ .setgname <new name>
║ ➤ .setgpp (reply to image)
⛧═══════════════════⛧

⛧═══════════════════⛧
🔒 *Monarch-Only Rites*:
║ ➤ .mode <public/private>
║ ➤ .clearsession
║ ➤ .antidelete
║ ➤ .cleartmp
║ ➤ .update
║ ➤ .settings
║ ➤ .setpp <reply to image>
║ ➤ .autoreact <on/off>
║ ➤ .autostatus <on/off>
║ ➤ .autostatus react <on/off>
║ ➤ .autotyping <on/off>
║ ➤ .autoread <on/off>
║ ➤ .anticall <on/off>
║ ➤ .pmblocker <on/off/status>
║ ➤ .pmblocker setmsg <text>
║ ➤ .setmention <reply to msg>
║ ➤ .mention <on/off>
⛧═══════════════════⛧

⛧═══════════════════⛧
🎨 *Sigil & Sticker Craft*:
║ ➤ .blur <image>
║ ➤ .simage <reply to sticker>
║ ➤ .sticker <reply to image>
║ ➤ .removebg
║ ➤ .remini
║ ➤ .crop <reply to image>
║ ➤ .tgsticker <Link>
║ ➤ .meme
║ ➤ .take <packname> 
║ ➤ .emojimix <emj1>+<emj2>
║ ➤ .igs <insta link>
║ ➤ .igsc <insta link>
⛧═══════════════════⛧  

⛧═══════════════════⛧
🖼️ *Vault of Pies*:
║ ➤ .pies <country>
║ ➤ .china 
║ ➤ .indonesia 
║ ➤ .japan 
║ ➤ .korea 
║ ➤ .hijab
⛧═══════════════════⛧

⛧═══════════════════⛧
🎮 *Trials & Games*:
║ ➤ .tictactoe @user
║ ➤ .hangman
║ ➤ .guess <letter>
║ ➤ .trivia
║ ➤ .answer <answer>
║ ➤ .truth
║ ➤ .dare
⛧═══════════════════⛧

⛧═══════════════════⛧
🤖 *Forbidden Intelligence*:
║ ➤ .gpt <question>
║ ➤ .gemini <question>
║ ➤ .imagine <prompt>
║ ➤ .flux <prompt>
║ ➤ .sora <prompt>
⛧═══════════════════⛧

⛧═══════════════════⛧
🎯 *Dark Amusements*:
║ ➤ .compliment @user
║ ➤ .insult @user
║ ➤ .flirt 
║ ➤ .shayari
║ ➤ .goodnight
║ ➤ .roseday
║ ➤ .character @user
║ ➤ .wasted @user
║ ➤ .ship @user
║ ➤ .simp @user
║ ➤ .stupid @user [text]
⛧═══════════════════⛧

⛧═══════════════════⛧
🔤 *Runeforge (Textmaker)*:
║ ➤ .metallic <text>
║ ➤ .ice <text>
║ ➤ .snow <text>
║ ➤ .impressive <text>
║ ➤ .matrix <text>
║ ➤ .light <text>
║ ➤ .neon <text>
║ ➤ .devil <text>
║ ➤ .purple <text>
║ ➤ .thunder <text>
║ ➤ .leaves <text>
║ ➤ .1917 <text>
║ ➤ .arena <text>
║ ➤ .hacker <text>
║ ➤ .sand <text>
║ ➤ .blackpink <text>
║ ➤ .glitch <text>
║ ➤ .fire <text>
⛧═══════════════════⛧

⛧═══════════════════⛧
📥 *Extraction Gates (Downloader)*:
║ ➤ .play <song_name>
║ ➤ .song <song_name>
║ ➤ .spotify <query>
║ ➤ .instagram <link>
║ ➤ .facebook <link>
║ ➤ .tiktok <link>
║ ➤ .video <song name>
║ ➤ .ytmp4 <Link>
⛧═══════════════════⛧

⛧═══════════════════⛧
🧩 *Relics & Oddities*:
║ ➤ .heart
║ ➤ .horny
║ ➤ .circle
║ ➤ .lgbt
║ ➤ .lolice
║ ➤ .its-so-stupid
║ ➤ .namecard 
║ ➤ .oogway
║ ➤ .tweet
║ ➤ .ytcomment 
║ ➤ .comrade 
║ ➤ .gay 
║ ➤ .glass 
║ ➤ .jail 
║ ➤ .passed 
║ ➤ .triggered
⛧═══════════════════⛧

⛧═══════════════════⛧
🖼️ *Shadow Familiars (Anime)*:
║ ➤ .nom 
║ ➤ .poke 
║ ➤ .cry 
║ ➤ .kiss 
║ ➤ .pat 
║ ➤ .hug 
║ ➤ .wink 
║ ➤ .facepalm 
⛧═══════════════════⛧

⛧═══════════════════⛧
💻 *Source Vault (Github)*:
║ ➤ .git
║ ➤ .github
║ ➤ .sc
║ ➤ .script
║ ➤ .repo
⛧═══════════════════⛧

⛧ The shadow army stands ready. Speak a command, and it will answer. ⛧`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.png');

        // Send the arrival announcement first
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: introMessage
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: introMessage }, { quoted: message });
        }

        // Wait 3 seconds, then send the full command list
        await new Promise((resolve) => setTimeout(resolve, 3000));

        await sock.sendMessage(chatId, { text: fullMenuMessage });

    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: '⛧ The shadow stumbled while summoning the menu. Try again.' });
    }
}

module.exports = helpCommand;