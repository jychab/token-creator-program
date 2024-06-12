use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod utils;

pub use instructions::*;

declare_id!("9pw2AQd1yBosbbncXzzFLpmqyWfGCZkrmY8EZeJVP7z2");

#[program]
pub mod token {

    use super::*;

    pub fn create_mint(
        ctx: Context<CreateMintCtx>,
        random_key: Pubkey,
        fee_basis_pts: u16,
        max_fee: u64,
        decimals: u8,
    ) -> Result<()> {
        instructions::create_mint::create_mint_handler(
            ctx,
            random_key,
            fee_basis_pts,
            max_fee,
            decimals,
        )
    }

    pub fn create_mint_metadata(
        ctx: Context<CreateMintMetadataCtx>,
        lamports: u64,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::create_mint_metadata::create_mint_metadata_handler(
            ctx, lamports, name, symbol, uri,
        )
    }

    pub fn mint_to(ctx: Context<MintCtx>, amount: u64) -> Result<()> {
        instructions::mint::mint_to_handler(ctx, amount)
    }

    pub fn claim_fees<'info>(ctx: Context<'_, '_, '_, 'info, ClaimFeesCtx<'info>>) -> Result<()> {
        instructions::claim_fees::claim_fees_handler(ctx)
    }

    pub fn withdraw_withheld_from_mint(ctx: Context<WithdrawFromMintCtx>) -> Result<()> {
        instructions::withdraw_from_mint::withdraw_from_mint_handler(ctx)
    }

    pub fn withdraw_withheld_from_token_accounts<'info>(
        ctx: Context<'_, '_, '_, 'info, WithdrawFromTokenAccountCtx<'info>>,
    ) -> Result<()> {
        instructions::withdraw_from_token_account::withdraw_from_token_account_handler(ctx)
    }
}
