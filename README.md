# ⚔️ Minecraft Tier List Discord Bot

A Discord bot for creating and voting on Minecraft item tier lists with your server members.

## Features

- 7 built-in presets: Ores, Biomes, Mobs, Weapons, Foods, Enchantments, Blocks
- S/A/B/C/D/F tier voting — one vote per user per item (changeable)
- Live vote counts and final results embeds
- All-time leaderboard across sessions
- Add/remove custom items
- Autocomplete for item names

## Setup

### 1. Create a Discord Bot
1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name
3. Go to **Bot** → click **Add Bot**
4. Enable **applications.commands** scope
5. Copy the **Token**

### 2. Invite the Bot
In **OAuth2 → URL Generator**, select:
- Scopes: `bot`, `applications.commands`
- Bot Permissions: `Send Messages`, `Embed Links`, `Read Message History`

Open the generated URL to invite the bot to your server.

### 3. Configure & Run
```bash
# Clone / copy this project
npm install

# Set up your token
cp .env.example .env
# Edit .env and paste your bot token

# Start the bot
node index.js
```

## Commands

| Command | Description |
|---|---|
| `/tierlist create <topic> [preset]` | Start a new tier list, optionally with a preset |
| `/tierlist vote <item> <tier>` | Rate an item S–F |
| `/tierlist results` | Show the final ranked embed |
| `/tierlist live` | See live vote counts (ephemeral) |
| `/tierlist add <item>` | Add a custom item |
| `/tierlist remove <item>` | Remove an item |
| `/tierlist reset` | Clear the current session |
| `/tierlist leaderboard` | All-time top 10 rated items |

## Presets

| Preset | Items |
|---|---|
| ⛏️ Ores | Diamond, Netherite, Gold, Iron, Emerald... |
| 🌍 Biomes | Mushroom Island, Cherry Grove, Jungle... |
| 👾 Mobs | Creeper, Enderman, Skeleton, Wither... |
| ⚔️ Weapons | Netherite Sword, Trident, Bow... |
| 🍎 Foods | Golden Apple, Steak, Cake... |
| ✨ Enchantments | Mending, Fortune III, Sharpness V... |
| 🧱 Blocks | Netherite Block, Obsidian, Beacon... |

## Data Storage

Sessions and leaderboard data are saved locally in `data/sessions.json` and `data/leaderboard.json`.  
For production, consider swapping `utils/storage.js` to use a database like SQLite or MongoDB.
