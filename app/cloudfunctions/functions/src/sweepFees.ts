import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { HttpsError } from "firebase-functions/v1/https";
import { supabase, tokenCreatorProgram } from "./utils";

export async function sweepFees() {
  const { data: accountsToWithdrawFrom, error } = await supabase
    .from("transactions")
    .select("mint, destination_token_account, id")
    .neq("collected", null);
  if (error) {
    throw new HttpsError("aborted", error.message);
  }

  let mint = new PublicKey(accountsToWithdrawFrom[0].mint);
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority"), mint.toBuffer()],
    tokenCreatorProgram.programId
  );
  const authorityTokenAccount = getAssociatedTokenAddressSync(
    mint,
    authority,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  // Process accounts in batches of 40
  for (let i = 0; i < accountsToWithdrawFrom.length; i += 40) {
    const batch = accountsToWithdrawFrom.slice(i, i + 40);
    await processBatch(batch, mint, authorityTokenAccount);
  }

  // sweep from mint account
  await tokenCreatorProgram.methods
    .withdrawWithheldFromMint()
    .accounts({
      mint: mint,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      authorityTokenAccount: authorityTokenAccount,
    })
    .rpc();
}

// Helper function to process a batch of accounts
async function processBatch(
  batch: {
    mint: string;
    destination_token_account: string;
    id: number;
  }[],
  mint: PublicKey,
  authorityTokenAccount: PublicKey
) {
  // sweep from token account
  const transactionSignature = await tokenCreatorProgram.methods
    .withdrawWithheldFromTokenAccounts()
    .accounts({
      mint: mint,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      authorityTokenAccount: authorityTokenAccount,
    })
    .remainingAccounts(
      batch.map((acc) => {
        return {
          pubkey: new PublicKey(acc.destination_token_account),
          isSigner: false,
          isWritable: true,
        };
      })
    )
    .rpc();

  if (transactionSignature) {
    await supabase
      .from("transactions")
      .update({
        collected: transactionSignature,
      })
      .in(
        "id",
        batch.map((acc) => acc.id)
      );
  }
}
