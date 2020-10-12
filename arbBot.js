require("dotenv").config()
const express = require('express')
const path = require('path')
//var request = require('request');
const cron = require('node-cron');
const abis = require('./abis');
var bodyParser = require("body-parser");
var cors = require('cors');
Web3 = require("web3");
const { mainnet: addresses } = require('./addresses');
const flashloanabi = require('./build/contracts/Flashloan.json')
const { ChainId, Fetcher, Token, TokenAmount, Pair, Trade, TradeType,Route ,Percent} = require('@uniswap/sdk');
const axios = require('axios');
const PORT = process.env.PORT || 5001
var colors = require('colors');

//Commander import
const { Command } = require('commander');
const program = new Command();
program.version('0.0.1');


var app = express();
const http = require('http')

//USAGE Example: node interact.js -n kovan 
// -n required

//RUN using command node arbBot.js -n kovan -t DAI/USDT/USDC

program
  .requiredOption('-n, --network <networkId> --token <tokenSymbol>', 'Network Id') 
program
  .requiredOption('-t,  --token <tokenSymbol>', 'Token symbol (DAI/USDT/USDC)') 
  // .option('-a, --address <ETHAddress>', 'Ethereum Address', process.env.DEFAULT_ACCOUNT_TESTNET)
program.parse(process.argv);

var tokensymbol = program.token;

  switch (program.token) {
    case 'DAI':
        var decimals = '1000000000000000000';

      if (program.network == "kovan" )
      {
          var tokenAddress = addresses.tokens.daiKovan;
    
      }
     else {
         var tokenAddress = addresses.tokens.dai; 
    }
   
       break;


    case 'USDT':
         var decimals = '100';

         //kovan
         if (program.network == "kovan" )
         {
          var tokenAddress = '0x13512979ADE267AB5100878E2e0f485B568328a4';
         }
        else
        {
             //mainnet 
          var tokenAddress = addresses.tokens.usdt; 
        }
         
        break;
   
    case 'USDC':

          var decimals = '100';
          if (program.network == "kovan" )
          {
              var tokenAddress = '0x13512979ADE267AB5100878E2e0f485B568328a4'; 
          }
          else 
          {
                   //mainnet 
            var tokenAddress = addresses.tokens.usdc;
          }
   
         break;
    
    default:
        console.log(`Error: token symbol not specified .` );
        break;
    }

//

  switch (program.network) {
    case 'ropsten':
        console.log(`Running on ${program.network} ........`);
         networkId = "3";
         ETH_NODE_URL="https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY

        break;

    case 'kovan':
        console.log(`Running on ${program.network} ........`);
        networkId = "42";
        ETH_NODE_URL="https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY
        var daiAddress = tokenAddress; //addresses.tokens.daiKovan;
        ETHEREUM_WALLET_ADDRESS=process.env.ETHEREUM_WALLET_ADDRESS_KOVAN
        PRIVATE_KEY=process.env.PRIVATE_KEY_KOVAN
        FLASHLOAN_CONTRACT_ADDRESS=process.env.FLASHLOAN_CONTRACT_ADDRESS_KOVAN
        break;
   
    case 'rinkeby':
         console.log(`Running on ${program.network} ........`);
         networkId = "4";
         ETH_NODE_URL="https://rinkeby.infura.io/v3/" + process.env.INFURA_API_KEY

         break;
    
    case 'mainnet':
        console.log(`Running on ${program.network} ........`);
        networkId = "1";
        ETH_NODE_URL="https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY
        var daiAddress = tokenAddress;//addresses.tokens.dai;
        ETHEREUM_WALLET_ADDRESS=process.env.ETHEREUM_WALLET_ADDRESS_MAINNET
        PRIVATE_KEY=process.env.PRIVATE_KEY_MAINNET
        FLASHLOAN_CONTRACT_ADDRESS=process.env.FLASHLOAN_CONTRACT_ADDRESS_MAINNET

        break;

    default:
        console.log(`Error: Network Id Not specified.` );
        break;
    }


//INITIALIZE WEB3
    // const web3 = new Web3(
    //     new Web3.providers.WebsocketProvider()
    //   );

web3 = new Web3(ETH_NODE_URL);
web3or = new Web3("https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY);

//Price Oracles Addresses used      
var oracle = addresses.oracle.oracleContract;
var from = addresses.oracle.oracleFrom;


console.log("DEBUG:"+tokensymbol, daiAddress)
console.log('DEBUG: ETHEREUM_WALLET_ADDRESS', ETHEREUM_WALLET_ADDRESS)
console.log('DEBUG: FLASHLOAN_CONTRACT_ADDRESS', FLASHLOAN_CONTRACT_ADDRESS)

//var player = require('play-sound')(opts = {})
console.log("🤖 💹 Starting YFRB Flashloan Arbitrage BOT ********" .cyan);


//FETCH FROM ENVIRONMENT
// var yourpublicadress =ETHEREUM_WALLET_ADDRESS;
// var accountprivatekey = PRIVATE_KEY;
// var yourflashloancontractadress = FLASHLOAN_CONTRACT_ADDRESS;
const AMOUNT_DAI = process.env.LOAN_AMOUNT;


var currentlyTrading= false;

app.use(express.static(path.join(__dirname, 'public')))

var cors = require('cors');
app.use(cors({credentials: true, origin: '*'}));

 cron.schedule("*/16 * * * * *", () => {
      getPrices();
 })


 app.listen(PORT);

 async function  getPrices(){


  console.log("token : "+tokensymbol);


  _getGasPrice = async () => {
    try {
      const url = 'https://gasprice.poa.network/'
      var priceString = await axios.get(url);
      // console.log(priceString)
      const priceJSON = priceString.data;
      console.log("INSTANT:", priceJSON.instant)

      return priceJSON.instant.toFixed().toString();
   //   return web3.utils.toWei(priceJSON.instant, 'gwei');
    //  return store.getStore('universalGasPrice')
    } catch(e) {
      console.log(e)
      return store.getStore('universalGasPrice')
    }
  }

  
  

  console.log("..........x.............x......x..........x.......x............ " .yellow );
  console.log("...................  LOGS START   ........................ " .yellow );
  console.log("");
  contractAddr = oracle;
  // const privateKey = accountprivatekey;
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY); 
  //abi = [{"constant":false,"inputs":[{"name":"symb","type":"string"},{"name":"tokenAddress","type":"address"},{"name":"byteCode","type":"bytes32"}],"name":"addFreeCurrency","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"fromSymbol","type":"string"},{"name":"toSymbol","type":"string"},{"name":"venue","type":"string"},{"name":"amount","type":"uint256"},{"name":"referenceId","type":"string"}],"name":"requestAsyncExchangeRateResult","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"eventName","type":"string"},{"name":"source","type":"string"},{"name":"referenceId","type":"string"}],"name":"getAsyncEventResult","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newDiv","type":"uint256"},{"name":"newMul","type":"uint256"}],"name":"updateMulDivConverter2","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"synth","type":"bytes32"},{"name":"token","type":"address"},{"name":"inputAmount","type":"uint256"}],"name":"getSynthToTokenOutputAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"symb","type":"string"},{"name":"tokenAddress","type":"address"}],"name":"addFreeToken","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_a","type":"string"},{"name":"_b","type":"string"}],"name":"compare","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updateForexOracleAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_a","type":"string"},{"name":"_b","type":"string"}],"name":"equal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"eventName","type":"string"},{"name":"source","type":"string"}],"name":"getEventResult","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updateSynthAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newDiv","type":"uint256"},{"name":"newMul","type":"uint256"}],"name":"updateMulDivConverter1","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newDiv","type":"uint256"},{"name":"newMul","type":"uint256"}],"name":"updateMulDivConverter3","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"fromSymbol","type":"string"},{"name":"toSymbol","type":"string"},{"name":"venue","type":"string"},{"name":"amount","type":"uint256"}],"name":"getExchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"symb","type":"string"}],"name":"removeFreeToken","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updateEthTokenAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"fundsReturnToAddress","type":"address"},{"name":"liquidityProviderContractAddress","type":"address"},{"name":"tokens","type":"string[]"},{"name":"amount","type":"uint256"},{"name":"exchanges","type":"string[]"}],"name":"arb","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updatePremiumSubOracleAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_haystack","type":"string"},{"name":"_needle","type":"string"}],"name":"indexOf","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"symb","type":"string"}],"name":"removeFreeCurrency","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updateAsyncOracleAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"venueToCheck","type":"string"}],"name":"isFreeVenueCheck","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"symToCheck","type":"string"}],"name":"isFree","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newAddress","type":"address"}],"name":"updateArbContractAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"changeOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updateAsyncEventsAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"tokenAddress","type":"address"}],"name":"getTokenDecimalCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"a","type":"string"},{"name":"b","type":"string"}],"name":"compareStrings","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"eventName","type":"string"},{"name":"source","type":"string"}],"name":"requestAsyncEvent","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"symbol","type":"string"}],"name":"getTokenAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"synth","type":"bytes32"},{"name":"inputAmount","type":"uint256"}],"name":"getTokenToSynthOutputAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"source","type":"string"}],"name":"stringToBytes32","outputs":[{"name":"result","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"fromSymbol","type":"string"},{"name":"toSymbol","type":"string"},{"name":"venue","type":"string"},{"name":"amount","type":"uint256"}],"name":"requestAsyncExchangeRate","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updateTokenOracleAddress2","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updateSyncEventsAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"symbol","type":"string"}],"name":"getSynthBytes32","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"fromSymb","type":"string"},{"name":"toSymb","type":"string"},{"name":"amount","type":"uint256"}],"name":"getFreeExchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOracle","type":"address"}],"name":"updateTokenOracleAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newDiv","type":"uint256"},{"name":"newMul","type":"uint256"}],"name":"updateMulDivConverter4","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"symbol","type":"string"}],"name":"getForexAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"param1","type":"string"},{"name":"param2","type":"string"},{"name":"param3","type":"string"},{"name":"param4","type":"string"}],"name":"callExtraFunction","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":true,"stateMutability":"payable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"}]
  
  var orContract = new web3or.eth.Contract(abis.oracle.oracleAbi, contractAddr);
  var unis = await orContract.methods.getExchangeRate(tokensymbol, 'ETH', 'UNISWAPBYSYMBOLV2', decimals).call({
    'from': from
  },function(error, data){
    console.log("UNISWAP  ETH/"+tokensymbol+"PRICE: " .green +" 1 "+tokensymbol+" = "  +data/ decimals  +" ETH" );
    return data / 100000000000000;
  })

  var kyb = await orContract.methods.getExchangeRate(tokensymbol, 'ETH', 'SELL-KYBER-EXCHANGE', decimals).call({
    'from': from

  },function(error, data){
    console.log("KYBER    ETH/"+tokensymbol+" PRICE: " .green +" 1 "+tokensymbol+" = "  + data / decimals+" ETH" )
   return data / decimals;

  })

  // web3js.utils.toHex(gasPrices.high* 1e9);

  let gazcostGwei =  await _getGasPrice();
  let gazcost =  web3.utils.toWei(gazcostGwei, 'gwei');;

   let gazlimit = await web3.eth.getBlock("latest").gasLimit
  //
  
  console.log("gazcostGwei: ", gazcostGwei)
  console.log("gazcostWei: ", gazcost)
  console.log("gaz limitt "+gazlimit)
    


//  let gazcost = await web3or.eth.getGasPrice();
 //var flashloan = new web3.eth.Contract(flashloanabi.abi,FLASHLOAN_CONTRACT_ADDRESS);

 let txprice = await web3.eth.estimateGas({from: ETHEREUM_WALLET_ADDRESS, to: FLASHLOAN_CONTRACT_ADDRESS, gasPrice:gazcost ,gas:'1000000'})
 

 let gaz = txprice * gazcost;

 console.log("tx cost wei: "+gaz);

 let gazeth = gaz /100000000000000000;

 let aavefee = AMOUNT_DAI *0.0009

 console.log("cost eth: "+gazeth);


 console.log("ESTIMATED GAS PRICE  : " .magenta + gazcost + " WEI" .magenta);
 console.log("ESTIMATED TX PRICE : " .magenta + txprice   +" GWEI" .magenta);
 console.log("ESTIMATED GAS COST TOTAL : ".magenta  + gazeth +" ETH" .magenta);
 console.log("AAVE LENDING POOL FEE: ".magenta  + aavefee + tokensymbol+"" .magenta);
 // console.log(web3.utils.fromWei(gazcost.toString(), 'ether'))
 
 console.log("KYBER "+tokensymbol+" PRICE = ".green +kyb/ 100000000000000+ " <--|-->" .cyan +  " UNISWAP "+tokensymbol+"PRICE = ".green +unis/ 100000000000000);
 


     let uniswapdai = unis/ 100000000000000;
     let kyberdai = kyb/ 100000000000000;

   console.log("KYBER "+tokensymbol+" AMOUNT = ".green +kyberdai * AMOUNT_DAI+ " <--|-->" .cyan +  " UNISWAP"+tokensymbol+" AMOUNT = ".green +uniswapdai* AMOUNT_DAI);


   if(kyb > unis){
    console.log('\n')
    console.log("SELL PRICE ON KYBER" .green  + "  >  " .cyan + "BUY PRICE ON UNISWAP" .green);

     const profit =  kyberdai - uniswapdai ;//(() * AMOUNT_DAI) - gaz ;
 
    // console.log("profit : "+ (profit * AMOUNT_DAI) - gaz)
         let realprofit = (profit * AMOUNT_DAI) - (gazeth + aavefee);

         if( realprofit > 0) {

         console.log("💰💰ESTIMATED PROFIT💰💰 : ".bgGreen + realprofit + " "+tokensymbol)
            arbTrade(false,AMOUNT_DAI*decimals,txprice,gazcost);
        
     
        } else{
       console.log("😩😕NOT PROFITABLE: " .red  + profit * AMOUNT_DAI+" "+tokensymbol+"" .red )
      //  console.log("TRY adjusting the amount of DAI borrowed.")
      console.log("");
      console.log("..........x.............x......x..........x.......x............ " .yellow );
      console.log("........x.x.x........  LOGS END 1  .......x.x.x.x....x......... " .yellow );
      console.log("");
      console.log("");
        }

   } 

    if(kyb < unis) {

    // console.log("Sell on uniswap > Buy on kyber")
    console.log("SELL PRICE ON UNISWAP" .green  + "  >  " .cyan + "BUY PRICE ON KYBER" .green);
    const profit =  uniswapdai - kyberdai;

    let realprofit = (profit * AMOUNT_DAI) - (gazeth + aavefee);

     
       
     if(realprofit > 0 ) {

      console.log("💰💰ESTIMATED PROFIT💰💰 : ".bgGreen + profit * AMOUNT_DAI+tokensymbol)
       
     
       arbTrade(true,AMOUNT_DAI*decimals, txprice, gazcost);


      } else {

      console.log("😩😕NOT PROFITABLE: " .red  + profit * AMOUNT_DAI+ ""+tokensymbol+"" .red)
      //  console.log("TRY adjusting the amount of DAI borrowed.")
      console.log("");
      console.log("..........x.............x......x..........x.......x............ " .yellow );
      console.log("........x.x.x........  LOGS END 2  .......x.x.x.x....x......... " .yellow );
      console.log("");
      console.log("");

      }

   } 

}


function arbTrade(direction,amount,gasLimit,gasPrice){

  console.log("PROFIT OPPORTUNITY FOUND !!" .bgWhite + "Executing trade using flashloan with "+amount+" borrowed "+tokensymbol+" 💰💰")

 var flashloan = new web3.eth.Contract(flashloanabi.abi,FLASHLOAN_CONTRACT_ADDRESS);

  if(currentlyTrading == true){
    return false;
  }

  currentlyTrading = true;
  
  setTimeout(function(){
    currentlyTrading = false;
  }, 60000);


//  console.log("starting arb trade. Cant execute another trade for 45 seconds")

//var addr= '0xDAbC7a7C700F58bD6adCcA44954d2d3E7659005A';

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;



    if(direction){

      // uniswap -> kyber 
    console.log("EXECUTING FLASHLOAN TRANSACTION -->" .red + " UNISWAP -> KYBER" .cyan)
    
    flashloan.methods.flashloan(amount.toString()).send({
            'from': ETHEREUM_WALLET_ADDRESS,
           'gas': 3000000,
           'gasPrice':gasPrice,
          // value:web3k.utils.toWei("0.1", "ether") ,
        }, function(error, data){
          //console.log(error);
          console.log(data)
          console.log("Transaction ID: " .cyan + data)
       //   console.log("check transaction at https://etherscan.io/tx/"+data)
        });

    } else {

      // console.log('DEBUG: daiAddress', daiAddress)
      // kyber -> uniswap 
      console.log("EXECUTING FLASHLOAN TRANSACTION -->" .red +" KYBER -> UNISWAP" .cyan)
      flashloan.methods.flashloan2(amount.toString()).send({
           'from': ETHEREUM_WALLET_ADDRESS,
           'gas': 3000000,
           'gasPrice':gasPrice,
     
          // value:web3k.utils.toWei("0.1", "ether") ,
        }, function(error, data){
         // console.log(error);
        console.log("Transaction ID: " .cyan + data)
          // console.log("check transaction at "+process.env.ARB_TRADE_URL+data)
        //  console.log("check transaction at https://etherscan.io/tx/"+data)
          // console.log(data)
        });

    }

}