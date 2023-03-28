const w3 = require('@solana/web3.js');

const SOL_NETWORK = 'testnet';

// hardcode the private key for testnet POC only.
//  DO NOT do this at mainnet !
const SENDER_WALLET = [155,28,174,242,224,102,175,90,224,185,83,44,144,135,91,195,172,34,7,138,251,57,135,232,165,149,14,143,8,1,219,226,227,23,255,185,54,12,107,153,171,143,109,250,177,189,6,25,14,157,250,234,56,189,209,110,24,186,142,219,41,119,195,173];

const SENDER_PUBKEY='GHUmnYKusfr8Y9W3t3NcckZsEatZkLqZMsTdpsScrw3i';

// just lazy to send to the original address :p
const RECIPTENTS = [
  { address: SENDER_PUBKEY, amount: 0.000001 },
  { address: SENDER_PUBKEY, amount: 0.000002 },
  { address: SENDER_PUBKEY, amount: 0.000003 },
];

async function main(){
  let conn = new w3.Connection(w3.clusterApiUrl(SOL_NETWORK));
  let sendWallet = w3.Keypair.fromSecretKey(Buffer.from(SENDER_WALLET));
  // create correct data type for RECIPTENTS
  const lamportsToSend = RECIPTENTS.map(r => (
    { 
      recipient: new w3.PublicKey(r.address), 
      lamports: w3.LAMPORTS_PER_SOL * r.amount,
    }
  ));
  

  let txn = new w3.Transaction();
  // call transfer program
  for (const r of lamportsToSend){
    txn.add(
      w3.SystemProgram.transfer({
        fromPubkey: sendWallet.publicKey,
        toPubkey: r.recipient,
        lamports: r.lamports,
      })
    );

  }

  // set feePayer (the sender)
  txn.feePayer = sendWallet.publicKey;

  // the txn needs the recent blockhash
  let { blockhash } = await conn.getLatestBlockhash();
  txn.recentBlockhash = blockhash ;

  // sign the txn with sender's private key
  txn.sign(sendWallet);

  // run!
  let signature = await conn.sendTransaction(txn, [sendWallet]);
  console.log('Txn signature:', signature);

}
  
main();
