import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { defineString } from "firebase-functions/params";
import { onInit } from "firebase-functions/v1";
import { Helius } from "helius-sdk";
import { Database } from "../types/supabase";
import { Token } from "./token";
import TokenIdl from "./token.json";
import { TokenTransferHook } from "./token_transfer_hook";
import TransferHookIdl from "./token_transfer_hook.json";
import admin = require("firebase-admin");

admin.initializeApp();

export let helius: Helius;

export let supabase: SupabaseClient<Database>;
export const programEventAuthority = defineString("PROGRAM_EVENT_AUTHORITY");
const heliusApiKey = defineString("HELIUS_API_KEY");
const supabaseApiKey = defineString("SUPABASE_SECRET_KEY");
export const prod = false;
export const distributor = Keypair.generate();
export let transferHookProgram: Program<TokenTransferHook>;
export let tokenCreatorProgram: Program<Token>;
onInit(() => {
  helius = new Helius(heliusApiKey.value(), prod ? "mainnet-beta" : "devnet");
  transferHookProgram = new Program(
    TransferHookIdl as unknown as TokenTransferHook,
    new AnchorProvider(helius.connection, new Wallet(distributor), {
      commitment: "confirmed",
    })
  );
  tokenCreatorProgram = new Program(
    TokenIdl as unknown as Token,
    new AnchorProvider(helius.connection, new Wallet(distributor), {
      commitment: "confirmed",
    })
  );
  supabase = createClient<Database>(
    "https://cpbvuplzuyskuoefnxwy.supabase.co",
    supabaseApiKey.value()
  );
});
