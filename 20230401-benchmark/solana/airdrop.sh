ADDR=$1
#ADDR=Fgzf1rFCTL7P8knYuXp92EaCcggDqZ5hF2VrpE7yaTob
curl 'https://api.testnet.solana.com/' -X POST -H "content-type: application/json" --data-raw '{"jsonrpc":"2.0","id":"abc","method":"requestAirdrop","params":["'$ADDR'",1000000000]}'
