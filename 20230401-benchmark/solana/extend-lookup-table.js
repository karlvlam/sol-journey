const w3 = require('@solana/web3.js');
const fs = require('fs');

const SOL_NETWORK = 'devnet';

// hardcode the private key for testnet POC only.
//  DO NOT do this at mainnet !
const SENDER_WALLET = [155,28,174,242,224,102,175,90,224,185,83,44,144,135,91,195,172,34,7,138,251,57,135,232,165,149,14,143,8,1,219,226,227,23,255,185,54,12,107,153,171,143,109,250,177,189,6,25,14,157,250,234,56,189,209,110,24,186,142,219,41,119,195,173];

const SENDER_PUBKEY='GHUmnYKusfr8Y9W3t3NcckZsEatZkLqZMsTdpsScrw3i';

const LOOKUP_TABLE_ADDRESS='9VESjwXmqMuaduWSt1y5RfFXW1DUHSN4JKqBmrCK63zn';

const ACCOUNT_ADDRESSES = JSON.parse(fs.readFileSync('accounts.json', {encoding:'utf8'}));

const TXN_SIZE = 21;

async function main(){
  let conn = new w3.Connection(w3.clusterApiUrl(SOL_NETWORK));
  let sendWallet = w3.Keypair.fromSecretKey(Buffer.from(SENDER_WALLET));
    

  //let txn = new w3.Transaction();
  let instructions = []

  let pages = Math.ceil(ACCOUNT_ADDRESSES.length/TXN_SIZE);
  for (let i=0; i < pages; i++){
    let addresses = [];
    for (let j=0; j < TXN_SIZE && ACCOUNT_ADDRESSES.length != 0; j++){
      addresses.push(new w3.PublicKey(ACCOUNT_ADDRESSES.shift()));
    }

    let inst = w3.AddressLookupTableProgram.extendLookupTable({
      payer: sendWallet.publicKey,
      authority: sendWallet.publicKey,
      lookupTable: new w3.PublicKey(LOOKUP_TABLE_ADDRESS),
      addresses: addresses,
    });
    instructions.push([inst]);

  }

  console.log(instructions.length);

  

  let { blockhash } = await conn.getLatestBlockhash();


  for (let i=0; i < instructions.length; i++){
    let inst = instructions[i];

    let messageV0 = new w3.TransactionMessage({
      payerKey: sendWallet.publicKey,
      recentBlockhash: blockhash,
      instructions: inst,
    }).compileToV0Message();

    let txn = new w3.VersionedTransaction(messageV0);
    txn.sign([sendWallet]);
    let txnId = await conn.sendTransaction(txn);
    console.log(txnId);
  }
  
}

main();
