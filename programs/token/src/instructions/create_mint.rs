use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{
        initialize_mint, metadata_pointer_initialize, transfer_fee_initialize,
        transfer_hook_initialize, InitializeMint, MetadataPointerInitialize, TokenInterface,
        TransferFeeInitialize, TransferHookInitialize,
    },
};

use crate::state::{AuthorityAccount, AUTHORITY_ACCOUNT_SIZE, TOKEN_TRANSFER_HOOK_PROGRAM_ID};

#[derive(Accounts)]
#[instruction(random_key:Pubkey)]
pub struct CreateMintCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [b"mint", random_key.as_ref()],
        bump,
        owner = Token2022::id(),
        space = 414,
    )]
    /// CHECK: Mint to be created
    pub mint: AccountInfo<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [b"authority", mint.key().as_ref()],
        space = AUTHORITY_ACCOUNT_SIZE,
        bump,
    )]
    pub authority: AccountLoader<'info, AuthorityAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_mint_handler(
    ctx: Context<CreateMintCtx>,
    _random_key: Pubkey,
    fee_basis_pts: u16,
    max_fee: u64,
    decimals: u8,
) -> Result<()> {
    let mint_key = ctx.accounts.mint.key();
    let authority = &mut ctx.accounts.authority.load_init()?;
    authority.mint = mint_key;
    authority.bump = ctx.bumps.authority;

    // initialize transfer fee
    transfer_fee_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferFeeInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        Some(&ctx.accounts.authority.key()),
        Some(&ctx.accounts.authority.key()),
        fee_basis_pts,
        max_fee,
    )?;

    // initialize transfer hook
    transfer_hook_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferHookInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        Some(ctx.accounts.authority.key()),
        Some(TOKEN_TRANSFER_HOOK_PROGRAM_ID),
    )?;

    // initialize mint metadata pointer
    metadata_pointer_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MetadataPointerInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        Some(ctx.accounts.authority.key()),
        Some(ctx.accounts.mint.key()),
    )?;

    // intialize mint
    initialize_mint(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            InitializeMint {
                mint: ctx.accounts.mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        decimals,
        &ctx.accounts.authority.key(),
        None,
    )?;

    Ok(())
}
