const w3 = require('@solana/web3.js');
const sns = require('@bonfida/spl-name-service');

const SOL_TLD_AUTHORITY = new w3.PublicKey(
  "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx"
);


const ROOT_TLD_AUTHORITY = new w3.PublicKey(
  "ZoAhWEqTVqHVqupYmEanDobY7dee5YKbQox9BNASZzU"
);

const SOL_NETWORK = 'mainnet-beta';
const SOL_FROM_DOMAIN = 'guriguri.sol';
const SOL_DEST_DOMAIN = 'solearnagrant.sol';
const TOKEN_PROGRAM_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const USDC_TOKEN_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';


function shortenHash(s){
	let t = s.toString();
	return t.substr(0,4) + '...' + t.substr(-4);
}

async function getDomainAddress(connection, domain){
	let domainKey = await sns.getDomainKey(domain);
	let state = await sns.NameRegistryState.retrieve(connection, domainKey.pubkey);
	return state.registry.owner;
}

function getTxnAmount(txn, fromKey){
	let preBal = txn.meta.preTokenBalances;
	let postBal= txn.meta.postTokenBalances;

	// check sender
	try {
	let preAmt = preBal.find(o => o['owner'] === fromKey.toString())['uiTokenAmount'];
	let postAmt = postBal.find(o => o['owner'] === fromKey.toString())['uiTokenAmount'];
	let decimals = preAmt['decimals'];
	let diff = Number.parseInt(preAmt['amount']) - Number.parseInt(postAmt['amount']); 
	diff = diff / Math.pow(10, decimals);
	return diff;

	}catch(e){
		console.log(JSON.stringify(txn, null, 2));
		process.exit(1);
	}

}

function getTxnTime(txn){
	return new Date(txn['blockTime']*1000);

}


function isUSDCTxn(txn, fromKey, destKey){
	let preBal = txn.meta.preTokenBalances;
	let postBal= txn.meta.postTokenBalances;
	let mintSet = new Set();
	let programSet = new Set();
	preBal.concat(postBal).forEach(function(o){
		mintSet.add(o.mint);
		programSet.add(o.programId);
	});

	if (mintSet.size !== 1 || programSet.size !== 1){
		return false;
	}

	let result = mintSet.has(USDC_TOKEN_ADDRESS) && programSet.has(TOKEN_PROGRAM_ADDRESS);

	return result; 

}

function matchSenderReceiver(txn, fromKey, destKey){
	let preBal = txn.meta.preTokenBalances;
	let postBal= txn.meta.postTokenBalances;

	// check sender
	let sender1 = preBal.find(o => o['owner'] === fromKey.toString());
	let sender2 = postBal.find(o => o['owner'] === fromKey.toString());
	if (!sender1 && !sender2 ) {
		return false;
	} 
	if (sender1['accountIndex'] !== sender2['accountIndex'] ){
		return false;
	}

	// check receiver 
	let receiver1 = preBal.find(o => o['owner'] === destKey.toString());
	let receiver2 = postBal.find(o => o['owner'] === destKey.toString());
	if (!receiver1 && !receiver2){
		return false;
	} 
	if (receiver1['accountIndex'] !== receiver2['accountIndex']){
		return false;
	}


	if (sender1['accountIndex'] < receiver2['accountIndex'] ){
		return false;
	}

	return true;
}

async function getConfirmedSignatures(conn, pubkey, beforeSign){
	let opt = {
		limit: 200,
	}
	if (beforeSign) {
		opt['before'] = beforeSign;
	}
	let result = await conn.getConfirmedSignaturesForAddress2(pubkey, opt);
	return result;
}


//guriguri.sol 最近 10 次射去 solearnagrant.sol
async function main(){
	let conn = new w3.Connection(w3.clusterApiUrl(SOL_NETWORK));
	let fromKey = await getDomainAddress(conn, SOL_FROM_DOMAIN);
	let destKey = await getDomainAddress(conn, SOL_DEST_DOMAIN);
	console.log("From:",SOL_FROM_DOMAIN,fromKey.toString());
	console.log("Dest:",SOL_DEST_DOMAIN,destKey.toString());
	console.log();

	let matchLimit = 10;
	let lastSignature = null;

	while (matchLimit > 0){
		let signatures = null;
	
		signatures = await getConfirmedSignatures(conn, fromKey, lastSignature);
		signatures = signatures.map(o => {return o.signature});
		let txns = await conn.getTransactions(signatures, {maxSupportedTransactionVersion:0});
		for (let i=0; i < signatures.length; i++){
			if (matchLimit < 1){
				break;
			}
			let t = txns[i];
			let sign = signatures[i];
			if (isUSDCTxn(t) && matchSenderReceiver(t, fromKey, destKey)){
				console.log(shortenHash(sign), getTxnTime(t), getTxnAmount(t, fromKey));
				matchLimit--;
			}

		};
		lastSignature = signatures.pop();
	}
	
}

main();



