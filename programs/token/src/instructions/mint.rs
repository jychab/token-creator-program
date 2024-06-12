use crate::{state::*, utils::update_fee_account, ID};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{mint_to, Mint, MintTo, TokenAccount, TokenInterface},
};
use solana_program::sysvar;
#[derive(Accounts)]
pub struct MintCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub source_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        constraint = mint.key() == authority.load()?.mint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [b"authority", mint.key().as_ref()],
        bump = authority.load()?.bump,
    )]
    pub authority: AccountLoader<'info, AuthorityAccount>,

    /// CHECK: Checked by Cpi
    #[account(mut)]
    pub authority_fee_account: UncheckedAccount<'info>,

    /// CHECK: Checked by Cpi
    #[account(mut)]
    pub payer_fee_account: UncheckedAccount<'info>,

    /// CHECK: Checked by cpi
    #[account(
       address = TOKEN_TRANSFER_HOOK_PROGRAM_ID,
    )]
    pub token_transfer_hook_program: UncheckedAccount<'info>,

    /// CHECK: Checked by cpi
    #[account(mut)]
    pub program_fee_account: UncheckedAccount<'info>,

    /// CHECK: Checked by cpi
    #[account(address = sysvar::instructions::id())]
    pub instruction_sysvar_account: UncheckedAccount<'info>,

    /// CHECK: Checked by cpi
    pub event_authority: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn mint_to_handler(ctx: Context<MintCtx>, amount: u64) -> Result<()> {
    // create pda for minter (initial minter)
    update_fee_account(
        ctx.accounts.payer.key(),
        Some(ID),
        None,
        None,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.payer_fee_account.to_account_info(),
        &ctx.accounts.mint.to_account_info(),
        &ctx.accounts.instruction_sysvar_account.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.event_authority.to_account_info(),
        &ctx.accounts.token_transfer_hook_program.to_account_info(),
    )?;

    // create pda for authority (this is the address fees will be collected from)
    update_fee_account(
        ctx.accounts.authority.key(),
        Some(ID),
        None,
        None,
        &ctx.accounts.payer.to_account_info(),
        &&ctx.accounts.authority_fee_account.to_account_info(),
        &ctx.accounts.mint.to_account_info(),
        &ctx.accounts.instruction_sysvar_account.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.event_authority.to_account_info(),
        &ctx.accounts.token_transfer_hook_program.to_account_info(),
    )?;

    // create pda for program (this is the default adderss)
    update_fee_account(
        ID,
        Some(ID),
        None,
        None,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.program_fee_account.to_account_info(),
        &ctx.accounts.mint.to_account_info(),
        &ctx.accounts.instruction_sysvar_account.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.event_authority.to_account_info(),
        &ctx.accounts.token_transfer_hook_program.to_account_info(),
    )?;

    let mint_key = ctx.accounts.mint.key();
    let seeds = &[
        b"authority",
        mint_key.as_ref(),
        &[ctx.accounts.authority.load()?.bump],
    ];
    let signer = &[&seeds[..]];
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.source_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        )
        .with_signer(signer),
        amount,
    )?;

    Ok(())
}
