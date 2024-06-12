import * as anchor from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  LENGTH_SIZE,
  MAX_FEE_BASIS_POINTS,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedWithFeeAndTransferHookInstruction,
  getAssociatedTokenAddressSync,
  getExtraAccountMetaAddress,
} from "@solana/spl-token";
import { TokenMetadata, pack } from "@solana/spl-token-metadata";
import {
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Token } from "../target/types/token";
import { TokenTransferHook } from "./token_transfer_hook";
import Idl from "./token_transfer_hook.json";

describe("transfer-hook", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Token as anchor.Program<Token>;
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;
  const transferHookProgram = new anchor.Program<TokenTransferHook>(
    Idl as TokenTransferHook,
    provider
  );

  // Generate keypair to use as address for the transfer-hook enabled mint
  const random_key = Keypair.generate().publicKey;
  const [mint] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), random_key.toBuffer()],
    program.programId
  );
  // Sender token account address
  const sourceTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  // Recipient token account address
  const recipient = Keypair.fromSecretKey(
    Buffer.from([
      225, 66, 240, 160, 100, 176, 216, 156, 98, 248, 136, 34, 108, 179, 97, 33,
      245, 103, 165, 252, 153, 131, 20, 190, 60, 85, 11, 240, 176, 184, 50, 183,
      208, 37, 214, 8, 236, 36, 232, 48, 167, 48, 193, 156, 104, 55, 81, 126,
      209, 94, 147, 84, 22, 209, 65, 127, 206, 246, 2, 145, 207, 168, 186, 29,
    ])
  );
  const destinationTokenAccount = getAssociatedTokenAddressSync(
    mint,
    recipient.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const newRecipient = getAssociatedTokenAddressSync(
    mint,
    new PublicKey("4gfBPGmnvGCpgnStMfwqxBbbdmKncGLy6DKN18qZVuH4"),
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const feeBasisPts = 5;
  const maxFee = 10000000; // max_amount of mint

  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority"), mint.toBuffer()],
    program.programId
  );

  it("Create Mint Account with Transfer Hook Extension and Transfer Fee Extension", async () => {
    const metaData: TokenMetadata = {
      updateAuthority: authority,
      mint: mint,
      name: "OPOS",
      symbol: "OPOS",
      uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json",
      additionalMetadata: [["description", "Only Possible On Solana"]],
    };
    const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
    // Size of metadata
    const metadataLen = pack(metaData).length;
    const additional_lamport =
      await connection.getMinimumBalanceForRentExemption(
        metadataExtension + metadataLen
      );
    const ix1 = await program.methods
      .createMint(random_key, feeBasisPts, new anchor.BN(maxFee), 9)
      .accounts({
        payer: wallet.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();
    const ix2 = await program.methods
      .createMintMetadata(
        new anchor.BN(additional_lamport),
        metaData.name,
        metaData.symbol,
        metaData.uri
      )
      .accounts({
        payer: wallet.publicKey,
        mint: mint,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();
    const transaction = new Transaction().add(ix1).add(ix2);
    const txSig = await sendAndConfirmTransaction(
      provider.connection,
      transaction,
      [wallet.payer],
      { skipPreflight: true }
    );
    console.log(`Transaction Signature: ${txSig}`);
  });

  // Create the two token accounts for the transfer-hook enabled mint
  // Fund the sender token account with 100 tokens
  it("Create Token Accounts and Mint Tokens to Source", async () => {
    // 100 tokens
    const amount = 100 * 10 ** 9;
    const ix = await program.methods
      .mintTo(new anchor.BN(amount))
      .accounts({
        payer: wallet.publicKey,
        sourceTokenAccount: sourceTokenAccount,
        eventAuthority: PublicKey.findProgramAddressSync(
          [Buffer.from("__event_authority")],
          transferHookProgram.programId
        )[0],
        programFeeAccount: PublicKey.findProgramAddressSync(
          [Buffer.from("fee"), mint.toBuffer(), program.programId.toBuffer()],
          transferHookProgram.programId
        )[0],
        payerFeeAccount: PublicKey.findProgramAddressSync(
          [Buffer.from("fee"), mint.toBuffer(), wallet.publicKey.toBuffer()],
          transferHookProgram.programId
        )[0],
        authorityFeeAccount: PublicKey.findProgramAddressSync(
          [Buffer.from("fee"), mint.toBuffer(), authority.toBuffer()],
          transferHookProgram.programId
        )[0],
        mint: mint,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();
    const transaction = new Transaction().add(ix);
    const txSig = await sendAndConfirmTransaction(
      provider.connection,
      transaction,
      [wallet.payer],
      {
        skipPreflight: true,
        commitment: "confirmed",
      }
    );
    console.log("Transaction Signature:", txSig);
  });

  it("Create ExtraAccountMetaList Account", async () => {
    const initializeExtraAccountMetaListInstruction =
      await transferHookProgram.methods
        .initializeExtraAccountMetaList(
          new anchor.BN(anchor.web3.LAMPORTS_PER_SOL)
        )
        .accounts({
          payer: wallet.publicKey,
          programFeeAccount: PublicKey.findProgramAddressSync(
            [Buffer.from("fee"), mint.toBuffer(), program.programId.toBuffer()],
            transferHookProgram.programId
          )[0],
          authorityFeeAccount: PublicKey.findProgramAddressSync(
            [Buffer.from("fee"), mint.toBuffer(), authority.toBuffer()],
            transferHookProgram.programId
          )[0],
          minterFeeAccount: PublicKey.findProgramAddressSync(
            [Buffer.from("fee"), mint.toBuffer(), wallet.publicKey.toBuffer()],
            transferHookProgram.programId
          )[0],
          mint: mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();

    const transaction = new Transaction().add(
      initializeExtraAccountMetaListInstruction
    );

    const txSig = await sendAndConfirmTransaction(
      provider.connection,
      transaction,
      [wallet.payer],
      {
        skipPreflight: true,
        commitment: "confirmed",
      }
    );
    console.log("Transaction Signature:", txSig);
  });

  it("Create Desitination ATA", async () => {
    // create ATA
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        destinationTokenAccount,
        recipient.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    const sig = await sendAndConfirmTransaction(
      connection,
      tx,
      [wallet.payer],
      { skipPreflight: true }
    );
    console.log("Transfer Signature:", sig);
  });

  it("Transfer Hook with Extra Account Meta", async () => {
    // 1 tokens
    const amount = 1 * 10 ** 9;
    const bigIntAmount = BigInt(amount);
    const fee =
      (bigIntAmount * BigInt(feeBasisPts)) / BigInt(MAX_FEE_BASIS_POINTS);
    // Determine fee charged
    const feeCharged = fee > maxFee ? maxFee : fee;
    // Standard token transfer instruction
    const transferInstruction =
      await createTransferCheckedWithFeeAndTransferHookInstruction(
        connection,
        sourceTokenAccount,
        mint,
        destinationTokenAccount,
        wallet.publicKey,
        bigIntAmount,
        9,
        BigInt(feeCharged),
        [],
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );

    const transaction = new Transaction().add(transferInstruction);

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer],
      { skipPreflight: true }
    );
    console.log("Transfer Signature:", txSig);
  });

  it("Create Desitination ATA 2", async () => {
    await connection.requestAirdrop(
      recipient.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    // create ATA
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        recipient.publicKey,
        newRecipient,
        new PublicKey("4gfBPGmnvGCpgnStMfwqxBbbdmKncGLy6DKN18qZVuH4"),
        mint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [recipient],
      {
        skipPreflight: true,
      }
    );
    console.log("Transfer Signature:", txSig);
  });

  it("Transfer Hook 2 with Extra Account Meta", async () => {
    // 1 tokens
    const amount = 0.1 * 10 ** 9;
    const bigIntAmount = BigInt(amount);
    const fee =
      (bigIntAmount * BigInt(feeBasisPts)) / BigInt(MAX_FEE_BASIS_POINTS);
    // Determine fee charged
    const feeCharged = fee > maxFee ? maxFee : fee;

    // Standard token transfer instruction
    const transferInstruction =
      await createTransferCheckedWithFeeAndTransferHookInstruction(
        connection,
        destinationTokenAccount,
        mint,
        newRecipient,
        recipient.publicKey,
        bigIntAmount,
        9,
        BigInt(feeCharged),
        [],
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );

    const transaction = new Transaction().add(transferInstruction);

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [recipient],
      { skipPreflight: true }
    );
    console.log("Transfer Signature:", txSig);
  });

  it("Withdraw from Token Account", async () => {
    const authorityTokenAccount = getAssociatedTokenAddressSync(
      mint,
      authority,
      true,
      TOKEN_2022_PROGRAM_ID
    );
    const txSig = await program.methods
      .withdrawWithheldFromTokenAccounts()
      .accounts({
        authorityTokenAccount: authorityTokenAccount,
        mint: mint,
        payer: wallet.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts([
        {
          pubkey: destinationTokenAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: newRecipient,
          isSigner: false,
          isWritable: true,
        },
      ])
      .rpc({ skipPreflight: true });
    console.log("Transfer Signature:", txSig);
  });

  it("Claim Fees", async () => {
    const authorityTokenAccount = getAssociatedTokenAddressSync(
      mint,
      authority,
      true,
      TOKEN_2022_PROGRAM_ID
    );
    const [sourceFeeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee"), mint.toBuffer(), authority.toBuffer()],
      transferHookProgram.programId
    );
    const [payerFeeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee"), mint.toBuffer(), recipient.publicKey.toBuffer()],
      transferHookProgram.programId
    );
    const boss = (
      await transferHookProgram.account.feeAccount.fetch(sourceFeeAccount)
    ).boss;
    const [bossFeeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee"), mint.toBuffer(), boss.toBuffer()],
      transferHookProgram.programId
    );
    const [pdaAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("pda_authority"), mint.toBuffer()],
      transferHookProgram.programId
    );
    const [receiverFeeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee"), mint.toBuffer(), wallet.publicKey.toBuffer()],
      transferHookProgram.programId
    );
    const ix = await program.methods
      .claimFees()
      .accounts({
        authorityTokenAccount: authorityTokenAccount,
        mint: mint,
        payer: recipient.publicKey,
        receiver: wallet.publicKey,
        receiverTokenAccount: sourceTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: pdaAuthority, isSigner: false, isWritable: true },
        { pubkey: sourceFeeAccount, isSigner: false, isWritable: true },
        { pubkey: receiverFeeAccount, isSigner: false, isWritable: true },
        { pubkey: payerFeeAccount, isSigner: false, isWritable: true },
        { pubkey: bossFeeAccount, isSigner: false, isWritable: true },
        {
          pubkey: new PublicKey("Sysvar1nstructions1111111111111111111111111"),
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: getExtraAccountMetaAddress(
            mint,
            transferHookProgram.programId
          ),
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: PublicKey.findProgramAddressSync(
            [Buffer.from("__event_authority")],
            transferHookProgram.programId
          )[0],
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: transferHookProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ])
      .instruction();
    const transaction = new Transaction()
      .add(
        anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 250000 })
      )
      .add(ix);

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [recipient],
      { skipPreflight: true }
    );
    console.log("Transfer Signature:", txSig);
  });
});
