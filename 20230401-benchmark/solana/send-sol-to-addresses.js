const w3 = require('@solana/web3.js');
const fs = require('fs');

const SOL_NETWORK = 'devnet';

// hardcode the private key for testnet POC only.
//  DO NOT do this at mainnet !
const SENDER_WALLET = [155,28,174,242,224,102,175,90,224,185,83,44,144,135,91,195,172,34,7,138,251,57,135,232,165,149,14,143,8,1,219,226,227,23,255,185,54,12,107,153,171,143,109,250,177,189,6,25,14,157,250,234,56,189,209,110,24,186,142,219,41,119,195,173];

const SENDER_PUBKEY='GHUmnYKusfr8Y9W3t3NcckZsEatZkLqZMsTdpsScrw3i';

const ACCOUNT_ADDRESSES = JSON.parse(fs.readFileSync('accounts.json', {encoding:'utf8'}));
// just lazy to send to the original address :p
const RECIPTENTS = ACCOUNT_ADDRESSES.map(addr => {
  let o = {address: addr, amount: 0.001 }
  return o;
});

const TXN_SIZE = 21;

async function main(){
  let conn = new w3.Connection(w3.clusterApiUrl(SOL_NETWORK));
  let sendWallet = w3.Keypair.fromSecretKey(Buffer.from(SENDER_WALLET));
  // create correct data type for RECIPTENTS
  const lamportsToSend = [];

  while (RECIPTENTS.length != 0){
    let out = [];
    for (let i=0; i < TXN_SIZE && RECIPTENTS.length !=0 ; i++){
      let r = RECIPTENTS.shift();
      let send = { 
        recipient: new w3.PublicKey(r.address), 
        lamports: w3.LAMPORTS_PER_SOL * r.amount,
      }
      out.push(send);
    }
    lamportsToSend.push(out);
    
  }

    

  //let txn = new w3.Transaction();
  let instructions = []

  for (let i=0; i < lamportsToSend.length; i++){
    let send = lamportsToSend[i];
    let insts = [];
    for (const r of send){
      insts.push(
        w3.SystemProgram.transfer({
          fromPubkey: sendWallet.publicKey,
          toPubkey: r.recipient,
          lamports: r.lamports,
        })
      );
    }
    instructions.push(insts);

  }


  //process.exit(0);
  

  // the txn needs the recent blockhash
  let { blockhash } = await conn.getLatestBlockhash();

  let txns = [];

  for (let i=0; i < instructions.length; i++){
    let inst = instructions[i];

    let messageV0 = new w3.TransactionMessage({
      payerKey: sendWallet.publicKey,
      recentBlockhash: blockhash,
      instructions: inst,
    }).compileToV0Message();
    let txn = new w3.VersionedTransaction(messageV0);
    // sign the txn with sender's private key
    txn.sign([sendWallet]);
    txns.push(txn)
  }
  
  let t1 = new Date();
  // run!
  let results = [];
  for (let i=0; i < txns.length;i++){
    let txn = txns[i];
    results.push(conn.sendTransaction(txn));
  }
  let r = await Promise.all(results);
  //console.log(await a);
  let t2 = new Date();
  console.log(r);
  console.log(t1);
  console.log(t2);
  console.log(t2-t1);

}
  
main();
