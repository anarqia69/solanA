import {
  AuthorityType,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";

export const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

type Signer = (tx: Transaction) => Promise<Transaction>;

function str(value: string) {
  const bytes = new TextEncoder().encode(value);
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, bytes.length, true);
  return [len, bytes];
}

function concat(parts: Uint8Array[]) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function createMetadataIx(args: {
  mint: PublicKey;
  owner: PublicKey;
  name: string;
  symbol: string;
  uri: string;
}) {
  const [metadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), args.mint.toBuffer()],
    METADATA_PROGRAM_ID,
  );
  const sellerFee = new Uint8Array(2); // 0 basis points
  const data = concat([
    new Uint8Array([33]), // CreateMetadataAccountV3
    ...str(args.name),
    ...str(args.symbol),
    ...str(args.uri),
    sellerFee,
    new Uint8Array([0]), // creators: None
    new Uint8Array([0]), // collection: None
    new Uint8Array([0]), // uses: None
    new Uint8Array([1]), // is_mutable: true
    new Uint8Array([0]), // collection_details: None
  ]);
  return new TransactionInstruction({
    programId: METADATA_PROGRAM_ID,
    keys: [
      { pubkey: metadata, isSigner: false, isWritable: true },
      { pubkey: args.mint, isSigner: false, isWritable: false },
      { pubkey: args.owner, isSigner: true, isWritable: false },
      { pubkey: args.owner, isSigner: true, isWritable: true },
      { pubkey: args.owner, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

async function sendSigned(
  connection: Connection,
  tx: Transaction,
  owner: PublicKey,
  signTransaction: Signer,
  extraSigners: Keypair[] = [],
) {
  const latest = await connection.getLatestBlockhash("confirmed");
  tx.feePayer = owner;
  tx.recentBlockhash = latest.blockhash;
  // The wallet signs first (it may adjust the tx), then extra signers.
  const signed = await signTransaction(tx);
  if (extraSigners.length) signed.partialSign(...extraSigners);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  const res = await connection.confirmTransaction(
    { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
    "confirmed",
  );
  if (res.value.err) throw new Error("Transaction failed on-chain: " + JSON.stringify(res.value.err));
  return signature;
}

function feeIx(owner: PublicKey, treasury: string, feeSol: number) {
  if (!treasury || feeSol <= 0) return [];
  return [
    SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey: new PublicKey(treasury),
      lamports: Math.round(feeSol * LAMPORTS_PER_SOL),
    }),
  ];
}

export async function createSplToken(args: {
  rpcUrl: string;
  owner: string;
  signTransaction: Signer;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  metadataUri: string;
  treasury: string;
  feeSol: number;
  revokeMint: boolean;
  revokeFreeze: boolean;
}) {
  const connection = new Connection(args.rpcUrl, "confirmed");
  const owner = new PublicKey(args.owner);
  const mint = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const ata = getAssociatedTokenAddressSync(mint.publicKey, owner);
  const amount = BigInt(args.supply) * BigInt(10) ** BigInt(args.decimals);

  const tx = new Transaction();
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mint.publicKey, args.decimals, owner, owner, TOKEN_PROGRAM_ID),
    createMetadataIx({ mint: mint.publicKey, owner, name: args.name, symbol: args.symbol, uri: args.metadataUri }),
    createAssociatedTokenAccountInstruction(owner, ata, owner, mint.publicKey),
    createMintToInstruction(mint.publicKey, ata, owner, amount),
    ...feeIx(owner, args.treasury, args.feeSol),
  );
  if (args.revokeMint) {
    tx.add(createSetAuthorityInstruction(mint.publicKey, owner, AuthorityType.MintTokens, null));
  }
  if (args.revokeFreeze) {
    tx.add(createSetAuthorityInstruction(mint.publicKey, owner, AuthorityType.FreezeAccount, null));
  }

  const signature = await sendSigned(connection, tx, owner, args.signTransaction, [mint]);
  return { mintAddress: mint.publicKey.toBase58(), signature };
}

export type MintInfo = {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supply: string;
  decimals: number;
};

export async function fetchMintInfo(rpcUrl: string, mintAddress: string): Promise<MintInfo> {
  const connection = new Connection(rpcUrl, "confirmed");
  const m = await getMint(connection, new PublicKey(mintAddress), "confirmed", TOKEN_PROGRAM_ID);
  return {
    mintAuthority: m.mintAuthority?.toBase58() ?? null,
    freezeAuthority: m.freezeAuthority?.toBase58() ?? null,
    supply: m.supply.toString(),
    decimals: m.decimals,
  };
}

export async function revokeAuthorities(args: {
  rpcUrl: string;
  owner: string;
  signTransaction: Signer;
  mintAddress: string;
  mint: boolean;
  freeze: boolean;
  treasury: string;
  feeSol: number;
}) {
  const connection = new Connection(args.rpcUrl, "confirmed");
  const owner = new PublicKey(args.owner);
  const mintPk = new PublicKey(args.mintAddress);
  const tx = new Transaction();
  tx.add(...feeIx(owner, args.treasury, args.feeSol));
  if (args.mint) tx.add(createSetAuthorityInstruction(mintPk, owner, AuthorityType.MintTokens, null));
  if (args.freeze) tx.add(createSetAuthorityInstruction(mintPk, owner, AuthorityType.FreezeAccount, null));
  return sendSigned(connection, tx, owner, args.signTransaction);
}
