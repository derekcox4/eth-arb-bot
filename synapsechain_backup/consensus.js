/**
 * NexusChain - HotStuff BFT Consensus
 * Implements simplified HotStuff consensus mechanism with PoS
 */

import { sign, verify, hash } from './crypto.js';
import { QuorumCertificate } from './block.js';

export class Validator {
  constructor(address, publicKey, privateKey, stake) {
    this.address = address;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.stake = stake;
    this.isActive = true;
    this.reputation = 100; // 0-100 score
    this.blocksProduced = 0;
    this.slashCount = 0;
  }

  /**
   * Sign a block proposal
   */
  signBlock(block) {
    return sign({ blockHash: block.hash, height: block.height }, this.privateKey);
  }

  /**
   * Verify another validator's signature
   */
  static verifyBlockSignature(blockHash, height, signature, publicKey) {
    return verify({ blockHash, height }, signature, publicKey);
  }
}

export class HotStuffConsensus {
  constructor(validators = [], blockTime = 400) {
    this.validators = validators; // Array of Validator objects
    this.blockTime = blockTime; // Target block time in ms
    this.currentLeader = null;
    this.votingPhase = 'idle'; // idle, prepare, precommit, commit, decide
    this.prepareVotes = new Map();
    this.precommitVotes = new Map();
    this.commitVotes = new Map();
    this.lockedBlock = null;
    this.qcHigh = null; // Highest QC seen
  }

  /**
   * Select leader based on round-robin with stake weighting
   */
  selectLeader(height) {
    if (this.validators.length === 0) return null;

    // Weighted random selection based on stake
    const totalStake = this.validators.reduce((sum, v) => sum + (v.isActive ? v.stake : 0), 0);
    const seed = parseInt(hash(height.toString()).slice(0, 8), 16);
    let random = (seed % totalStake);

    for (const validator of this.validators) {
      if (!validator.isActive) continue;
      random -= validator.stake;
      if (random <= 0) {
        this.currentLeader = validator;
        return validator;
      }
    }

    return this.validators[0];
  }

  /**
   * Phase 1: Prepare
   * Leader proposes a block
   */
  async prepare(block) {
    console.log(`[Consensus] PREPARE phase for block #${block.height}`);
    this.votingPhase = 'prepare';
    this.prepareVotes.clear();

    // Leader signs the proposal
    const leaderSignature = this.currentLeader.signBlock(block);
    this.prepareVotes.set(this.currentLeader.address, {
      validator: this.currentLeader.address,
      signature: leaderSignature
    });

    // Simulate validator voting (in real implementation, would be async network communication)
    const quorum = await this.collectVotes(block, 'prepare');
    return quorum;
  }

  /**
   * Phase 2: Pre-commit
   * Validators vote on the prepared block
   */
  async precommit(block) {
    console.log(`[Consensus] PRECOMMIT phase for block #${block.height}`);
    this.votingPhase = 'precommit';
    this.precommitVotes.clear();

    const quorum = await this.collectVotes(block, 'precommit');
    if (quorum) {
      this.lockedBlock = block;
    }
    return quorum;
  }

  /**
   * Phase 3: Commit
   * Validators commit to the block
   */
  async commit(block) {
    console.log(`[Consensus] COMMIT phase for block #${block.height}`);
    this.votingPhase = 'commit';
    this.commitVotes.clear();

    const quorum = await this.collectVotes(block, 'commit');
    return quorum;
  }

  /**
   * Phase 4: Decide
   * Finalize the block with QC
   */
  decide(block, votes) {
    console.log(`[Consensus] DECIDE phase for block #${block.height} - Block finalized!`);
    this.votingPhase = 'idle';

    // Create Quorum Certificate
    const qc = new QuorumCertificate(block.hash, block.height, votes);
    this.qcHigh = qc;

    // Update validator who produced the block
    this.currentLeader.blocksProduced++;

    return qc;
  }

  /**
   * Collect votes from validators
   */
  async collectVotes(block, phase) {
    const votes = phase === 'prepare' ? this.prepareVotes :
                  phase === 'precommit' ? this.precommitVotes :
                  this.commitVotes;

    // Simulate validators signing (in real implementation, network layer handles this)
    for (const validator of this.validators) {
      if (!validator.isActive || validator === this.currentLeader) continue;

      // Validator votes with 95% probability (simulate network/Byzantine issues)
      if (Math.random() < 0.95) {
        const signature = validator.signBlock(block);
        votes.set(validator.address, {
          validator: validator.address,
          signature: signature
        });
      }
    }

    // Check if we have quorum (2/3+ validators)
    const quorumSize = Math.ceil((2 * this.validators.length) / 3);
    const hasQuorum = votes.size >= quorumSize;

    console.log(`[Consensus] ${phase.toUpperCase()} votes: ${votes.size}/${this.validators.length} (quorum: ${quorumSize})`);

    return hasQuorum ? Array.from(votes.values()) : null;
  }

  /**
   * Full consensus round for a block
   */
  async reachConsensus(block) {
    console.log(`\n[Consensus] Starting consensus for block #${block.height}`);
    const startTime = Date.now();

    // Phase 1: Prepare
    const prepareQuorum = await this.prepare(block);
    if (!prepareQuorum) {
      console.log('[Consensus] Failed to reach quorum in PREPARE phase');
      return null;
    }

    // Phase 2: Pre-commit
    const precommitQuorum = await this.precommit(block);
    if (!precommitQuorum) {
      console.log('[Consensus] Failed to reach quorum in PRECOMMIT phase');
      return null;
    }

    // Phase 3: Commit
    const commitQuorum = await this.commit(block);
    if (!commitQuorum) {
      console.log('[Consensus] Failed to reach quorum in COMMIT phase');
      return null;
    }

    // Phase 4: Decide
    const qc = this.decide(block, commitQuorum);

    const consensusTime = Date.now() - startTime;
    console.log(`[Consensus] Consensus reached in ${consensusTime}ms (target: ${this.blockTime}ms)`);

    return qc;
  }

  /**
   * Add new validator to the set
   */
  addValidator(validator) {
    this.validators.push(validator);
    console.log(`[Consensus] Added validator ${validator.address} with stake ${validator.stake}`);
  }

  /**
   * Slash validator for Byzantine behavior
   */
  slashValidator(validatorAddress, reason) {
    const validator = this.validators.find(v => v.address === validatorAddress);
    if (!validator) return;

    console.log(`[Consensus] Slashing validator ${validatorAddress} for: ${reason}`);

    validator.stake = Math.floor(validator.stake * 0.9); // 10% slash
    validator.reputation = Math.max(0, validator.reputation - 20);
    validator.slashCount++;

    // Deactivate if slashed too many times
    if (validator.slashCount >= 3) {
      validator.isActive = false;
      console.log(`[Consensus] Validator ${validatorAddress} deactivated after ${validator.slashCount} slashes`);
    }
  }

  /**
   * Get consensus statistics
   */
  getStats() {
    const totalStake = this.validators.reduce((sum, v) => sum + v.stake, 0);
    const activeValidators = this.validators.filter(v => v.isActive).length;

    return {
      totalValidators: this.validators.length,
      activeValidators,
      totalStake,
      currentLeader: this.currentLeader?.address,
      blockTime: this.blockTime,
      qcHeight: this.qcHigh?.height || 0
    };
  }
}

export default HotStuffConsensus;
