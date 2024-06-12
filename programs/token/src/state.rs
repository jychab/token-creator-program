use anchor_lang::prelude::*;
use solana_program::pubkey;

#[account(zero_copy)]
pub struct AuthorityAccount {
    pub mint: Pubkey,
    pub bump: u8,
}

pub const AUTHORITY_ACCOUNT_SIZE: usize = 8 + 32 + 1;

#[account(zero_copy)]
pub struct FeeAccount {
    pub boss: Pubkey,
    pub unclaimed_fees: u64,
    pub claimed_fees: u64,
    pub bump: u8,
    pub extra_meta_bump: u8,
    pub pda_authority_bump: u8,
    pub padding: [u8; 5],
}

pub const TOKEN_TRANSFER_HOOK_PROGRAM_ID: Pubkey =
    pubkey!("FNeSgS1XbVmbxZgNBHfpXxh6aivuTSf3hSCncT6QDm9T");
