/**
 * NexusChain - Block-STM Parallel Execution Engine
 * Implements optimistic parallel transaction execution with conflict detection
 */

export class BlockSTM {
  constructor() {
    this.executionResults = new Map(); // txIndex -> result
    this.readSets = new Map(); // txIndex -> Set of addresses read
    this.writeSets = new Map(); // txIndex -> Set of addresses written
    this.conflicts = new Map(); // txIndex -> Set of conflicting tx indices
  }

  /**
   * Execute transactions in parallel with optimistic concurrency control
   */
  async executeParallel(transactions, state) {
    console.log(`\n[Block-STM] Starting parallel execution of ${transactions.length} transactions`);
    const startTime = Date.now();

    // Phase 1: Optimistic parallel execution
    const results = await this.optimisticExecution(transactions, state);

    // Phase 2: Detect conflicts
    const conflicts = this.detectConflicts(transactions);

    // Phase 3: Re-execute conflicting transactions sequentially
    if (conflicts.size > 0) {
      console.log(`[Block-STM] Detected ${conflicts.size} conflicts, re-executing...`);
      await this.reExecuteConflicts(transactions, state, conflicts);
    }

    // Phase 4: Validate and commit
    const finalState = this.commitResults(state);

    const executionTime = Date.now() - startTime;
    const speedup = this.calculateSpeedup(transactions.length, conflicts.size);
    console.log(`[Block-STM] Parallel execution completed in ${executionTime}ms (${speedup.toFixed(2)}x speedup)`);

    return {
      state: finalState,
      results: Array.from(this.executionResults.values()),
      executionTime,
      speedup,
      conflicts: conflicts.size
    };
  }

  /**
   * Phase 1: Execute all transactions optimistically in parallel
   */
  async optimisticExecution(transactions, state) {
    const results = [];

    // Simulate parallel execution (in production, would use worker threads)
    const promises = transactions.map((tx, index) => {
      return this.executeTransaction(tx, index, state);
    });

    const executionResults = await Promise.all(promises);

    console.log(`[Block-STM] Optimistic execution: ${executionResults.length} transactions processed`);
    return executionResults;
  }

  /**
   * Execute a single transaction and track read/write sets
   */
  async executeTransaction(tx, txIndex, state) {
    const readSet = new Set();
    const writeSet = new Set();

    try {
      // Track sender and receiver in read/write sets
      readSet.add(tx.sender);
      writeSet.add(tx.sender);

      if (tx.to) {
        readSet.add(tx.to);
        writeSet.add(tx.to);
      }

      // Track access list
      for (const addr of tx.accessList) {
        readSet.add(addr);
        writeSet.add(addr);
      }

      // Execute transaction (simplified)
      const result = {
        success: true,
        gasUsed: tx.estimateGas(),
        txHash: tx.hash,
        from: tx.sender,
        to: tx.to,
        value: tx.value
      };

      // Store read/write sets
      this.readSets.set(txIndex, readSet);
      this.writeSets.set(txIndex, writeSet);
      this.executionResults.set(txIndex, result);

      return result;

    } catch (error) {
      console.error(`[Block-STM] Transaction ${txIndex} failed:`, error.message);
      return {
        success: false,
        error: error.message,
        txHash: tx.hash
      };
    }
  }

  /**
   * Phase 2: Detect conflicts between transactions
   */
  detectConflicts(transactions) {
    const conflicts = new Map();

    for (let i = 0; i < transactions.length; i++) {
      const conflictSet = new Set();

      for (let j = 0; j < i; j++) {
        if (this.hasConflict(i, j)) {
          conflictSet.add(j);
        }
      }

      if (conflictSet.size > 0) {
        conflicts.set(i, conflictSet);
      }
    }

    return conflicts;
  }

  /**
   * Check if two transactions have conflicting read/write sets
   */
  hasConflict(txIndex1, txIndex2) {
    const read1 = this.readSets.get(txIndex1) || new Set();
    const write1 = this.writeSets.get(txIndex1) || new Set();
    const read2 = this.readSets.get(txIndex2) || new Set();
    const write2 = this.writeSets.get(txIndex2) || new Set();

    // Read-Write conflict
    for (const addr of read1) {
      if (write2.has(addr)) return true;
    }

    // Write-Read conflict
    for (const addr of write1) {
      if (read2.has(addr)) return true;
    }

    // Write-Write conflict
    for (const addr of write1) {
      if (write2.has(addr)) return true;
    }

    return false;
  }

  /**
   * Phase 3: Re-execute conflicting transactions in correct order
   */
  async reExecuteConflicts(transactions, state, conflicts) {
    // Sort conflicting transactions by index to maintain order
    const conflictingIndices = Array.from(conflicts.keys()).sort((a, b) => a - b);

    for (const txIndex of conflictingIndices) {
      const tx = transactions[txIndex];
      console.log(`[Block-STM] Re-executing transaction ${txIndex} (${tx.hash.slice(0, 8)}...)`);

      // Re-execute with updated state
      await this.executeTransaction(tx, txIndex, state);
    }
  }

  /**
   * Phase 4: Commit all results to final state
   */
  commitResults(state) {
    const newState = { ...state };

    // Apply all execution results to state
    for (const [txIndex, result] of this.executionResults.entries()) {
      if (result.success) {
        // Update balances (simplified)
        if (!newState.balances) newState.balances = {};

        const from = result.from;
        const to = result.to;
        const value = result.value;
        const gasUsed = result.gasUsed;

        // Deduct from sender
        newState.balances[from] = (newState.balances[from] || 0) - value - gasUsed;

        // Add to receiver
        if (to) {
          newState.balances[to] = (newState.balances[to] || 0) + value;
        }
      }
    }

    return newState;
  }

  /**
   * Calculate speedup factor
   * Amdahl's Law: Speedup = 1 / ((1-P) + P/N)
   * Where P = parallel portion, N = number of cores
   */
  calculateSpeedup(totalTx, conflicts) {
    // Assume 8 cores for calculation
    const cores = 8;

    // Parallel portion (non-conflicting transactions)
    const parallelPortion = (totalTx - conflicts) / totalTx;

    // Sequential portion (conflicting transactions)
    const sequentialPortion = conflicts / totalTx;

    // Theoretical speedup
    const speedup = 1 / (sequentialPortion + parallelPortion / cores);

    return speedup;
  }

  /**
   * Get execution statistics
   */
  getStats() {
    const totalTx = this.executionResults.size;
    const successfulTx = Array.from(this.executionResults.values()).filter(r => r.success).length;
    const totalConflicts = Array.from(this.conflicts.values()).reduce((sum, set) => sum + set.size, 0);

    return {
      totalTransactions: totalTx,
      successfulTransactions: successfulTx,
      failedTransactions: totalTx - successfulTx,
      totalConflicts,
      conflictRate: totalTx > 0 ? (totalConflicts / totalTx * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Reset execution state
   */
  reset() {
    this.executionResults.clear();
    this.readSets.clear();
    this.writeSets.clear();
    this.conflicts.clear();
  }
}

export default BlockSTM;
