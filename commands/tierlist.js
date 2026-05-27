const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { getSessions, saveSession, deleteSession, updateLeaderboard } = require('../utils/storage');
const { TIER_ORDER, ITEM_PRESETS, buildResultsEmbed, buildCurrentVotesEmbed } = require('../utils/tierUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tierlist')
    .setDescription('Minecraft tier list commands')

    // CREATE
    .addSubcommand(sub => sub
      .setName('create')
      .setDescription('Create a new tier list session')
      .addStringOption(opt => opt
        .setName('topic')
        .setDescription('What are we ranking? (e.g. "Ores", "Biomes")')
        .setRequired(true))
      .addStringOption(opt => opt
        .setName('preset')
        .setDescription('Use a preset item list')
        .addChoices(
          { name: '⛏️ Ores', value: 'ores' },
          { name: '🌍 Biomes', value: 'biomes' },
          { name: '👾 Mobs', value: 'mobs' },
          { name: '⚔️ Weapons', value: 'weapons' },
          { name: '🍎 Foods', value: 'foods' },
          { name: '✨ Enchantments', value: 'enchants' },
          { name: '🧱 Blocks', value: 'blocks' },
        )))

    // VOTE
    .addSubcommand(sub => sub
      .setName('vote')
      .setDescription('Rate an item on the current tier list')
      .addStringOption(opt => opt
        .setName('item')
        .setDescription('Which item are you rating?')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(opt => opt
        .setName('tier')
        .setDescription('What tier?')
        .setRequired(true)
        .addChoices(
          { name: '🌟 S — Legendary', value: 'S' },
          { name: '🔥 A — Great',     value: 'A' },
          { name: '✅ B — Good',      value: 'B' },
          { name: '😐 C — Average',   value: 'C' },
          { name: '👎 D — Poor',      value: 'D' },
          { name: '💀 F — Terrible',  value: 'F' },
        )))

    // RESULTS
    .addSubcommand(sub => sub
      .setName('results')
      .setDescription('Show final tier list results'))

    // LIVE
    .addSubcommand(sub => sub
      .setName('live')
      .setDescription('Show current vote counts per item'))

    // ADD
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Add a custom item to the tier list')
      .addStringOption(opt => opt
        .setName('item')
        .setDescription('Item name to add')
        .setRequired(true)))

    // REMOVE
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Remove an item from the tier list')
      .addStringOption(opt => opt
        .setName('item')
        .setDescription('Item name to remove')
        .setRequired(true)
        .setAutocomplete(true)))

    // RESET
    .addSubcommand(sub => sub
      .setName('reset')
      .setDescription('Reset the current tier list session'))

    // LEADERBOARD
    .addSubcommand(sub => sub
      .setName('leaderboard')
      .setDescription('Show the all-time top-rated items')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const sessions = getSessions();
    const session = sessions[guildId];

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (sub === 'create') {
      const topic = interaction.options.getString('topic');
      const preset = interaction.options.getString('preset');

      const items = preset ? ITEM_PRESETS[preset] : [];
      const votes = {};
      for (const item of items) votes[item] = {};

      const newSession = { topic, items, votes, createdBy: interaction.user.id, createdAt: Date.now() };
      saveSession(guildId, newSession);

      const embed = new EmbedBuilder()
        .setTitle(`🎮 Tier List Created — ${topic}`)
        .setColor('#5865F2')
        .setDescription(
          items.length
            ? `**Items to rate (${items.length}):**\n${items.map(i => `• ${i}`).join('\n')}`
            : 'No items yet. Use `/tierlist add <item>` to add items.'
        )
        .addFields(
          { name: 'How to vote', value: '`/tierlist vote <item> <tier>`', inline: true },
          { name: 'See results', value: '`/tierlist results`', inline: true },
        )
        .setFooter({ text: `Created by ${interaction.user.username}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ── VOTE ─────────────────────────────────────────────────────────────────
    if (sub === 'vote') {
      if (!session) return interaction.reply({ content: '❌ No active tier list. Use `/tierlist create` first.', ephemeral: true });

      const item = interaction.options.getString('item');
      const tier = interaction.options.getString('tier');
      const userId = interaction.user.id;

      if (!session.votes[item]) {
        // Auto-add if not in list
        session.votes[item] = {};
        if (!session.items.includes(item)) session.items.push(item);
      }

      const prevTier = session.votes[item][userId];
      session.votes[item][userId] = tier;
      saveSession(guildId, session);

      const changed = prevTier ? ` *(changed from ${prevTier})*` : '';
      return interaction.reply({
        content: `✅ **${interaction.user.username}** rated **${item}** → **${tier} Tier**${changed}`,
      });
    }

    // ── RESULTS ───────────────────────────────────────────────────────────────
    if (sub === 'results') {
      if (!session) return interaction.reply({ content: '❌ No active tier list.', ephemeral: true });

      // Persist to leaderboard
      const finalVotes = {};
      for (const [item, votes] of Object.entries(session.votes)) {
        if (Object.keys(votes).length === 0) continue;
        const counts = {};
        for (const tier of TIER_ORDER) counts[tier] = 0;
        for (const v of Object.values(votes)) counts[v]++;
        let topTier = 'C', topCount = -1;
        for (const tier of TIER_ORDER) {
          if (counts[tier] > topCount) { topCount = counts[tier]; topTier = tier; }
        }
        finalVotes[item] = topTier;
      }
      updateLeaderboard(finalVotes);

      return interaction.reply({ embeds: [buildResultsEmbed(session)] });
    }

    // ── LIVE ──────────────────────────────────────────────────────────────────
    if (sub === 'live') {
      if (!session) return interaction.reply({ content: '❌ No active tier list.', ephemeral: true });
      return interaction.reply({ embeds: [buildCurrentVotesEmbed(session)], ephemeral: true });
    }

    // ── ADD ───────────────────────────────────────────────────────────────────
    if (sub === 'add') {
      if (!session) return interaction.reply({ content: '❌ No active tier list.', ephemeral: true });
      const item = interaction.options.getString('item').trim();
      if (session.votes[item]) return interaction.reply({ content: `⚠️ **${item}** is already in the list.`, ephemeral: true });
      session.votes[item] = {};
      session.items.push(item);
      saveSession(guildId, session);
      return interaction.reply({ content: `✅ Added **${item}** to the tier list.` });
    }

    // ── REMOVE ────────────────────────────────────────────────────────────────
    if (sub === 'remove') {
      if (!session) return interaction.reply({ content: '❌ No active tier list.', ephemeral: true });
      const item = interaction.options.getString('item').trim();
      if (!session.votes[item]) return interaction.reply({ content: `⚠️ **${item}** not found.`, ephemeral: true });
      delete session.votes[item];
      session.items = session.items.filter(i => i !== item);
      saveSession(guildId, session);
      return interaction.reply({ content: `🗑️ Removed **${item}** from the tier list.` });
    }

    // ── RESET ─────────────────────────────────────────────────────────────────
    if (sub === 'reset') {
      if (!session) return interaction.reply({ content: '❌ No active tier list.', ephemeral: true });
      deleteSession(guildId);
      return interaction.reply({ content: '🔄 Tier list reset. Use `/tierlist create` to start a new one.' });
    }

    // ── LEADERBOARD ───────────────────────────────────────────────────────────
    if (sub === 'leaderboard') {
      const { getLeaderboard } = require('../utils/storage');
      const lb = getLeaderboard();
      const tierScore = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
      const scoreNames = { 6: 'S', 5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F' };

      const ranked = Object.entries(lb)
        .map(([item, data]) => ({
          item,
          avg: data.votes ? (data.totalScore / data.votes) : 0,
          votes: data.votes,
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10);

      if (ranked.length === 0) {
        return interaction.reply({ content: '📊 No leaderboard data yet. Finish a tier list with `/tierlist results` first!', ephemeral: true });
      }

      const medals = ['🥇', '🥈', '🥉'];
      const description = ranked.map(({ item, avg, votes }, i) => {
        const approxTier = scoreNames[Math.round(avg)] || 'C';
        return `${medals[i] || `**${i + 1}.**`} **${item}** — avg **${approxTier} Tier** *(${votes} vote${votes !== 1 ? 's' : ''})*`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('🏆 All-Time Minecraft Tier List — Top 10')
        .setColor('#FFD700')
        .setDescription(description)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },

  async autocomplete(interaction) {
    const guildId = interaction.guildId;
    const sessions = getSessions();
    const session = sessions[guildId];
    const focused = interaction.options.getFocused().toLowerCase();

    if (!session) return interaction.respond([]);

    const choices = Object.keys(session.votes)
      .filter(i => i.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(i => ({ name: i, value: i }));

    return interaction.respond(choices);
  },
};
