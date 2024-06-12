use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::extension::transfer_fee::instruction::withdraw_withheld_tokens_from_accounts,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::state::AuthorityAccount;

#[derive(Accounts)]
pub struct WithdrawFromTokenAccountCtx<'info> {
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

pub fn withdraw_from_token_account_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, WithdrawFromTokenAccountCtx<'info>>,
) -> Result<()> {
    let pubkey_refs: Vec<&Pubkey> = ctx.remaining_accounts.iter().map(|f| f.key).collect();
    let pubkey_refs_slice: &[&Pubkey] = &pubkey_refs;
    let ix = withdraw_withheld_tokens_from_accounts(
        ctx.accounts.token_program.key,
        &ctx.accounts.mint.key(),
        &ctx.accounts.authority_token_account.key(),
        &ctx.accounts.authority.key(),
        &[],
        pubkey_refs_slice,
    )?;
    let bump = &[ctx.accounts.authority.load()?.bump];
    let mint_key = ctx.accounts.mint.key();
    let seeds: &[&[u8]] = &[b"authority".as_ref(), mint_key.as_ref(), bump];
    let signer_seeds = &[&seeds[..]];
    let mut account_info = vec![
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.authority_token_account.to_account_info(),
        ctx.accounts.authority.to_account_info(),
    ];
    account_info.extend_from_slice(ctx.remaining_accounts);

    invoke_signed(&ix, &account_info, signer_seeds)?;
    Ok(())
}
