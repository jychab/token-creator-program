use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::{cmp_pubkeys, onchain::invoke_transfer_checked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    state::{AuthorityAccount, FeeAccount},
    utils::update_fee_account,
};

#[derive(Accounts)]
pub struct ClaimFeesCtx<'info> {
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
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK:
    pub receiver: AccountInfo<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    #[account(
		init_if_needed,
		payer = payer,
		associated_token::authority = authority,
		associated_token::mint = mint,
	)]
    pub authority_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
		init_if_needed,
		payer = payer,
		associated_token::authority = receiver,
		associated_token::mint = mint,
	)]
    pub receiver_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn claim_fees_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, ClaimFeesCtx<'info>>,
) -> Result<()> {
    let pda_authority = ctx.remaining_accounts.get(0).unwrap();
    let source_fee_account = ctx.remaining_accounts.get(1).unwrap();
    let receiver_fee_account = ctx.remaining_accounts.get(2).unwrap();
    let payer_fee_account = ctx.remaining_accounts.get(3).unwrap();
    let boss_fee_account = ctx.remaining_accounts.get(4).unwrap();
    let instruction_sysvar_account = ctx.remaining_accounts.get(5).unwrap();
    let extra_meta_account = ctx.remaining_accounts.get(6).unwrap();
    let event_authority = ctx.remaining_accounts.get(7).unwrap();
    let transfer_hook_program = ctx.remaining_accounts.get(8).unwrap();

    let receiver_fee_account_data =
        FeeAccount::try_deserialize(&mut receiver_fee_account.try_borrow_mut_data()?.as_ref())?;
    let fees = receiver_fee_account_data.unclaimed_fees;
    let mut claiming_fee = 0;

    if !cmp_pubkeys(&ctx.accounts.payer.key, &ctx.accounts.receiver.key) {
        let numerator = (fees as u128).checked_mul(500).unwrap();
        claiming_fee = numerator
            .checked_add(10_000)
            .unwrap()
            .checked_sub(1)
            .unwrap()
            .checked_div(10_000)
            .unwrap()
            .try_into() // guaranteed to be okay
            .ok()
            .unwrap();
        // update payer fee account
        update_fee_account(
            ctx.accounts.payer.key(),
            None,
            Some(0),
            Some(claiming_fee),
            &ctx.accounts.payer.to_account_info(),
            payer_fee_account,
            &ctx.accounts.mint.to_account_info(),
            instruction_sysvar_account,
            &ctx.accounts.system_program.to_account_info(),
            event_authority,
            transfer_hook_program,
        )?;
    }

    let fees_after_claiming_fee = fees.saturating_sub(claiming_fee);
    let bump = &[ctx.accounts.authority.load()?.bump];
    let mint_key = ctx.accounts.mint.key();
    let seeds: &[&[u8]] = &[b"authority".as_ref(), mint_key.as_ref(), bump];
    let signer_seeds = &[&seeds[..]];

    invoke_transfer_checked(
        ctx.accounts.token_program.key,
        ctx.accounts.authority_token_account.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.receiver_token_account.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        &[
            transfer_hook_program.to_account_info(),
            pda_authority.to_account_info(),
            source_fee_account.to_account_info(),
            receiver_fee_account.to_account_info(),
            boss_fee_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            instruction_sysvar_account.to_account_info(),
            extra_meta_account.to_account_info(),
            event_authority.to_account_info(),
        ],
        fees_after_claiming_fee,
        ctx.accounts.mint.decimals,
        signer_seeds,
    )?;

    // update receiver fee account
    update_fee_account(
        ctx.accounts.receiver.key(),
        None,
        Some(fees_after_claiming_fee),
        None,
        &ctx.accounts.payer.to_account_info(),
        receiver_fee_account,
        &ctx.accounts.mint.to_account_info(),
        instruction_sysvar_account,
        &ctx.accounts.system_program.to_account_info(),
        event_authority,
        transfer_hook_program,
    )?;

    Ok(())
}
