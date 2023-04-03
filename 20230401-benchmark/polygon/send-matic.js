// https://mumbai.polygonscan.com/
  //
const {use, POSClient} = require('@maticnetwork/maticjs');
const {Web3ClientPlugin} = require('@maticnetwork/maticjs-web3');
const {} = require('@maticnetwork/maticjs-ethers');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const SEED_PHRASE = 'hawk melt speak sponsor useful jelly prevent scare gather flock pizza caught';

const POLYGON_RPC = 'https://polygon-mumbai.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78';
//const POLYGON_RPC = 'https://rpc-mumbai.matic.today';
//const ETHER_RPC = 'https://rpc.ankr.com/eth_goerli';
const ETHER_RPC = 'https://eth-goerli.api.onfinality.io/public';

const SENDER_ADDRESS = '0xbeb6cb23a776f4fbc592a45c06d6069a696cdfd5';

const POS = {
  parent: {
    erc20: '0x655f2166b0709cd575202630952d71e2bb0d61af',
    erc721: '0x16F7EF3774c59264C46E5063b1111bCFd6e7A72f',
    erc1155: '0x2e3Ef7931F2d0e4a7da3dea950FF3F19269d9063',
  },
  child: {
    erc721: '0xbD88C3A7c0e242156a46Fbdf87141Aa6D0c0c649',
    erc20: '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1',
    weth: '0x714550C2C1Ea08688607D86ed8EeF4f5E4F22323',
    erc1155: '0xA07e45A987F19E25176c877d98388878622623FA',
  },
};




use(Web3ClientPlugin);

async function main(){

  
  let providerParent= null;
  let providerChild = null;
  try{
   providerParent= new HDWalletProvider({
      mnemonic: {
        phrase: SEED_PHRASE,
      },
      //providerOrUrl: 'https://rpc-mumbai.matic.today',
      providerOrUrl: ETHER_RPC,
      pollingInterval: 4000,
    });

    providerChild = new HDWalletProvider({
      mnemonic: {
        phrase: SEED_PHRASE,
      },
      //providerOrUrl: 'https://rpc-mumbai.matic.today',
      providerOrUrl: POLYGON_RPC,
      pollingInterval: 4000,
    });
  }catch(e){
    console.log(e);
  }

  let addrP = providerParent.getAddress(); 
  let addrC = providerChild.getAddresses(); 
  console.log(addrP);
  console.log(addrC);


  let config = {
    network: 'testnet',
    version: 'mumbai',
    parent: {
      provider: providerParent,
      defaultConfig: {
        from : providerParent.getAddress() 
      }
    },
    child: {
      provider: providerChild,
      defaultConfig: {
        from : providerChild.getAddress() 
      }
    }
  };
  const posClient = new POSClient();
  await posClient.init(config);
  //const erc20ParentToken = posClient.erc20('0xFfb99f4A02712C909d8F7cC44e67C87Ea1E71E83', true);
  //let bal = await erc20ParentToken.getBalance(providerChild.getAddress());
  const erc20ChildToken = posClient.erc20('0x0000000000000000000000000000000000001010');
  let bal = await erc20ChildToken.getBalance(providerChild.getAddress());
  console.log(bal);
  //let result = await erc20ChildToken.transfer(1000, SENDER_ADDRESS);
  let tasks = [];
  let t1 = new Date();
  for (let i=0; i < 10; i++){
    try{
      let opt = {
        spenderAddress: SENDER_ADDRESS,
        to: '0x1e84370dcb272d0ab9854c8536c44d86306372bc',
        value: 1000,
      }
      let result = await erc20ChildToken.transfer(1000,'0x1e84370dcb272d0ab9854c8536c44d86306372bc', opt);
      console.log(await result.getTransactionHash());
      //tasks.push(result);
    }catch(e){
      console.log(e);
    }
  }

  let t2 = new Date();
  console.log(t1);
  console.log(t2);
  console.log(t2-t1);
  
  

}



main();


