const https = require('https');

const KEYWORDS = {
  'Account': [],
  'Account Owner': [],
  'App': [],
  'Bank state': [],
  'block': [],
  'blockhash': [],
  'block height': [],
  'bootstrap validator': [],
  'BPF loader': [],
  'client': [],
  'commitment': [],
  'cluster': [],
  'compute budget': [],
  'compute units': [],
  'confirmation time': [],
  'confirmed block': [],
  'control plane': [],
  'cooldown period': [],
  'credit': [],
  'cross-program invocation': ['CPI'],
  'data plane': [],
  'drone': [],
  'entry': [],
  'entry id': [],
  'epoch': [],
  'fee account': [],
  'finality': [],
  'fork': [],
  'genesis block': [],
  'genesis config': [],
  'hash': [],
  'inflation': [],
  'inner instruction': [],
  'instruction': [],
  'keypair': [],
  'lamport': [],
  'leader': [],
  'leader schedule': [],
  'ledger': [],
  'ledger vote': [],
  'light client': [],
  'loader': [],
  'lockout': [],
  'message': [],
  'native token': [],
  'node': [],
  'node count': [],
  'proof of history': ['poh'],
  'point': [],
  'private key': [],
  'program': [],
  'program derived account': ['pda'],
  'program id': [],
  'prioritization fee': [],
  'public key': ['pubkey'],
  'rent': [],
  'rent exempt': [],
  'root': [],
  'runtime': [],
  'sealevel': [],
  'shred': [],
  'signature': [],
  'skipped slot': [],
  'slot': [],
  'smart contract': [],
  'sol': [],
  'solana program library': ['spl'],
  'stake': [],
  'supermajority': [],
  'sysvar': [],
  'thin client': [],
  'tick': [],
  'tick height': [],
  'token': [],
  'tps': [],
  'transaction': [],
  'transaction id': [],
  'transaction confirmations': [],
  'transaction entry': [],
  'validator': [],
  'verifiable delay function': ['vdf'],
  'vote': [],
  'vote credit': [],
  'wallet': [],
  'warmup period': [],
}

const KEYWORD_TABLE = keywordTable(KEYWORDS);
const KEYWORD_REGEX = keywordRegex(KEYWORD_TABLE);



function keywordRegex(keywords){
  let list = [];
  Object.keys(keywords).forEach(k => {
    list.push(k.toLocaleUpperCase().replaceAll(" ", "\\s"));
  });


  let regString = "\\b(" + list.join("|") + ")\\b";

  let r = new RegExp(regString, "gi");
  //r = /\b(ACCOUNT|poh)\b/gi;
  return r;

}

function keywordTable(keywords){
  let t = {};
  Object.keys(keywords).forEach(k => {
    t[k.toUpperCase()] = k.toUpperCase();
    keywords[k].forEach(k1 => {
      t[k1.toUpperCase()] = k.toUpperCase();
    })
  })

  return t;
}

function countKeywords(keywords) {
  let count = {};
  keywords.forEach(k => {
    let key = KEYWORD_TABLE[k.toUpperCase()];
    if (count[key] >= 0) {
      count[key]++;
    }else{
      count[key] = 1;
    }
  })

  return count;
}



async function getPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299){
        console.log(res.statusCode, url);
        reject('Error:', res.statusCode);
      }
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function getLinks(html, pageURL, baseURL){
  const regexHref = /href="([^"]*)"/g
  let hrefs = html.match(regexHref);
  let out = hrefs.map(o => {
    let t = o.substr(6, o.length-7);
    if (isRelativePath(t)){
      if (isBasePath(t)){
        t = baseURL + t;
      }else{
        t = pageURL + t;
      }
    }else{
    }
    let idx = t.indexOf('#');
    if (idx >= 0){
      t = t.substr(0,idx);
    }
    t = normalizeUrl(t);
    return t;
    
  }).filter(o => {
    return o.length;
  }).filter(o => {
    return o.startsWith(baseURL);
  }).filter(o => {
    let regex = /\.(css|js|xml|ico|png|jpg|jpeg)|\/(de|es|ru|ar)$|\/(de|es|ru|ar)\//;
    return !o.match(regex);
  });
  return getUniqueStrings(out);


}

function getUniqueStrings(stringArray) {
  const uniqueStrings = [];
  
  stringArray.forEach(function(str) {
    if (!uniqueStrings.includes(str)) {
      uniqueStrings.push(str);
    }
  });
  
  return uniqueStrings;
}


function normalizeUrl(url) {
  // Add the "https://" or "http://" prefix to the URL if it's missing
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    url = `https://${url}`;
  }
  
  // Create a new URL object to parse the input URL
  const parsedUrl = new URL(url);
  
  // Split the path into its individual components
  const pathComponents = parsedUrl.pathname.split('/');
  
  // Create a new array to hold the normalized path components
  const normalizedPath = [];
  
  // Iterate over the path components
  for (const component of pathComponents) {
    if (component === '.') {
      // Ignore any `.` components
      continue;
    } else if (component === '..') {
      // Remove the last component from the normalized path if there is one
      if (normalizedPath.length > 0) {
        normalizedPath.pop();
      }
    } else if (component !== '') {
      // Add the component to the normalized path
      normalizedPath.push(component);
    }
  }
  
  // Join the normalized path components back into a single string
  const normalizedPathStr = normalizedPath.join('/');
  
  // Construct the normalized URL using the parsed URL object and the normalized path
  let normalizedUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/${normalizedPathStr}`;
  
  // Remove any double slashes in the URL
  normalizedUrl = normalizedUrl.replace(/\/\//g, '/');

  const regexHTTPS = /^https:\/(?!\/)/;
  const regexHTTP = /^http:\/(?!\/)/;
  if (normalizedUrl.match(regexHTTPS)){
    normalizedUrl = normalizedUrl.replace(regexHTTPS, 'https://');
  }else if (normalizedUrl.match(regexHTTP)){
    normalizedUrl = normalizedUrl.replace(regexHTTP, 'http://');
  }
  
  return normalizedUrl;
}


function isRelativePath(url){
  return !url.startsWith('http');
}

function isBasePath(url){
  return url.startsWith('/');
}

async function queryPage(pageList, pageDone, baseURL) {
  let url = pageList.shift();
  console.log('Query:', url);
  if (!url || pageDone[url]) {
    return;
  }

  let page = null;
  try{
    page = await getPage(url);
  }catch(err){

    return;
  }

  //console.log(' --', '1');
  pageDone[url] = countKeywords(page.match(KEYWORD_REGEX) || []);
  let links = getLinks(page, url, baseURL);
  //console.log(' --', '2');
  links.forEach(o => {
    if (!pageDone[o]) {
      //console.log('Add:', o);
      pageList.push(o);
    }
  });


}


async function main() {
  let baseURL = 'https://docs.solana.com/';
  let url = 'https://docs.solana.com/';


  let pageList = []; 
  let pageDone = {};

  pageList.push(url);
  while (pageList.length){
    await queryPage(pageList, pageDone, baseURL);
  }

  //console.log(JSON.stringify(pageDone, null, 2));
  let countTotal = {};
  Object.keys(pageDone).forEach( url => {
    let count = pageDone[url];
    Object.keys(count).forEach( k => {
      if (countTotal[k]){
        countTotal[k] += count[k];
      }else{
        countTotal[k] = count[k];
      }
    });
  });

  console.log(countTotal);

}


main();
