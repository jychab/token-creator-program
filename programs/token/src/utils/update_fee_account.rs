use anchor_lang::prelude::*;
use solana_program::{instruction::Instruction, program::invoke};

pub fn update_fee_account<'info>(
    address: Pubkey,
    new_boss: Option<Pubkey>,
    additional_claimed_fees: Option<u64>,
    additional_unclaimed_fees: Option<u64>,
    payer: &AccountInfo<'info>,
    fee_account: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    instruction_sysvar_account: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    event_authority: &AccountInfo<'info>,
    transfer_hook_program: &AccountInfo<'info>,
) -> Result<()> {
    let mut bytes_data = vec![];
    bytes_data.extend([217, 138, 47, 96, 184, 90, 227, 19]);
    bytes_data.extend(address.to_bytes());
    bytes_data.extend(option_pubkey_to_bytes(new_boss));
    bytes_data.extend(option_u64_to_bytes(additional_claimed_fees));
    bytes_data.extend(option_u64_to_bytes(additional_unclaimed_fees));
    let account_infos: Vec<AccountInfo> = vec![
        payer.to_account_info(),
        fee_account.to_account_info(),
        instruction_sysvar_account.to_account_info(),
        mint.to_account_info(),
        system_program.to_account_info(),
        event_authority.to_account_info(),
        transfer_hook_program.to_account_info(),
    ];
    let accounts = vec![
        AccountMeta::new(account_infos[0].key(), true),
        AccountMeta::new(account_infos[1].key(), false),
        AccountMeta::new_readonly(account_infos[2].key(), false),
        AccountMeta::new_readonly(account_infos[3].key(), false),
        AccountMeta::new_readonly(account_infos[4].key(), false),
        AccountMeta::new_readonly(account_infos[5].key(), false),
        AccountMeta::new_readonly(account_infos[6].key(), false),
    ];
    invoke(
        &Instruction {
            program_id: transfer_hook_program.key(),
            accounts,
            data: bytes_data,
        },
        &account_infos[..],
    )?;
    Ok(())
}

fn option_pubkey_to_bytes(value: Option<Pubkey>) -> Vec<u8> {
    let mut bytes = Vec::new();
    match value {
        Some(v) => {
            bytes.push(1); // Indicator that the Option is Some
            bytes.extend_from_slice(&v.to_bytes()); // Serialize the u64 as little-endian bytes
        }
        None => {
            bytes.push(0); // Indicator that the Option is None
        }
    }
    bytes
}

fn option_u64_to_bytes(value: Option<u64>) -> Vec<u8> {
    let mut bytes = Vec::new();
    match value {
        Some(v) => {
            bytes.push(1); // Indicator that the Option is Some
            bytes.extend_from_slice(&v.to_le_bytes()); // Serialize the u64 as little-endian bytes
        }
        None => {
            bytes.push(0); // Indicator that the Option is None
        }
    }
    bytes
}
