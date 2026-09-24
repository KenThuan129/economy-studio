import {
  EconomyProject,
  SimulationConfig,
  SimulationResult,
  TimeSeriesSnapshot,
  SimulationEvent,
  BotState,
  BotStepRecord,
  BotRunSummary,
  EconomyAlert,
  FlowNode,
  FlowEdge,
  ShopItem,
  BotPersonaType,
  LevelDifficultyKey,
  LevelDifficultyConfig,
} from '../types/economy';

export const DEFAULT_LEVEL_DIFFICULTIES: LevelDifficultyConfig[] = [
  { key: 'easy', label: 'Easy Stage', distributionRatio: 40, baseWinRate: 95, baseLossRate: 5, baseRewardCoins: 20 },
  { key: 'medium', label: 'Medium Stage', distributionRatio: 30, baseWinRate: 85, baseLossRate: 15, baseRewardCoins: 50 },
  { key: 'hard', label: 'Hard Stage', distributionRatio: 20, baseWinRate: 65, baseLossRate: 35, baseRewardCoins: 120 },
  { key: 'very_hard', label: 'Very Hard Stage', distributionRatio: 8, baseWinRate: 20, baseLossRate: 80, baseRewardCoins: 300 },
  { key: 'extreme', label: 'Extreme Stage', distributionRatio: 2, baseWinRate: 5, baseLossRate: 95, baseRewardCoins: 800 },
];

export function calculatePersonaWinRate(
  persona: BotPersonaType = 'balanced',
  difficultyKey: LevelDifficultyKey,
  baseWinRate: number
): number {
  switch (persona) {
    case 'casual':
      if (difficultyKey === 'easy') return 98;
      if (difficultyKey === 'medium') return 90;
      if (difficultyKey === 'hard') return 40; // higher chance of getting stuck
      if (difficultyKey === 'very_hard') return 5;
      if (difficultyKey === 'extreme') return 1;
      return Math.min(100, Math.max(0, baseWinRate - 15));

    case 'balanced':
      if (difficultyKey === 'easy') return 98;
      if (difficultyKey === 'medium') return 90;
      if (difficultyKey === 'hard') return 65;
      if (difficultyKey === 'very_hard') return 20;
      if (difficultyKey === 'extreme') return 5;
      return baseWinRate;

    case 'hardcore':
      if (difficultyKey === 'easy' || difficultyKey === 'medium' || difficultyKey === 'hard') return 100;
      if (difficultyKey === 'very_hard') return 60;
      if (difficultyKey === 'extreme') return 35;
      return Math.min(100, baseWinRate + 30);

    default:
      return baseWinRate;
  }
}

export class SimulationEngine {
  private project: EconomyProject;
  private config: SimulationConfig;
  private bots: BotState[] = [];
  private botTrajectories: Map<number, BotStepRecord[]> = new Map();
  private events: SimulationEvent[] = [];
  private currentTick = 0;
  private secondsPerTick = 10; // each simulation step is 10s of game time

  constructor(project: EconomyProject, config?: SimulationConfig) {
    this.project = project;
    this.config = config || project.simConfig;
  }

  public initBots(): void {
    const { numberOfBots } = this.config;
    const startNode = this.project.nodes.find((n) => n.data.type === 'START') || this.project.nodes[0];
    const startNodeId = startNode ? startNode.id : 'node_start';

    this.bots = [];
    this.botTrajectories = new Map();
    this.events = [];
    this.currentTick = 0;

    for (let i = 0; i < numberOfBots; i++) {
      const initialWallet: Record<string, number> = {};
      const initialEarned: Record<string, number> = {};
      const initialSpent: Record<string, number> = {};

      const lastRegenTimeSec: Record<string, number> = {};
      for (const curr of this.project.currencies) {
        initialWallet[curr.id] = curr.startingAmount;
        initialEarned[curr.id] = 0;
        initialSpent[curr.id] = 0;
        if (curr.regenIntervalMinutes && curr.regenIntervalMinutes > 0) {
          lastRegenTimeSec[curr.id] = 0;
        }
      }

      // Persona cohort distribution: 50% Casual, 35% Balanced, 15% Hardcore
      let persona: BotPersonaType = 'casual';
      const ratio = i / (numberOfBots || 1);
      if (ratio >= 0.50 && ratio < 0.85) {
        persona = 'balanced';
      } else if (ratio >= 0.85) {
        persona = 'hardcore';
      }

      const botId = i + 1;
      this.botTrajectories.set(botId, []);

      this.bots.push({
        id: botId,
        persona,
        currentWallet: initialWallet,
        level: 1,
        sessionMinutes: 0,
        activeBoosters: [],
        inventory: [],
        purchaseHistory: [],
        currentNodeId: startNodeId,
        isFinished: false,
        totalEarned: initialEarned,
        totalSpent: initialSpent,
        historyPath: [startNodeId],
        ticksLived: 0,
        isSoftLocked: false,
        lastRegenTimeSec,
        currentStreak: 0,
        streakStepTarget: 3,
        levelsCleared: 0,
        streakCyclesCompleted: 0,
      });
    }
  }

  public runFullSimulation(): SimulationResult {
    this.initBots();

    const maxTicks = Math.ceil((this.config.maxSessionMinutes * 60) / this.secondsPerTick);
    const timeSeries: TimeSeriesSnapshot[] = [];
    const nodeHeatmap: Record<string, { visits: number; uniqueBots: Set<number>; totalTicks: number }> = {};

    // Initialize node heatmap structures
    for (const node of this.project.nodes) {
      nodeHeatmap[node.id] = { visits: 0, uniqueBots: new Set<number>(), totalTicks: 0 };
    }

    // Record initial snapshot (Tick 0)
    timeSeries.push(this.createSnapshot(0));

    // Simulation loop
    for (let tick = 1; tick <= maxTicks; tick++) {
      this.currentTick = tick;
      let activeCount = 0;

      for (const bot of this.bots) {
        if (bot.isFinished) continue;

        activeCount++;
        bot.ticksLived++;
        bot.sessionMinutes = (bot.ticksLived * this.secondsPerTick) / 60;

        // Clean expired boosters
        const currentTimeSec = bot.ticksLived * this.secondsPerTick;
        bot.activeBoosters = bot.activeBoosters.filter((b) => b.expiresAtSec > currentTimeSec);

        // Passive Time-based Currency Regeneration (e.g. Lives regenerating every X minutes)
        this.applyPassiveRegeneration(bot);

        // Process current node
        this.processBotStep(bot, tick, nodeHeatmap);
      }

      // Record periodic snapshot (every 3 ticks or last tick)
      if (tick % 3 === 0 || tick === maxTicks || activeCount === 0) {
        timeSeries.push(this.createSnapshot(tick));
      }

      // Check Stop Conditions
      if (this.shouldStopSimulation(activeCount, tick, maxTicks)) {
        break;
      }
    }

    // Format final heatmap
    const formattedHeatmap: Record<string, { visits: number; uniqueBots: number; avgTimeSpentSec: number }> = {};
    for (const nodeId of Object.keys(nodeHeatmap)) {
      const item = nodeHeatmap[nodeId];
      const uniqueCount = item.uniqueBots.size;
      formattedHeatmap[nodeId] = {
        visits: item.visits,
        uniqueBots: uniqueCount,
        avgTimeSpentSec: uniqueCount > 0 ? (item.totalTicks * this.secondsPerTick) / uniqueCount : 0,
      };
    }

    // Compute Churn Funnel
    const churnFunnel = this.computeChurnFunnel();

    // Compute Economy Alerts
    const economyAlerts = this.generateAlerts(timeSeries);

    // Calculate revenue simulated from real money prices
    let totalRevenueSimulatedUsd = 0;
    for (const bot of this.bots) {
      for (const purchase of bot.purchaseHistory) {
        const item = this.project.shopItems.find((s) => s.id === purchase.itemId);
        if (item?.realMoneyPrice) {
          totalRevenueSimulatedUsd += item.realMoneyPrice.usd * purchase.count;
        }
      }
    }

    const softLockedBotsCount = this.bots.filter((b) => b.isSoftLocked).length;

    // Build structured BotRunSummary array for each bot
    const botRuns: BotRunSummary[] = this.bots.map((bot) => {
      let status: BotRunSummary['status'] = 'completed';
      if (bot.isSoftLocked) {
        status = 'soft_locked';
      } else if (
        bot.finishReason?.toLowerCase().includes('churn') ||
        bot.finishReason?.toLowerCase().includes('quit') ||
        bot.finishReason?.toLowerCase().includes('exit') ||
        bot.finishReason?.toLowerCase().includes('invalid')
      ) {
        status = 'churned';
      } else if (!bot.isFinished) {
        status = 'active';
      }

      const steps = this.botTrajectories.get(bot.id) || [];

      return {
        botId: bot.id,
        persona: bot.persona || 'balanced',
        status,
        totalSteps: steps.length,
        totalDurationSec: bot.ticksLived * this.secondsPerTick,
        finalLevel: bot.level,
        finalWallet: { ...bot.currentWallet },
        totalEarned: { ...bot.totalEarned },
        totalSpent: { ...bot.totalSpent },
        itemsPurchased: bot.purchaseHistory.map((p) => {
          const item = this.project.shopItems.find((s) => s.id === p.itemId);
          return item ? `${item.name} (x${p.count})` : `${p.itemId} (x${p.count})`;
        }),
        finishReason: bot.finishReason,
        steps,
      };
    });

    return {
      completedAt: new Date().toISOString(),
      totalBots: this.bots.length,
      durationMinutes: (this.currentTick * this.secondsPerTick) / 60,
      ticksExecuted: this.currentTick,
      timeSeries,
      nodeHeatmap: formattedHeatmap,
      churnFunnel,
      economyAlerts,
      eventsSample: this.events.slice(0, 150),
      botRuns,
      softLockedBotsCount,
      totalRevenueSimulatedUsd: Math.round(totalRevenueSimulatedUsd * 100) / 100,
    };
  }

  private applyPassiveRegeneration(bot: BotState): void {
    const currentTimeSec = bot.ticksLived * this.secondsPerTick;
    if (!bot.lastRegenTimeSec) {
      bot.lastRegenTimeSec = {};
    }

    for (const curr of this.project.currencies) {
      if (curr.regenIntervalMinutes && curr.regenIntervalMinutes > 0 && curr.maxCap !== null) {
        const intervalSec = curr.regenIntervalMinutes * 60;
        const currentBal = bot.currentWallet[curr.id] || 0;

        if (currentBal >= curr.maxCap) {
          // At max capacity: pin cooldown timer to current simulation time
          bot.lastRegenTimeSec[curr.id] = currentTimeSec;
        } else {
          // Below max capacity: ensure timer starts at the time when currency dropped below cap
          let lastRegen = bot.lastRegenTimeSec[curr.id];
          if (!lastRegen || lastRegen === 0) {
            lastRegen = currentTimeSec;
            bot.lastRegenTimeSec[curr.id] = currentTimeSec;
          }

          if (currentTimeSec - lastRegen >= intervalSec) {
            const addAmount = curr.regenAmount || 1;
            const newBal = Math.min(curr.maxCap, currentBal + addAmount);
            const gained = newBal - currentBal;
            if (gained > 0) {
              bot.currentWallet[curr.id] = newBal;
              bot.totalEarned[curr.id] = (bot.totalEarned[curr.id] || 0) + gained;
              // Reset lastRegenTimeSec to currentTimeSec so next unit requires ANOTHER full intervalSec
              bot.lastRegenTimeSec[curr.id] = currentTimeSec;
            }
          }
        }
      }
    }
  }

  private processBotStep(
    bot: BotState,
    tick: number,
    heatmap: Record<string, { visits: number; uniqueBots: Set<number>; totalTicks: number }>
  ): void {
    const currentNode = this.project.nodes.find((n) => n.id === bot.currentNodeId);
    if (!currentNode) {
      bot.isFinished = true;
      bot.finishReason = 'invalid_node';
      return;
    }

    // Update heatmap
    if (!heatmap[currentNode.id]) {
      heatmap[currentNode.id] = { visits: 0, uniqueBots: new Set<number>(), totalTicks: 0 };
    }
    heatmap[currentNode.id].visits++;
    heatmap[currentNode.id].uniqueBots.add(bot.id);
    heatmap[currentNode.id].totalTicks++;

    const nodeData = currentNode.data;
    const outgoingEdges = this.project.edges.filter((e) => e.source === currentNode.id);

    switch (nodeData.type) {
      case 'START': {
        this.recordBotStep(
          bot,
          tick,
          currentNode,
          'Launched game session',
          {},
          'success',
          'Session initialized at entry point'
        );
        this.transitionBot(bot, outgoingEdges[0]?.target);
        break;
      }

      case 'ACTION': {
        this.recordBotStep(
          bot,
          tick,
          currentNode,
          `Played ${nodeData.label || 'Level Stage'} (Lvl ${bot.level}) [Streak: ${bot.currentStreak || 0}/${bot.streakStepTarget || 3}]`,
          {},
          'success',
          `Current Stage: Level ${bot.level} (${nodeData.actionDurationSec || 15}s run). Total levels cleared so far: ${bot.levelsCleared || 0}`
        );
        this.pickOutgoingEdge(bot, outgoingEdges);
        break;
      }

      case 'EARN': {
        const currencyId =
          nodeData.earnCurrencyId ||
          this.project.currencies.find((c) => c.id === 'curr_coins' || c.name.toLowerCase().includes('coin'))?.id ||
          this.project.currencies.find((c) => c.id !== 'curr_lives' && !c.name.toLowerCase().includes('life'))?.id ||
          this.project.currencies[0]?.id;
        const currency = this.project.currencies.find((c) => c.id === currencyId);

        if (currency) {
          const minAmt = nodeData.earnAmountMin ?? 10;
          const maxAmt = nodeData.earnAmountMax ?? 25;
          const baseEarn = minAmt + Math.random() * (maxAmt - minAmt);

          // Apply inflation curve based on session time
          const inflationScale = 1 + (currency.inflationFactor || 0) * (bot.sessionMinutes / 10);

          // Apply active boosters
          let boosterMultiplier = 1;
          for (const b of bot.activeBoosters) {
            if (b.currencyId === currencyId) {
              boosterMultiplier *= b.multiplier;
            }
          }

          const totalEarn = Math.round(baseEarn * inflationScale * boosterMultiplier);
          const currentVal = bot.currentWallet[currencyId] || 0;
          const maxCap = currency.maxCap ?? Infinity;
          const finalVal = Math.min(maxCap, currentVal + totalEarn);
          const actualGained = finalVal - currentVal;

          bot.currentWallet[currencyId] = finalVal;
          bot.totalEarned[currencyId] = (bot.totalEarned[currencyId] || 0) + actualGained;

          this.recordBotStep(
            bot,
            tick,
            currentNode,
            `Collected +${actualGained} ${currency.name}`,
            { [currencyId]: actualGained },
            'success',
            `Balance now: ${finalVal} ${currency.name}`
          );

          if (this.events.length < 300 && Math.random() < 0.15) {
            this.events.push({
              botId: bot.id,
              tick,
              timeSec: tick * this.secondsPerTick,
              nodeId: currentNode.id,
              nodeType: 'EARN',
              currencyDelta: { [currencyId]: actualGained },
              description: `Earned +${actualGained} ${currency.name}`,
              walletSnapshot: { ...bot.currentWallet },
            });
          }
        }
        this.pickOutgoingEdge(bot, outgoingEdges);
        break;
      }

      case 'SPEND': {
        const currencyId = nodeData.spendCurrencyId || this.project.currencies[0]?.id;
        const currency = this.project.currencies.find((c) => c.id === currencyId);
        const cost = nodeData.spendAmount ?? 10;
        const currentBal = bot.currentWallet[currencyId] || 0;

        if (currentBal >= cost) {
          bot.currentWallet[currencyId] = currentBal - cost;
          bot.totalSpent[currencyId] = (bot.totalSpent[currencyId] || 0) + cost;

          // Reset regen cooldown timer so player MUST wait full regenIntervalMinutes from NOW
          const currentTimeSec = bot.ticksLived * this.secondsPerTick;
          if (!bot.lastRegenTimeSec) bot.lastRegenTimeSec = {};
          bot.lastRegenTimeSec[currencyId] = currentTimeSec;

          this.recordBotStep(
            bot,
            tick,
            currentNode,
            `Spent -${cost} ${currency?.name || 'Currency'} for ${nodeData.label || 'Sink'}`,
            { [currencyId]: -cost },
            'success',
            `Remaining balance: ${bot.currentWallet[currencyId]} ${currency?.name || ''}`
          );

          if (this.events.length < 300 && Math.random() < 0.15) {
            this.events.push({
              botId: bot.id,
              tick,
              timeSec: tick * this.secondsPerTick,
              nodeId: currentNode.id,
              nodeType: 'SPEND',
              currencyDelta: { [currencyId]: -cost },
              description: `Spent -${cost} ${currency?.name || 'Currency'}`,
              walletSnapshot: { ...bot.currentWallet },
            });
          }
          this.pickOutgoingEdge(bot, outgoingEdges);
        } else {
          // Player cannot afford sink -> Check for soft-lock
          bot.isSoftLocked = true;
          // If there's a fallback edge (e.g., labeled 'fail', 'no', 'cannot afford'), take it
          const failEdge = outgoingEdges.find(
            (e) =>
              e.label?.toLowerCase().includes('fail') ||
              e.label?.toLowerCase().includes('no') ||
              e.label?.toLowerCase().includes('cannot')
          );

          this.recordBotStep(
            bot,
            tick,
            currentNode,
            `Insufficient funds for ${nodeData.label || 'Sink'} (Cost: ${cost}, Bal: ${currentBal})`,
            {},
            'soft_locked',
            failEdge ? 'Routed to fallback failure path' : 'Soft-locked: Terminated due to lack of currency'
          );

          if (failEdge) {
            this.transitionBot(bot, failEdge.target);
          } else {
            // Churn due to lack of funds
            bot.isFinished = true;
            bot.finishReason = `Soft-locked: out of ${currency?.name || 'currency'}`;
          }
        }
        break;
      }

      case 'CONDITION': {
        const { met, details } = this.evaluateCondition(bot, nodeData);
        // Find matching edge (Yes/True vs No/False)
        const yesEdge = outgoingEdges.find(
          (e) =>
            e.sourceHandle === 'true' ||
            e.sourceHandle === 'branch_0' ||
            e.label?.toLowerCase().includes('yes') ||
            e.label?.toLowerCase().includes('true') ||
            e.label?.toLowerCase().includes('pass') ||
            e.label?.includes('>=')
        );
        const noEdge = outgoingEdges.find(
          (e) =>
            e.sourceHandle === 'false' ||
            e.sourceHandle === 'branch_1' ||
            e.label?.toLowerCase().includes('no') ||
            e.label?.toLowerCase().includes('false') ||
            e.label?.toLowerCase().includes('fail') ||
            e.label?.toLowerCase().includes('out of') ||
            e.label?.toLowerCase().includes('decline')
        );

        this.recordBotStep(
          bot,
          tick,
          currentNode,
          `Evaluated condition: ${nodeData.label || 'Check'} -> ${met ? 'PASSED (True)' : 'FAILED (False)'}`,
          {},
          met ? 'branch_true' : 'branch_false',
          details || (met ? 'Branch taken: Yes / True path' : 'Branch taken: No / False path')
        );

        if (met && yesEdge) {
          this.transitionBot(bot, yesEdge.target);
        } else if (!met && noEdge) {
          this.transitionBot(bot, noEdge.target);
        } else if (outgoingEdges.length > 0) {
          const target = met ? outgoingEdges[0]?.target : outgoingEdges[1]?.target || outgoingEdges[0]?.target;
          this.transitionBot(bot, target);
        } else {
          bot.isFinished = true;
        }
        break;
      }

      case 'CHANCE': {
        const isLevelOutcomeNode =
          Boolean(nodeData.levelDifficulties && nodeData.levelDifficulties.length > 0) ||
          nodeData.label?.toLowerCase().includes('level') ||
          nodeData.label?.toLowerCase().includes('outcome') ||
          nodeData.label?.toLowerCase().includes('win') ||
          nodeData.label?.toLowerCase().includes('stage');

        if (isLevelOutcomeNode) {
          const difficulties: LevelDifficultyConfig[] =
            nodeData.levelDifficulties && nodeData.levelDifficulties.length > 0
              ? nodeData.levelDifficulties
              : DEFAULT_LEVEL_DIFFICULTIES;

          // 1. Roll level difficulty according to distribution ratios
          const totalWeight = difficulties.reduce((acc, d) => acc + (d.distributionRatio || 20), 0);
          let diffRoll = Math.random() * totalWeight;
          let chosenDiff: LevelDifficultyConfig = difficulties[0];

          for (const diff of difficulties) {
            diffRoll -= diff.distributionRatio || 20;
            if (diffRoll <= 0) {
              chosenDiff = diff;
              break;
            }
          }

          // Record chosen difficulty on bot state for downstream revive decision logic
          bot.lastDifficultyRolled = chosenDiff.key;

          // 2. Compute effective win rate based on persona and level difficulty
          const botPersona = bot.persona || 'balanced';
          const winRatePct = calculatePersonaWinRate(botPersona, chosenDiff.key, chosenDiff.baseWinRate);

          // 3. Roll RNG for Win vs Loss
          const outcomeRoll = Math.random() * 100;
          const isWin = outcomeRoll <= winRatePct;

          const coinsCurr =
            this.project.currencies.find(
              (c) =>
                c.id === 'curr_coins' ||
                c.name.toLowerCase().includes('coin') ||
                c.name.toLowerCase().includes('gold')
            ) ||
            this.project.currencies.find(
              (c) =>
                c.type === 'soft' &&
                c.id !== 'curr_lives' &&
                !c.name.toLowerCase().includes('life') &&
                !c.name.toLowerCase().includes('lives')
            );
          const coinsCurrId = coinsCurr?.id;

          if (isWin) {
            // Victory! Level is cleared -> Advance level & increment streak
            bot.levelsCleared = (bot.levelsCleared || 0) + 1;
            bot.currentStreak = (bot.currentStreak || 0) + 1;
            const clearedLevel = bot.level;
            bot.level = bot.level + 1; // Advanced to next level stage!

            const rewardCoins = chosenDiff.baseRewardCoins || 20;
            if (coinsCurrId) {
              const maxCap = coinsCurr?.maxCap ?? Infinity;
              const prevBal = bot.currentWallet[coinsCurrId] || 0;
              const newBal = Math.min(maxCap, prevBal + rewardCoins);
              const actualAwarded = newBal - prevBal;
              bot.currentWallet[coinsCurrId] = newBal;
              bot.totalEarned[coinsCurrId] = (bot.totalEarned[coinsCurrId] || 0) + actualAwarded;
            }

            const winEdge =
              outgoingEdges.find(
                (e) =>
                  e.sourceHandle === 'branch_0' ||
                  e.label?.toLowerCase().includes('win') ||
                  e.label?.toLowerCase().includes('victory')
              ) || outgoingEdges[0];

            this.recordBotStep(
              bot,
              tick,
              currentNode,
              `[${botPersona.toUpperCase()} Persona] ${chosenDiff.label} (${chosenDiff.distributionRatio}% ratio) -> Win Rate ${winRatePct}%. Rolled ${Math.round(outcomeRoll)}% -> VICTORY! (+${chosenDiff.baseRewardCoins} Coins)`,
              coinsCurrId ? { [coinsCurrId]: chosenDiff.baseRewardCoins } : {},
              'success',
              `Cleared Level ${clearedLevel}! Advanced to Level ${bot.level}. Streak: ${bot.currentStreak}/${bot.streakStepTarget || 3}. Victory reward +${chosenDiff.baseRewardCoins} coins awarded.`
            );

            if (winEdge) {
              this.transitionBot(bot, winEdge.target);
            } else {
              bot.isFinished = true;
            }
          } else {
            // Defeat -> Level not cleared, Streak breaks
            bot.currentStreak = 0;

            const defeatEdge =
              outgoingEdges.find(
                (e) =>
                  e.sourceHandle === 'branch_1' ||
                  e.label?.toLowerCase().includes('defeat') ||
                  e.label?.toLowerCase().includes('lose') ||
                  e.label?.toLowerCase().includes('fail')
              ) || outgoingEdges[1] || outgoingEdges[0];

            this.recordBotStep(
              bot,
              tick,
              currentNode,
              `[${botPersona.toUpperCase()} Persona] ${chosenDiff.label} (${chosenDiff.distributionRatio}% ratio) -> Win Rate ${winRatePct}%. Rolled ${Math.round(outcomeRoll)}% -> DEFEAT`,
              {},
              'failed',
              `Defeated on Level ${bot.level} (${chosenDiff.label}). Streak reset to 0. (Base win rate: ${chosenDiff.baseWinRate}%, Persona win rate: ${winRatePct}%).`
            );

            if (defeatEdge) {
              this.transitionBot(bot, defeatEdge.target);
            } else {
              bot.isFinished = true;
            }
          }
        } else {
          // Standard probability roll
          const branches = nodeData.chanceBranches || [
            { label: 'Option A', probability: 50 },
            { label: 'Option B', probability: 50 },
          ];

          const roll = Math.random() * 100;
          let cumulative = 0;
          let chosenBranchIdx = 0;

          for (let i = 0; i < branches.length; i++) {
            cumulative += branches[i].probability;
            if (roll <= cumulative) {
              chosenBranchIdx = i;
              break;
            }
          }

          const pickedBranch = branches[chosenBranchIdx];
          const branchLabel = pickedBranch?.label?.toLowerCase() || '';
          const isWinBranch = branchLabel.includes('win') || branchLabel.includes('victory') || branchLabel.includes('clear') || branchLabel.includes('success');
          const isLossBranch = branchLabel.includes('defeat') || branchLabel.includes('lose') || branchLabel.includes('fail') || branchLabel.includes('crash');

          if (isWinBranch) {
            bot.levelsCleared = (bot.levelsCleared || 0) + 1;
            bot.currentStreak = (bot.currentStreak || 0) + 1;
            const clearedLevel = bot.level;
            bot.level = bot.level + 1;
          } else if (isLossBranch) {
            bot.currentStreak = 0;
          }

          this.recordBotStep(
            bot,
            tick,
            currentNode,
            `Probability roll: ${pickedBranch?.label || 'Outcome'} (${pickedBranch?.probability || 0}%)`,
            {},
            isWinBranch ? 'success' : isLossBranch ? 'failed' : 'success',
            `RNG roll ${Math.round(roll)}% landed in branch [${pickedBranch?.label}]. Level: ${bot.level}, Streak: ${bot.currentStreak || 0}/${bot.streakStepTarget || 3}`
          );

          const targetEdge = outgoingEdges[chosenBranchIdx] || outgoingEdges[0];
          if (targetEdge) {
            this.transitionBot(bot, targetEdge.target);
          } else {
            bot.isFinished = true;
          }
        }
        break;
      }

      case 'SHOP_VISIT': {
        const purchaseProb = (nodeData.shopPurchaseProbability ?? 30) / 100;
        const willTryBuy = Math.random() < purchaseProb;
        let purchaseOccurred = false;

        if (willTryBuy && this.project.shopItems.length > 0) {
          let candidates = this.project.shopItems.filter((item) => {
            if (nodeData.shopTargetCategory && nodeData.shopTargetCategory !== 'all') {
              return item.category === nodeData.shopTargetCategory;
            }
            if (nodeData.shopTargetItemId) {
              return item.id === nodeData.shopTargetItemId;
            }
            return true;
          });

          if (candidates.length === 0) candidates = this.project.shopItems;

          // Filter by unlock condition
          const eligibleItems = candidates.filter((item) => {
            const cond = item.unlockCondition;
            if (cond.minPlayerLevel > bot.level) return false;
            if (cond.minSessionMinutes > bot.sessionMinutes) return false;
            if (cond.requiredItemId && !bot.inventory.includes(cond.requiredItemId)) return false;
            return true;
          });

          if (eligibleItems.length > 0) {
            // Pick an item by weight
            const totalWeight = eligibleItems.reduce((acc, it) => acc + (it.weight || 50), 0);
            let randomWeight = Math.random() * totalWeight;
            let pickedItem: ShopItem = eligibleItems[0];

            for (const item of eligibleItems) {
              randomWeight -= item.weight || 50;
              if (randomWeight <= 0) {
                pickedItem = item;
                break;
              }
            }

            // Check purchase limits
            const history = bot.purchaseHistory.find((p) => p.itemId === pickedItem.id);
            const boughtCount = history ? history.count : 0;
            const limit = pickedItem.purchaseLimit;
            const canBuy =
              (limit.lifetime === null || boughtCount < limit.lifetime) &&
              (limit.perSession === null || boughtCount < limit.perSession);

            if (canBuy) {
              // Attempt to pay with currency price options
              let paid = false;
              for (const price of pickedItem.priceOptions) {
                const bal = bot.currentWallet[price.currencyId] || 0;
                if (bal >= price.amount) {
                  bot.currentWallet[price.currencyId] = bal - price.amount;
                  bot.totalSpent[price.currencyId] = (bot.totalSpent[price.currencyId] || 0) + price.amount;
                  paid = true;
                  break;
                }
              }

              // Or simulated real money purchase (2% propensity if real money price exists)
              if (!paid && pickedItem.realMoneyPrice && Math.random() < 0.03) {
                paid = true;
              }

              if (paid) {
                purchaseOccurred = true;
                if (history) {
                  history.count++;
                } else {
                  bot.purchaseHistory.push({ itemId: pickedItem.id, count: 1 });
                }

                if (!bot.inventory.includes(pickedItem.id)) {
                  bot.inventory.push(pickedItem.id);
                }

                // Grant booster effect if applicable
                if (pickedItem.boosterEffect) {
                  bot.activeBoosters.push({
                    currencyId: pickedItem.boosterEffect.affectsCurrencyId,
                    multiplier: pickedItem.boosterEffect.multiplier,
                    expiresAtSec: tick * this.secondsPerTick + pickedItem.boosterEffect.durationSec,
                  });
                }

                // Grant currency pack if applicable
                if (pickedItem.currencyPackGrant) {
                  const grant = pickedItem.currencyPackGrant;
                  const targetCurr = this.project.currencies.find((c) => c.id === grant.currencyId);
                  const max = targetCurr?.maxCap ?? Infinity;
                  const prevVal = bot.currentWallet[grant.currencyId] || 0;
                  const newVal = Math.min(max, prevVal + grant.amount);
                  bot.currentWallet[grant.currencyId] = newVal;
                  bot.totalEarned[grant.currencyId] = (bot.totalEarned[grant.currencyId] || 0) + (newVal - prevVal);

                  if (!bot.lastRegenTimeSec) bot.lastRegenTimeSec = {};
                  bot.lastRegenTimeSec[grant.currencyId] = tick * this.secondsPerTick;
                }

                // Grant bundled currencies if this is a Remove Ads or value bundle
                if (pickedItem.bundledCurrencies && pickedItem.bundledCurrencies.length > 0) {
                  for (const bundle of pickedItem.bundledCurrencies) {
                    const targetCurr = this.project.currencies.find((c) => c.id === bundle.currencyId);
                    const max = targetCurr?.maxCap ?? Infinity;
                    const prevVal = bot.currentWallet[bundle.currencyId] || 0;
                    const newVal = Math.min(max, prevVal + bundle.amount);
                    bot.currentWallet[bundle.currencyId] = newVal;
                    bot.totalEarned[bundle.currencyId] = (bot.totalEarned[bundle.currencyId] || 0) + (newVal - prevVal);

                    if (!bot.lastRegenTimeSec) bot.lastRegenTimeSec = {};
                    bot.lastRegenTimeSec[bundle.currencyId] = tick * this.secondsPerTick;
                  }
                }

                // Track Remove Ads ownership in inventory
                if (pickedItem.isRemoveAds || pickedItem.category === 'remove_ads') {
                  if (!bot.inventory.includes('no_ads')) {
                    bot.inventory.push('no_ads');
                  }
                }

                this.recordBotStep(
                  bot,
                  tick,
                  currentNode,
                  `Purchased shop item: ${pickedItem.name}`,
                  {},
                  'purchased',
                  pickedItem.realMoneyPrice
                    ? `IAP SKU: ${pickedItem.realMoneyPrice.skuLabel} ($${pickedItem.realMoneyPrice.usd})`
                    : `Acquired ${pickedItem.name}`
                );

                if (this.events.length < 300 && Math.random() < 0.2) {
                  this.events.push({
                    botId: bot.id,
                    tick,
                    timeSec: tick * this.secondsPerTick,
                    nodeId: currentNode.id,
                    nodeType: 'SHOP_VISIT',
                    currencyDelta: {},
                    description: `Purchased item: ${pickedItem.name}`,
                    walletSnapshot: { ...bot.currentWallet },
                  });
                }
              }
            }
          }
        }

        if (purchaseOccurred) {
          const boughtEdge =
            outgoingEdges.find(
              (e) =>
                e.sourceHandle === 'true' ||
                e.sourceHandle === 'branch_0' ||
                e.label?.toLowerCase().includes('bought') ||
                e.label?.toLowerCase().includes('yes') ||
                e.label?.toLowerCase().includes('purchased') ||
                e.label?.toLowerCase().includes('refill')
            ) || outgoingEdges[0];

          if (boughtEdge) {
            this.transitionBot(bot, boughtEdge.target);
          } else {
            this.pickOutgoingEdge(bot, outgoingEdges);
          }
        } else {
          this.recordBotStep(
            bot,
            tick,
            currentNode,
            'Visited shop without transaction',
            {},
            'skipped',
            'No item matched criteria or insufficient balance'
          );

          const declinedEdge =
            outgoingEdges.find(
              (e) =>
                e.sourceHandle === 'false' ||
                e.sourceHandle === 'branch_1' ||
                e.label?.toLowerCase().includes('decline') ||
                e.label?.toLowerCase().includes('no') ||
                e.label?.toLowerCase().includes('skip') ||
                e.label?.toLowerCase().includes('log off') ||
                e.label?.toLowerCase().includes('exit') ||
                e.label?.toLowerCase().includes('churn')
            ) || outgoingEdges[1] || outgoingEdges[0];

          if (declinedEdge) {
            this.transitionBot(bot, declinedEdge.target);
          } else {
            this.pickOutgoingEdge(bot, outgoingEdges);
          }
        }
        break;
      }

      case 'END': {
        this.recordBotStep(
          bot,
          tick,
          currentNode,
          `Session terminus reached (${nodeData.endReason || 'Exit'})`,
          {},
          'churned',
          `Session time: ${bot.sessionMinutes.toFixed(1)}m, Final Lvl: ${bot.level}`
        );
        bot.isFinished = true;
        bot.finishReason = nodeData.endReason || 'Session Ended';
        break;
      }

      default:
        this.recordBotStep(
          bot,
          tick,
          currentNode,
          `Processed node: ${nodeData.label || 'Step'}`,
          {},
          'success'
        );
        this.pickOutgoingEdge(bot, outgoingEdges);
        break;
    }
  }

  private recordBotStep(
    bot: BotState,
    tick: number,
    node: FlowNode,
    actionTaken: string,
    deltaWallet: Record<string, number>,
    outcomeStatus?: BotStepRecord['outcomeStatus'],
    details?: string
  ): void {
    const trajectory = this.botTrajectories.get(bot.id);
    if (!trajectory) return;

    // Cap at 150 steps per bot to prevent excessive memory on huge session simulations
    if (trajectory.length >= 150) return;

    trajectory.push({
      stepNumber: trajectory.length + 1,
      tick,
      timeSec: tick * this.secondsPerTick,
      nodeId: node.id,
      nodeLabel: node.data.label || node.id,
      nodeType: node.data.type,
      actionTaken,
      deltaWallet: { ...deltaWallet },
      walletAfter: { ...bot.currentWallet },
      levelAfter: bot.level,
      currentStreak: bot.currentStreak,
      streakTarget: bot.streakStepTarget,
      decisionMade: actionTaken,
      walletSnapshot: { ...bot.currentWallet },
      persona: bot.persona,
      outcomeStatus,
      details,
    });
  }

  private evaluateCondition(
    bot: BotState,
    data: FlowNode['data']
  ): { met: boolean; details: string } {
    const condType = data.conditionType || 'currency_gte';

    // 1. Streak Step / Progressive Streak Bonus Condition Check
    const isStreakCheck =
      condType === 'streak_step' ||
      condType === 'streak_gte' ||
      data.label?.toLowerCase().includes('streak') ||
      data.streakInitialTarget !== undefined;

    if (isStreakCheck) {
      const target = bot.streakStepTarget ?? data.streakInitialTarget ?? data.conditionThreshold ?? 3;
      const stepIncrement = data.streakStepIncrement ?? 1;
      const maxTarget = data.streakMaxTarget ?? 9;
      const currentStreak = bot.currentStreak || 0;

      const met = currentStreak >= target;

      if (met) {
        // Reset streak progress and step the target up by increment until maxTarget (max 9 level streak)
        bot.currentStreak = 0;
        const nextTarget = Math.min(maxTarget, target + stepIncrement);
        bot.streakStepTarget = nextTarget;
        bot.streakCyclesCompleted = (bot.streakCyclesCompleted || 0) + 1;

        return {
          met: true,
          details: `Streak Target Met! Completed ${target}-level win streak. Claiming bonus chest. Progression reset to 0; next streak requirement stepped up to ${nextTarget} levels (Max Ping: ${maxTarget}).`,
        };
      } else {
        return {
          met: false,
          details: `Streak Requirement Not Met: ${currentStreak}/${target} levels cleared in current streak. Next milestone: ${target} wins.`,
        };
      }
    }

    const isReviveCheck =
      condType === 'revive_decision' ||
      data.label?.toLowerCase().includes('revive') ||
      data.revivePropensityPct !== undefined;

    if (isReviveCheck || condType === 'currency_gte') {
      const hardCurr = this.project.currencies.find((c) => c.id === 'curr_gems' || c.type === 'hard');
      const currencyId = data.conditionCurrencyId || hardCurr?.id || this.project.currencies[0]?.id;
      const currency = this.project.currencies.find((c) => c.id === currencyId);
      const threshold = data.conditionThreshold ?? 10;
      const bal = bot.currentWallet[currencyId] || 0;

      if (bal < threshold) {
        return {
          met: false,
          details: `Cannot afford revive: ${bal} ${currency?.name || 'Gems'} < required ${threshold}`,
        };
      }

      if (isReviveCheck) {
        // Calculate propensity based on difficulty and persona
        const diffKey = bot.lastDifficultyRolled || 'medium';
        let basePropensity = data.revivePropensityPct ?? 50;

        if (data.useDifficultyReviveTendency || data.reviveByDifficulty) {
          const defaultByDiff: Record<string, number> = {
            easy: 15,
            medium: 35,
            hard: 65,
            very_hard: 85,
            extreme: 95,
          };
          if (data.reviveByDifficulty && data.reviveByDifficulty[diffKey] !== undefined) {
            basePropensity = data.reviveByDifficulty[diffKey];
          } else if (defaultByDiff[diffKey] !== undefined) {
            basePropensity = defaultByDiff[diffKey];
          }
        }

        const persona = bot.persona || 'balanced';
        let personaMultiplier = 1.0;
        if (data.usePersonaReviveTendency || data.reviveByPersona) {
          if (data.reviveByPersona && data.reviveByPersona[persona] !== undefined) {
            // Explicit percentage provided
            basePropensity = data.reviveByPersona[persona];
          } else {
            if (persona === 'casual') personaMultiplier = 0.6;
            if (persona === 'hardcore') personaMultiplier = 1.3;
          }
        }

        const effectivePropensity = Math.min(100, Math.max(0, Math.round(basePropensity * personaMultiplier)));
        const roll = Math.random() * 100;
        const accepted = roll <= effectivePropensity;

        const diffLabel = diffKey.toUpperCase().replace('_', ' ');
        const details = `Revive Decision: Bal (${bal} ${currency?.name || 'Gems'}) >= ${threshold}. Difficulty: ${diffLabel} (${basePropensity}% propensity), Persona: ${persona.toUpperCase()} (x${personaMultiplier}). Effective chance: ${effectivePropensity}%. Rolled ${Math.round(roll)}% -> ${accepted ? 'DECIDED TO REVIVE' : 'DECLINED REVIVE'}`;

        return { met: accepted, details };
      }

      return { met: true, details: `Balance ${bal} >= ${threshold}` };
    }

    if (condType === 'level_gte') {
      const threshold = data.conditionThreshold ?? 2;
      const met = bot.level >= threshold;
      return { met, details: `Player Level ${bot.level} >= ${threshold}` };
    }

    if (condType === 'session_time_gte') {
      const threshold = data.conditionThreshold ?? 5; // in minutes
      const met = bot.sessionMinutes >= threshold;
      return { met, details: `Session time ${Math.round(bot.sessionMinutes * 10) / 10}m >= ${threshold}m` };
    }

    if (condType === 'item_owned') {
      if (!data.conditionItemId) return { met: false, details: 'No item specified' };
      const met = bot.inventory.includes(data.conditionItemId);
      return { met, details: `Inventory ${met ? 'contains' : 'lacks'} item: ${data.conditionItemId}` };
    }

    return { met: true, details: 'Condition passed' };
  }

  private pickOutgoingEdge(bot: BotState, edges: FlowEdge[]): void {
    if (edges.length === 0) {
      bot.isFinished = true;
      bot.finishReason = 'End of Flow (No Outgoing Edges)';
      return;
    }

    // Random choice among remaining outgoing edges if not specifically branched
    const nextEdge = edges[Math.floor(Math.random() * edges.length)];
    this.transitionBot(bot, nextEdge.target);
  }

  private transitionBot(bot: BotState, targetNodeId?: string): void {
    if (!targetNodeId) {
      bot.isFinished = true;
      return;
    }
    bot.currentNodeId = targetNodeId;
    bot.historyPath.push(targetNodeId);
  }

  private createSnapshot(tick: number): TimeSeriesSnapshot {
    const minute = Math.round(((tick * this.secondsPerTick) / 60) * 10) / 10;
    const activeBots = this.bots.filter((b) => !b.isFinished);
    const churnedCount = this.bots.length - activeBots.length;

    const currenciesAvg: Record<string, number> = {};
    const currenciesMedian: Record<string, number> = {};
    const currenciesMin: Record<string, number> = {};
    const currenciesMax: Record<string, number> = {};
    const totalEarnedAvg: Record<string, number> = {};
    const totalSpentAvg: Record<string, number> = {};

    for (const curr of this.project.currencies) {
      const cid = curr.id;
      const balances = this.bots.map((b) => b.currentWallet[cid] || 0);
      const earnedList = this.bots.map((b) => b.totalEarned[cid] || 0);
      const spentList = this.bots.map((b) => b.totalSpent[cid] || 0);

      balances.sort((a, b) => a - b);
      const sum = balances.reduce((acc, v) => acc + v, 0);
      const median = balances[Math.floor(balances.length / 2)] || 0;

      currenciesAvg[cid] = Math.round(sum / (this.bots.length || 1));
      currenciesMedian[cid] = Math.round(median);
      currenciesMin[cid] = balances[0] || 0;
      currenciesMax[cid] = balances[balances.length - 1] || 0;

      const totalEarnSum = earnedList.reduce((acc, v) => acc + v, 0);
      const totalSpendSum = spentList.reduce((acc, v) => acc + v, 0);

      totalEarnedAvg[cid] = Math.round(totalEarnSum / (this.bots.length || 1));
      totalSpentAvg[cid] = Math.round(totalSpendSum / (this.bots.length || 1));
    }

    return {
      minute,
      tick,
      activeBots: activeBots.length,
      churnedBots: churnedCount,
      currenciesAvg,
      currenciesMedian,
      currenciesMin,
      currenciesMax,
      totalEarnedAvg,
      totalSpentAvg,
    };
  }

  private shouldStopSimulation(activeCount: number, tick: number, maxTicks: number): boolean {
    const { stopConditions } = this.config;

    if (stopConditions.allBotsEnded && activeCount === 0) {
      return true;
    }

    if (stopConditions.sessionTimeExceeded && tick >= maxTicks) {
      return true;
    }

    if (stopConditions.hardCurrencyThreshold) {
      const hardCurr = this.project.currencies.find((c) => c.type === 'hard');
      if (hardCurr) {
        const threshold = stopConditions.hardCurrencyThreshold;
        const reached = this.bots.some((b) => (b.currentWallet[hardCurr.id] || 0) >= threshold);
        if (reached) return true;
      }
    }

    if (stopConditions.targetRetentionReached !== null && stopConditions.targetRetentionReached !== undefined) {
      const retentionPct = (activeCount / (this.bots.length || 1)) * 100;
      if (retentionPct <= stopConditions.targetRetentionReached) {
        return true;
      }
    }

    return false;
  }

  private computeChurnFunnel(): { milestone: string; nodeId: string; count: number; percentage: number; avgTimeToReachSec: number }[] {
    const funnel: { milestone: string; nodeId: string; count: number; percentage: number; avgTimeToReachSec: number }[] = [];
    const total = this.bots.length || 1;

    for (const node of this.project.nodes) {
      const botsReached = this.bots.filter((b) => b.historyPath.includes(node.id));
      const count = botsReached.length;
      const percentage = Math.round((count / total) * 100);

      // Estimate avg time to reach node
      let totalTime = 0;
      for (const bot of botsReached) {
        const idx = bot.historyPath.indexOf(node.id);
        totalTime += idx * this.secondsPerTick;
      }
      const avgTimeToReachSec = count > 0 ? Math.round(totalTime / count) : 0;

      funnel.push({
        milestone: node.data.label || node.id,
        nodeId: node.id,
        count,
        percentage,
        avgTimeToReachSec,
      });
    }

    // Sort by percentage descending
    funnel.sort((a, b) => b.percentage - a.percentage);
    return funnel;
  }

  private generateAlerts(timeSeries: TimeSeriesSnapshot[]): EconomyAlert[] {
    const alerts: EconomyAlert[] = [];
    const totalBots = this.bots.length || 1;
    const softLockedCount = this.bots.filter((b) => b.isSoftLocked).length;
    const softLockPct = Math.round((softLockedCount / totalBots) * 100);

    // 1. Soft-lock check
    if (softLockPct > 10) {
      alerts.push({
        id: 'alert_softlock',
        type: 'critical',
        title: 'High Soft-Lock Risk Detected',
        message: `${softLockPct}% of simulated bots hit an unaffordable spend sink and could not continue.`,
        suggestedFix: 'Lower the price of mandatory sinks or add a rewarded ad fallback at SPEND nodes.',
        metricValue: `${softLockPct}% affected`,
      });
    }

    // 2. Hard currency inflation check
    const hardCurr = this.project.currencies.find((c) => c.type === 'hard');
    if (hardCurr) {
      const avgEndHard = this.bots.reduce((acc, b) => acc + (b.currentWallet[hardCurr.id] || 0), 0) / totalBots;
      const avgSpentHard = this.bots.reduce((acc, b) => acc + (b.totalSpent[hardCurr.id] || 0), 0) / totalBots;

      if (avgEndHard > 25 && avgSpentHard < 5) {
        alerts.push({
          id: 'alert_hard_inflation',
          type: 'warning',
          title: 'Hard Currency Hyper-Accumulation',
          message: `Bots accumulate an average of ${Math.round(avgEndHard)} ${hardCurr.name} with minimal spend sinks. This decreases IAP monetization incentive.`,
          suggestedFix: 'Introduce attractive hard-currency sinks like gacha chests, revives, or cosmetic skins.',
          metricValue: `Avg ${Math.round(avgEndHard)} gems unspent`,
        });
      }
    }

    // 3. Soft currency deficit / starvation check
    const softCurr = this.project.currencies.find((c) => c.type === 'soft');
    if (softCurr) {
      const endSnapshot = timeSeries[timeSeries.length - 1];
      const avgSoft = endSnapshot?.currenciesAvg[softCurr.id] || 0;

      if (avgSoft < 5) {
        alerts.push({
          id: 'alert_soft_starvation',
          type: 'warning',
          title: 'Soft Currency Starvation',
          message: `Player wallets deplete to near 0 (${Math.round(avgSoft)} avg). Users will feel progression grinding friction.`,
          suggestedFix: 'Increase baseline EARN node drop amounts or grant a coin multiplier booster in early shop.',
          metricValue: `~${Math.round(avgSoft)} coins remaining`,
        });
      }
    }

    // 4. Shop Engagement check
    const totalPurchases = this.bots.reduce((acc, b) => acc + b.purchaseHistory.reduce((pAcc, p) => pAcc + p.count, 0), 0);
    const avgPurchasesPerBot = totalPurchases / totalBots;

    if (avgPurchasesPerBot < 0.2) {
      alerts.push({
        id: 'alert_low_shop_engagement',
        type: 'info',
        title: 'Low Shop Purchase Conversion',
        message: `Only ${Math.round(avgPurchasesPerBot * 100)}% average purchase engagement per session. Shop nodes may be skipped or items overpriced.`,
        suggestedFix: 'Increase shop purchase probability, lower booster costs, or place SHOP_VISIT nodes right after large EARN milestones.',
        metricValue: `${Math.round(avgPurchasesPerBot * 100)}% conversion`,
      });
    } else {
      alerts.push({
        id: 'alert_healthy_economy',
        type: 'success',
        title: 'Healthy Shop Conversion & Flow Circulation',
        message: `Strong bot interaction rate (${Math.round(avgPurchasesPerBot * 100)}% purchase density) with balanced sink cycling.`,
        suggestedFix: 'Maintain current reward pacing and test higher tier monetization items.',
        metricValue: `${Math.round(avgPurchasesPerBot * 100)}% engagement`,
      });
    }

    return alerts;
  }

  public createInitialBot(persona: BotPersonaType = 'balanced'): BotState {
    const startNode = this.project.nodes.find((n) => n.data.type === 'START') || this.project.nodes[0];
    const startNodeId = startNode ? startNode.id : 'node_start';

    const initialWallet: Record<string, number> = {};
    const initialEarned: Record<string, number> = {};
    const initialSpent: Record<string, number> = {};
    const lastRegenTimeSec: Record<string, number> = {};

    for (const curr of this.project.currencies) {
      initialWallet[curr.id] = curr.startingAmount;
      initialEarned[curr.id] = 0;
      initialSpent[curr.id] = 0;
      if (curr.regenIntervalMinutes && curr.regenIntervalMinutes > 0) {
        lastRegenTimeSec[curr.id] = 0;
      }
    }

    const bot: BotState = {
      id: 1,
      persona,
      currentWallet: initialWallet,
      level: 1,
      sessionMinutes: 0,
      activeBoosters: [],
      inventory: [],
      purchaseHistory: [],
      currentNodeId: startNodeId,
      isFinished: false,
      totalEarned: initialEarned,
      totalSpent: initialSpent,
      historyPath: [startNodeId],
      ticksLived: 0,
      isSoftLocked: false,
      lastRegenTimeSec,
      currentStreak: 0,
      streakStepTarget: 3,
      levelsCleared: 0,
      streakCyclesCompleted: 0,
    };

    this.botTrajectories.set(1, []);
    return bot;
  }

  public stepSingleBot(
    bot: BotState,
    tick: number
  ): {
    updatedBot: BotState;
    stepRecord: BotStepRecord | null;
    isFinished: boolean;
  } {
    if (bot.isFinished) {
      const records = this.botTrajectories.get(bot.id) || [];
      return {
        updatedBot: { ...bot },
        stepRecord: records[records.length - 1] || null,
        isFinished: true,
      };
    }

    bot.ticksLived++;
    bot.sessionMinutes = (bot.ticksLived * this.secondsPerTick) / 60;

    // Clean expired boosters
    const currentTimeSec = bot.ticksLived * this.secondsPerTick;
    bot.activeBoosters = bot.activeBoosters.filter((b) => b.expiresAtSec > currentTimeSec);

    // Passive regeneration (Lives / Stamina)
    this.applyPassiveRegeneration(bot);

    // Dummy heatmap structure for step tracking
    const dummyHeatmap: Record<string, { visits: number; uniqueBots: Set<number>; totalTicks: number }> = {};
    for (const node of this.project.nodes) {
      dummyHeatmap[node.id] = { visits: 0, uniqueBots: new Set<number>(), totalTicks: 0 };
    }

    this.processBotStep(bot, tick, dummyHeatmap);

    const trajectory = this.botTrajectories.get(bot.id) || [];
    const latestStep = trajectory[trajectory.length - 1] || null;

    return {
      updatedBot: { ...bot, currentWallet: { ...bot.currentWallet } },
      stepRecord: latestStep,
      isFinished: bot.isFinished,
    };
  }
}
