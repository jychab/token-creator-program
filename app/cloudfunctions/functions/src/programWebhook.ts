import * as anchor from "@coral-xyz/anchor";
import { IdlEvent } from "@coral-xyz/anchor/dist/cjs/idl";
import { log } from "firebase-functions/logger";
import { Request, Response } from "firebase-functions/v1";
import { programEventAuthority, supabase, transferHookProgram } from "./utils";

export default async function programWebhook(req: Request, res: Response) {
  if (req.method === "GET") {
    res.status(200).json({ message: "Webhook is running" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }
  try {
    log(JSON.stringify(req.body));
    const data = req.body as any[];

    for (const tx of data) {
      const instructions = tx.instructions as {
        accounts: string[];
        data: string;
        innerInstructions: {
          accounts: string[];
          data: string;
          programId: string;
        }[];
        programId: string;
      }[];

      for (const ix of instructions) {
        const relevantInnerIxs = ix.innerInstructions.filter(
          (item) =>
            item.accounts.length === 1 &&
            item.accounts.includes(programEventAuthority.value()) &&
            item.programId === transferHookProgram.programId.toBase58()
        );

        await Promise.all(
          relevantInnerIxs.map((relevantInnerIx) => {
            const emittedData = relevantInnerIx.data;
            if (!emittedData) return;

            const ixData = anchor.utils.bytes.bs58.decode(emittedData);
            const eventData = anchor.utils.bytes.base64.encode(ixData.slice(8));
            const event = transferHookProgram.coder.events.decode(eventData);

            if (!event) return;

            switch (event.name) {
              case transferHookProgram.idl.events[0].name:
                return processFeeUpdateEvent(event);
              case transferHookProgram.idl.events[1].name:
                return processTransactionEvent(event, tx);
              default:
                return;
            }
          })
        );
      }
    }
    res.status(200).json({ message: "Success" });
    return;
  } catch (error) {
    log("Error processing webhook:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
}

interface TransferEvent {
  mint: string;
  source: string;
  sourceBoss: string;
  destination: string;
  destinationBoss: string | null;
  destinationTokenAccount: string;
  boss: string;
  bossUnclaimedFee: string;
}

interface FeeUpdateEvent {
  mint: string;
  address: string;
  boss: string;
  unclaimedFees: string;
  claimedFees: string;
}

async function processFeeUpdateEvent(
  event: anchor.Event<IdlEvent, Record<string, string>>
) {
  const eventData = JSON.parse(JSON.stringify(event.data)) as FeeUpdateEvent;
  log(eventData);
  await supabase.from("hierarchy").upsert(
    {
      mint: eventData.mint,
      address: eventData.address,
      boss: eventData.boss,
      unclaimed: parseInt(eventData.unclaimedFees, 16),
      claimed: parseInt(eventData.claimedFees, 16),
    },
    { onConflict: ["address", "mint"] as any }
  );
}

async function processTransactionEvent(
  event: anchor.Event<IdlEvent, Record<string, string>>,
  tx: any
) {
  const eventData = JSON.parse(JSON.stringify(event.data)) as TransferEvent;
  log(eventData);
  await supabase.from("transactions").insert({
    mint: eventData.mint,
    signature: tx.signature,
    boss: eventData.boss,
    boss_unclaimed_fees: parseInt(eventData.bossUnclaimedFee, 16),
    source: eventData.source,
    source_boss: eventData.sourceBoss,
    destination: eventData.destination,
    destination_token_account: eventData.destinationTokenAccount,
    destination_boss: eventData.destinationBoss,
    created_at: Date.now(),
  });

  await supabase
    .from("hierarchy")
    .update({
      boss: eventData.sourceBoss,
    })
    .eq("address", eventData.source)
    .eq("mint", eventData.mint);

  await supabase
    .from("hierarchy")
    .update({
      unclaimed: parseInt(eventData.bossUnclaimedFee, 16),
    })
    .eq("address", eventData.boss)
    .eq("mint", eventData.mint);

  if (eventData.destinationBoss) {
    await supabase
      .from("hierarchy")
      .update({
        boss: eventData.destinationBoss,
      })
      .eq("address", eventData.destination)
      .eq("mint", eventData.mint);
  }
}
