const web3 = require('@solana/web3.js');

function generateRandomAddresses(numAddresses) {
  //const connection = new web3.Connection('https://api.mainnet-beta.solana.com');

  const addresses = [];
  for (let i = 0; i < numAddresses; i++) {
    const keypair = web3.Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    addresses.push(publicKey);
  }

  return addresses;
}


let list = generateRandomAddresses(100);

list.forEach(o => {
  console.log(o);
})
