use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::extension::transfer_fee::instruction::withdraw_withheld_tokens_from_mint,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::state::AuthorityAccount;

#[derive(Accounts)]
pub struct WithdrawFromMintCtx<'info> {
    #[account(
		mut,
        seeds = [b"authority", mint.key().as_ref()],
        bump = authority.load()?.bump,
    )]
    pub authority: AccountLoader<'info, AuthorityAccount>,
    #[account(
        mut,
        constraint = mint.key() == authority.load()?.mint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    #[account(
		init_if_needed,
		payer = payer,
		associated_token::authority = authority,
		associated_token::mint = mint,
	)]
    pub authority_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw_from_mint_handler(ctx: Context<WithdrawFromMintCtx>) -> Result<()> {
    let ix = withdraw_withheld_tokens_from_mint(
        ctx.accounts.token_program.key,
        &ctx.accounts.mint.key(),
        &ctx.accounts.authority_token_account.key(),
        &ctx.accounts.authority.key(),
        &[],
    )?;
    let bump = &[ctx.accounts.authority.load()?.bump];
    let mint_key = ctx.accounts.mint.key();
    let seeds: &[&[u8]] = &[b"authority".as_ref(), mint_key.as_ref(), bump];
    let signer_seeds = &[&seeds[..]];
    invoke_signed(
        &ix,
        &[
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.authority_token_account.to_account_info(),
            ctx.accounts.authority.to_account_info(),
        ],
        signer_seeds,
    )?;
    Ok(())
}
