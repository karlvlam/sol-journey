const w3 = require('@solana/web3.js');

const SOL_NETWORK = 'devnet';

// hardcode the private key for testnet POC only.
//  DO NOT do this at mainnet !
const SENDER_WALLET = [155,28,174,242,224,102,175,90,224,185,83,44,144,135,91,195,172,34,7,138,251,57,135,232,165,149,14,143,8,1,219,226,227,23,255,185,54,12,107,153,171,143,109,250,177,189,6,25,14,157,250,234,56,189,209,110,24,186,142,219,41,119,195,173];

const SENDER_PUBKEY='GHUmnYKusfr8Y9W3t3NcckZsEatZkLqZMsTdpsScrw3i';


async function main(){
  let conn = new w3.Connection(w3.clusterApiUrl(SOL_NETWORK));
  let sendWallet = w3.Keypair.fromSecretKey(Buffer.from(SENDER_WALLET));
  // create correct data type for RECIPTENTS

    
  let { blockhash } = await conn.getLatestBlockhash();
  let slot = await conn.getSlot();

  const [lookupTableInst, lookupTableAddress] = w3.AddressLookupTableProgram.createLookupTable({
    authority: sendWallet.publicKey,
    payer: sendWallet.publicKey,
    recentSlot: slot-100, // why I need to minus 100?

  });

  console.log(lookupTableAddress);
  

  let message = new w3.TransactionMessage({
    payerKey: sendWallet.publicKey,
    recentBlockhash: blockhash,
    instructions: [lookupTableInst],
  }).compileToV0Message();
  let txn = new w3.VersionedTransaction(message);
  txn.sign([sendWallet]);
  let txnId = await conn.sendTransaction(txn);

  console.log(txnId);
}
  
main();


/*
  *  2sqiDzoKDuDJQTFQF9oZfopi8kP372d2EsDEzXsBfPnCKpcyHwTWRbrf7RznkUtHDF9rjXf5AKter8pAHxS9DKtx
  *  9VESjwXmqMuaduWSt1y5RfFXW1DUHSN4JKqBmrCK63zn
  *
  *
  * */
