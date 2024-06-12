use anchor_lang::{prelude::*, system_program};
use anchor_spl::token_interface::{
    token_metadata_initialize, Mint, TokenInterface, TokenMetadataInitialize,
};

use crate::state::AuthorityAccount;

#[derive(Accounts)]
pub struct CreateMintMetadataCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        constraint = mint.key() == authority.load()?.mint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        seeds = [b"authority", mint.key().as_ref()],
        bump = authority.load()?.bump,
    )]
    pub authority: AccountLoader<'info, AuthorityAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn create_mint_metadata_handler(
    ctx: Context<CreateMintMetadataCtx>,
    lamports: u64,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    let bump = &[ctx.accounts.authority.load()?.bump];
    let mint_key = ctx.accounts.mint.key();
    let seeds: &[&[u8]] = &[b"authority".as_ref(), mint_key.as_ref(), bump];
    let signer_seeds = &[&seeds[..]];

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        lamports,
    )?;

    token_metadata_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TokenMetadataInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                metadata: ctx.accounts.mint.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        )
        .with_signer(signer_seeds),
        name,
        symbol,
        uri,
    )?;
    Ok(())
}
