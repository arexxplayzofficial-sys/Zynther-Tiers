const { EmbedBuilder } = require('discord.js');

const TIER_CONFIG = {
  S: { emoji: '🌟', color: '#FFD700', label: 'S — Legendary' },
  A: { emoji: '🔥', color: '#7CFC00', label: 'A — Great' },
  B: { emoji: '✅', color: '#00BFFF', label: 'B — Good' },
  C: { emoji: '😐', color: '#BA55D3', label: 'C — Average' },
  D: { emoji: '👎', color: '#FF8C00', label: 'D — Poor' },
  F: { emoji: '💀', color: '#FF4444', label: 'F — Terrible' },
};

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', 'F'];

// Default Minecraft items by category
const ITEM_PRESETS = {
  ores:     ['Diamond', 'Netherite', 'Gold', 'Iron', 'Emerald', 'Copper', 'Coal', 'Lapis', 'Redstone', 'Quartz'],
  biomes:   ['Mushroom Island', 'Cherry Grove', 'Jungle', 'Desert', 'Taiga', 'Swamp', 'Savanna', 'Ocean', 'Plains', 'Nether Wastes'],
  mobs:     ['Creeper', 'Enderman', 'Skeleton', 'Zombie', 'Spider', 'Witch', 'Villager', 'Iron Golem', 'Wither', 'Ender Dragon'],
  weapons:  ['Netherite Sword', 'Diamond Sword', 'Trident', 'Bow', 'Crossbow', 'Axe', 'Shield', 'Totem of Undying'],
  foods:    ['Golden Apple', 'Steak', 'Bread', 'Carrot', 'Cake', 'Cookie', 'Pumpkin Pie', 'Mushroom Stew', 'Rotten Flesh', 'Spider Eye'],
  enchants: ['Mending', 'Fortune III', 'Silk Touch', 'Sharpness V', 'Protection IV', 'Efficiency V', 'Infinity', 'Looting III'],
  blocks:   ['Netherite Block', 'Obsidian', 'Beacon', 'Ancient Debris', 'Amethyst', 'Deepslate', 'Dirt', 'Gravel', 'Sand'],
};

function buildResultsEmbed(session) {
  const tiers = {};
  for (const tier of TIER_ORDER) tiers[tier] = [];

  for (const [item, votes] of Object.entries(session.votes)) {
    const counts = {};
    for (const tier of TIER_ORDER) counts[tier] = 0;
    for (const vote of Object.values(votes)) {
      if (counts[vote] !== undefined) counts[vote]++;
    }
    // Pick the majority tier; tie → higher tier wins
    let topTier = 'C', topCount = -1;
    for (const tier of TIER_ORDER) {
      if (counts[tier] > topCount) { topCount = counts[tier]; topTier = tier; }
    }
    tiers[topTier].push({ item, count: topCount });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎮 Minecraft Tier List — ${session.topic}`)
    .setColor('#5865F2')
    .setTimestamp()
    .setFooter({ text: `${Object.keys(session.votes).length} items · ${countVoters(session)} voters` });

  for (const tier of TIER_ORDER) {
    const cfg = TIER_CONFIG[tier];
    const items = tiers[tier];
    if (items.length === 0) continue;
    const value = items.map(({ item, count }) =>
      `${cfg.emoji} **${item}** *(${count} vote${count !== 1 ? 's' : ''})*`
    ).join('\n');
    embed.addFields({ name: cfg.label, value, inline: false });
  }

  if (embed.data.fields?.length === 0) {
    embed.setDescription('No votes yet! Use `/tierlist vote` to start rating items.');
  }

  return embed;
}

function buildCurrentVotesEmbed(session) {
  const voteCounts = {};
  for (const [item, votes] of Object.entries(session.votes)) {
    const counts = {};
    for (const tier of TIER_ORDER) counts[tier] = 0;
    for (const v of Object.values(votes)) counts[v]++;
    voteCounts[item] = counts;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📊 Live Votes — ${session.topic}`)
    .setColor('#5865F2')
    .setDescription(Object.keys(session.votes).map(item => {
      const c = voteCounts[item];
      const bar = TIER_ORDER.map(t => `${t}:${c[t]}`).join(' | ');
      return `**${item}** — ${bar}`;
    }).join('\n') || 'No votes yet.')
    .setTimestamp();
  return embed;
}

function countVoters(session) {
  const voters = new Set();
  for (const votes of Object.values(session.votes))
    for (const userId of Object.keys(votes)) voters.add(userId);
  return voters.size;
}

module.exports = { TIER_CONFIG, TIER_ORDER, ITEM_PRESETS, buildResultsEmbed, buildCurrentVotesEmbed };
