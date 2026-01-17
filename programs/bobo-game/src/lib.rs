use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("PewGameProgramAddressWillBeGeneratedHere1111");

const SECONDS_PER_DAY: i64 = 86400;
const MAX_LEADERBOARD_SIZE: usize = 10;

#[program]
pub mod pew_game {
    use super::*;

    /// Initialize the game state and daily leaderboard
    pub fn initialize(ctx: Context<Initialize>, entry_fee: u64, max_tokens_per_game: u64) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        game_state.authority = ctx.accounts.authority.key();
        game_state.token_mint = ctx.accounts.token_mint.key();
        game_state.treasury = ctx.accounts.treasury.key();
        game_state.dev_wallet = ctx.accounts.dev_wallet.key();
        game_state.total_games_played = 0;
        game_state.max_tokens_per_game = max_tokens_per_game;
        game_state.entry_fee = entry_fee;
        game_state.max_games_per_hour = 10;
        game_state.cooldown_seconds = 60;
        game_state.daily_pot = 0;
        game_state.dev_revenue = 0;
        game_state.pot_allocation_percent = 75; // 75% to pot, 25% to dev

        msg!("PEW Game initialized! Entry fee: {} lamports", entry_fee);
        Ok(())
    }

    /// Initialize daily leaderboard for a specific day
    pub fn initialize_daily_leaderboard(ctx: Context<InitializeDailyLeaderboard>, day: i64) -> Result<()> {
        let leaderboard = &mut ctx.accounts.daily_leaderboard;
        leaderboard.day = day;
        leaderboard.entries = vec![];
        leaderboard.is_finalized = false;
        leaderboard.total_prize_pool = 0;

        msg!("Daily leaderboard initialized for day: {}", day);
        Ok(())
    }

    /// Pay entry fee and start a game (with rate limiting)
    pub fn pay_entry_fee(ctx: Context<PayEntryFee>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let player_stats = &mut ctx.accounts.player_stats;
        let daily_leaderboard = &mut ctx.accounts.daily_leaderboard;

        // Rate limiting check
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        // Check cooldown
        if current_timestamp - player_stats.last_game_timestamp < game_state.cooldown_seconds {
            return Err(ErrorCode::CooldownActive.into());
        }

        // Clean up old game history (older than 1 hour)
        let one_hour_ago = current_timestamp - 3600;
        player_stats.game_history.retain(|&timestamp| timestamp > one_hour_ago);

        // Check rate limit
        if player_stats.game_history.len() >= game_state.max_games_per_hour as usize {
            return Err(ErrorCode::RateLimitExceeded.into());
        }

        // Transfer entry fee from player to treasury
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.treasury.key(),
            game_state.entry_fee,
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
        )?;

        // Split entry fee: 75% to daily pot, 25% to dev
        let pot_amount = (game_state.entry_fee * game_state.pot_allocation_percent as u64) / 100;
        let dev_amount = game_state.entry_fee - pot_amount;

        game_state.daily_pot += pot_amount;
        game_state.dev_revenue += dev_amount;
        daily_leaderboard.total_prize_pool += pot_amount;
        game_state.total_games_played += 1;

        // Update player stats
        player_stats.last_game_timestamp = current_timestamp;
        player_stats.game_history.push(current_timestamp);
        player_stats.total_games_played += 1;

        msg!("Entry fee paid! Game #{} | Pot: +{} | Dev: +{}",
             game_state.total_games_played, pot_amount, dev_amount);
        Ok(())
    }

    /// Submit score to daily leaderboard
    pub fn submit_score(ctx: Context<SubmitScore>, score: u64) -> Result<()> {
        let game_state = &ctx.accounts.game_state;
        let daily_leaderboard = &mut ctx.accounts.daily_leaderboard;
        let player = ctx.accounts.player.key();

        require!(!daily_leaderboard.is_finalized, ErrorCode::LeaderboardFinalized);

        // Calculate tokens earned
        let tokens_earned = std::cmp::min(score, game_state.max_tokens_per_game);

        // Find existing entry for this player
        if let Some(entry) = daily_leaderboard.entries.iter_mut().find(|e| e.player == player) {
            // Update only if new score is higher
            if score > entry.score {
                entry.score = score;
                entry.tokens_earned = tokens_earned;
                entry.games_played += 1;
                msg!("Updated score for {}: {} (new best!)", player, score);
            } else {
                entry.games_played += 1;
                msg!("Score submitted for {}: {} (not new best)", player, score);
            }
        } else {
            // Add new entry
            daily_leaderboard.entries.push(LeaderboardEntry {
                player,
                score,
                tokens_earned,
                games_played: 1,
            });
            msg!("New leaderboard entry for {}: {}", player, score);
        }

        // Sort leaderboard by score (descending)
        daily_leaderboard.entries.sort_by(|a, b| b.score.cmp(&a.score));

        // Keep only top entries (slightly more than needed for buffer)
        if daily_leaderboard.entries.len() > MAX_LEADERBOARD_SIZE + 5 {
            daily_leaderboard.entries.truncate(MAX_LEADERBOARD_SIZE + 5);
        }

        Ok(())
    }

    /// Distribute daily prizes to top 10 players (called at midnight UTC)
    pub fn distribute_daily_prizes(ctx: Context<DistributePrizes>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let daily_leaderboard = &mut ctx.accounts.daily_leaderboard;

        require!(!daily_leaderboard.is_finalized, ErrorCode::AlreadyDistributed);

        let total_pot = daily_leaderboard.total_prize_pool;

        // Prize distribution percentages for ranks 1-10
        let prize_percentages = [25, 18, 13, 10, 8, 7, 6, 5, 4, 4];

        // Mark as finalized
        daily_leaderboard.is_finalized = true;

        msg!("Distributing {} lamports to top {} players", total_pot, MAX_LEADERBOARD_SIZE);

        // Note: Actual SOL distribution would happen in separate transactions
        // This function just marks the leaderboard as finalized
        // Individual winners call claim_prize() to get their share

        game_state.daily_pot = 0; // Reset for next day

        Ok(())
    }

    /// Claim prize for a finalized leaderboard
    pub fn claim_prize(ctx: Context<ClaimPrize>, rank: u8) -> Result<()> {
        let daily_leaderboard = &ctx.accounts.daily_leaderboard;
        let player = ctx.accounts.player.key();

        require!(daily_leaderboard.is_finalized, ErrorCode::LeaderboardNotFinalized);
        require!(rank > 0 && rank <= MAX_LEADERBOARD_SIZE as u8, ErrorCode::InvalidRank);

        // Verify player is at this rank
        let entry = &daily_leaderboard.entries[(rank - 1) as usize];
        require!(entry.player == player, ErrorCode::NotYourPrize);

        // Calculate prize
        let prize_percentages = [25, 18, 13, 10, 8, 7, 6, 5, 4, 4];
        let prize_percent = prize_percentages[(rank - 1) as usize];
        let prize = (daily_leaderboard.total_prize_pool * prize_percent as u64) / 100;

        // Transfer prize from treasury to player
        let seeds = &[
            b"game_state".as_ref(),
            &[*ctx.bumps.get("game_state").unwrap()],
        ];
        let signer = &[&seeds[..]];

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.treasury.key(),
            &ctx.accounts.player.key(),
            prize,
        );

        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.player.to_account_info(),
            ],
            signer,
        )?;

        msg!("Prize claimed! Rank #{}: {} lamports to {}", rank, prize, player);

        Ok(())
    }

    /// Mint NFT trophy for daily winner
    pub fn mint_trophy_nft(ctx: Context<MintTrophyNFT>, rank: u8, day: i64) -> Result<()> {
        let daily_leaderboard = &ctx.accounts.daily_leaderboard;
        let player = ctx.accounts.player.key();

        require!(daily_leaderboard.is_finalized, ErrorCode::LeaderboardNotFinalized);
        require!(rank > 0 && rank <= 3, ErrorCode::OnlyTop3GetNFT); // Only top 3 get NFTs

        // Verify player is at this rank
        let entry = &daily_leaderboard.entries[(rank - 1) as usize];
        require!(entry.player == player, ErrorCode::NotYourPrize);

        // Mint NFT to player
        let seeds = &[
            b"game_state".as_ref(),
            &[*ctx.bumps.get("game_state").unwrap()],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.nft_mint.to_account_info(),
            to: ctx.accounts.player_nft_account.to_account_info(),
            authority: ctx.accounts.game_state.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::mint_to(cpi_ctx, 1)?; // Mint 1 NFT

        msg!("Trophy NFT minted! Rank #{} for day {} to {}", rank, day, player);

        Ok(())
    }

    /// Reward player with $PEW tokens based on score
    pub fn reward_player(ctx: Context<RewardPlayer>, score: u64) -> Result<()> {
        let game_state = &ctx.accounts.game_state;

        // Calculate tokens to reward (capped)
        let tokens_to_reward = std::cmp::min(score, game_state.max_tokens_per_game);
        let amount_with_decimals = tokens_to_reward * 1_000_000_000; // 9 decimals

        // Transfer tokens from treasury to player
        let seeds = &[
            b"game_state".as_ref(),
            &[*ctx.bumps.get("game_state").unwrap()],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.game_state.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, amount_with_decimals)?;

        msg!("Rewarded {} $PEW tokens for score: {}", tokens_to_reward, score);
        Ok(())
    }

    /// Upgrade weapon - tokens are RECYCLED back to treasury (not burned!)
    pub fn upgrade_weapon(ctx: Context<UpgradeWeapon>, level: u8, cost: u64) -> Result<()> {
        require!(level >= 2 && level <= 5, ErrorCode::InvalidWeaponLevel);

        // Transfer tokens back to treasury for redistribution
        let amount_with_decimals = cost * 1_000_000_000;

        let cpi_accounts = Transfer {
            from: ctx.accounts.player_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, amount_with_decimals)?;

        msg!("Upgraded weapon to level {} - {} $PEW tokens recycled to treasury", level, cost);
        Ok(())
    }

    /// Withdraw dev revenue (only callable by dev wallet)
    pub fn withdraw_dev_revenue(ctx: Context<WithdrawDevRevenue>, amount: u64) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;

        require!(amount <= game_state.dev_revenue, ErrorCode::InsufficientDevRevenue);

        // Transfer from treasury to dev wallet
        let seeds = &[
            b"game_state".as_ref(),
            &[*ctx.bumps.get("game_state").unwrap()],
        ];
        let signer = &[&seeds[..]];

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.treasury.key(),
            &ctx.accounts.dev_wallet.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.dev_wallet.to_account_info(),
            ],
            signer,
        )?;

        game_state.dev_revenue -= amount;

        msg!("Dev revenue withdrawn: {} lamports", amount);
        Ok(())
    }
}

// Instruction contexts

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameState::INIT_SPACE,
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,

    pub token_mint: Account<'info, Mint>,

    /// CHECK: Treasury wallet for SOL
    pub treasury: AccountInfo<'info>,

    /// CHECK: Dev wallet for revenue
    pub dev_wallet: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(day: i64)]
pub struct InitializeDailyLeaderboard<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DailyLeaderboard::INIT_SPACE,
        seeds = [b"leaderboard", &day.to_le_bytes()],
        bump
    )]
    pub daily_leaderboard: Account<'info, DailyLeaderboard>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayEntryFee<'info> {
    #[account(mut, seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PlayerStats::INIT_SPACE,
        seeds = [b"player_stats", player.key().as_ref()],
        bump
    )]
    pub player_stats: Account<'info, PlayerStats>,

    #[account(mut)]
    pub daily_leaderboard: Account<'info, DailyLeaderboard>,

    /// CHECK: Treasury wallet
    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitScore<'info> {
    #[account(seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    #[account(mut)]
    pub daily_leaderboard: Account<'info, DailyLeaderboard>,

    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct DistributePrizes<'info> {
    #[account(mut, seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    #[account(mut)]
    pub daily_leaderboard: Account<'info, DailyLeaderboard>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    pub daily_leaderboard: Account<'info, DailyLeaderboard>,

    /// CHECK: Treasury wallet
    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTrophyNFT<'info> {
    #[account(seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    pub daily_leaderboard: Account<'info, DailyLeaderboard>,

    #[account(mut)]
    pub nft_mint: Account<'info, Mint>,

    #[account(mut)]
    pub player_nft_account: Account<'info, TokenAccount>,

    pub player: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RewardPlayer<'info> {
    #[account(seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpgradeWeapon<'info> {
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub player: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawDevRevenue<'info> {
    #[account(mut, seeds = [b"game_state"], bump, has_one = dev_wallet)]
    pub game_state: Account<'info, GameState>,

    /// CHECK: Treasury wallet
    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    /// CHECK: Dev wallet (verified by has_one)
    #[account(mut)]
    pub dev_wallet: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// State

#[account]
#[derive(InitSpace)]
pub struct GameState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub treasury: Pubkey,
    pub dev_wallet: Pubkey,
    pub total_games_played: u64,
    pub max_tokens_per_game: u64,
    pub entry_fee: u64,
    pub max_games_per_hour: u8,
    pub cooldown_seconds: i64,
    pub daily_pot: u64,
    pub dev_revenue: u64,
    pub pot_allocation_percent: u8, // e.g., 75 for 75%
}

#[account]
#[derive(InitSpace)]
pub struct PlayerStats {
    pub last_game_timestamp: i64,
    #[max_len(10)]
    pub game_history: Vec<i64>,
    pub total_games_played: u64,
}

#[account]
#[derive(InitSpace)]
pub struct DailyLeaderboard {
    pub day: i64, // Unix timestamp of day start (midnight UTC)
    #[max_len(15)] // Store a few more than top 10 for buffer
    pub entries: Vec<LeaderboardEntry>,
    pub is_finalized: bool,
    pub total_prize_pool: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct LeaderboardEntry {
    pub player: Pubkey,
    pub score: u64,
    pub tokens_earned: u64,
    pub games_played: u64,
}

// Errors

#[error_code]
pub enum ErrorCode {
    #[msg("Cooldown active. Please wait before playing again.")]
    CooldownActive,

    #[msg("Rate limit exceeded. Maximum games per hour reached.")]
    RateLimitExceeded,

    #[msg("Invalid weapon level. Must be between 2 and 5.")]
    InvalidWeaponLevel,

    #[msg("Leaderboard already finalized and distributed.")]
    AlreadyDistributed,

    #[msg("Leaderboard not yet finalized.")]
    LeaderboardNotFinalized,

    #[msg("Leaderboard is finalized, no more submissions.")]
    LeaderboardFinalized,

    #[msg("Invalid rank. Must be 1-10.")]
    InvalidRank,

    #[msg("This prize is not yours.")]
    NotYourPrize,

    #[msg("Only top 3 receive NFT trophies.")]
    OnlyTop3GetNFT,

    #[msg("Insufficient dev revenue to withdraw.")]
    InsufficientDevRevenue,
}
