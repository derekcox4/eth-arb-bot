use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

declare_id!("BoBoGameProgramAddressWillBeGeneratedHere1111");

#[program]
pub mod bobo_game {
    use super::*;

    /// Initialize the game state and treasury
    pub fn initialize(ctx: Context<Initialize>, max_tokens_per_game: u64) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        game_state.authority = ctx.accounts.authority.key();
        game_state.token_mint = ctx.accounts.token_mint.key();
        game_state.treasury = ctx.accounts.treasury.key();
        game_state.lottery_pool = 0;
        game_state.total_games_played = 0;
        game_state.max_tokens_per_game = max_tokens_per_game;
        game_state.entry_fee = 10_000_000; // 0.01 SOL in lamports
        Ok(())
    }

    /// Pay entry fee and start a game
    pub fn pay_entry_fee(ctx: Context<PayEntryFee>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;

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

        // 50% of entry fee goes to lottery pool
        game_state.lottery_pool += game_state.entry_fee / 2;
        game_state.total_games_played += 1;

        msg!("Entry fee paid! Game #{}", game_state.total_games_played);
        Ok(())
    }

    /// Reward player with tokens based on score
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

        msg!("Rewarded {} BOBO tokens for score: {}", tokens_to_reward, score);
        Ok(())
    }

    /// Burn tokens to enter lottery
    pub fn burn_for_lottery(ctx: Context<BurnForLottery>, amount: u64) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;

        require!(amount >= 50, ErrorCode::InsufficientBurnAmount);

        // Burn tokens
        let amount_with_decimals = amount * 1_000_000_000;

        let cpi_accounts = Burn {
            mint: ctx.accounts.token_mint.to_account_info(),
            from: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, amount_with_decimals)?;

        // Lottery logic (simplified - use VRF for production)
        let clock = Clock::get()?;
        let random_seed = clock.unix_timestamp as u64;
        let win_chance = if amount >= 500 { 25 } else { 10 }; // 10% or 25% based on amount

        let won = (random_seed % 100) < win_chance;

        if won {
            // Transfer lottery prize to winner
            let prize = game_state.lottery_pool / 10; // 10% of pool

            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.treasury.key(),
                &ctx.accounts.player.key(),
                prize,
            );

            let seeds = &[
                b"game_state".as_ref(),
                &[*ctx.bumps.get("game_state").unwrap()],
            ];
            let signer = &[&seeds[..]];

            anchor_lang::solana_program::program::invoke_signed(
                &ix,
                &[
                    ctx.accounts.treasury.to_account_info(),
                    ctx.accounts.player.to_account_info(),
                ],
                signer,
            )?;

            game_state.lottery_pool -= prize;

            msg!("🎉 WINNER! Prize: {} lamports", prize);
        } else {
            msg!("Better luck next time!");
        }

        msg!("Burned {} BOBO tokens. Won: {}", amount, won);
        Ok(())
    }

    /// Upgrade weapon (just burns tokens, upgrade handled client-side)
    pub fn upgrade_weapon(ctx: Context<UpgradeWeapon>, level: u8, cost: u64) -> Result<()> {
        require!(level >= 2 && level <= 5, ErrorCode::InvalidWeaponLevel);

        // Burn tokens for upgrade
        let amount_with_decimals = cost * 1_000_000_000;

        let cpi_accounts = Burn {
            mint: ctx.accounts.token_mint.to_account_info(),
            from: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, amount_with_decimals)?;

        msg!("Upgraded weapon to level {}", level);
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

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayEntryFee<'info> {
    #[account(mut, seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    /// CHECK: Treasury wallet
    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RewardPlayer<'info> {
    #[account(mut, seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnForLottery<'info> {
    #[account(mut, seeds = [b"game_state"], bump)]
    pub game_state: Account<'info, GameState>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury wallet
    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpgradeWeapon<'info> {
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,

    pub player: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// State

#[account]
#[derive(InitSpace)]
pub struct GameState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub treasury: Pubkey,
    pub lottery_pool: u64,
    pub total_games_played: u64,
    pub max_tokens_per_game: u64,
    pub entry_fee: u64,
}

// Errors

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient burn amount. Minimum is 50 tokens.")]
    InsufficientBurnAmount,

    #[msg("Invalid weapon level. Must be between 2 and 5.")]
    InvalidWeaponLevel,
}
