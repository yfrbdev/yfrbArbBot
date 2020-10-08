const kyberMainnet = require('./kyber-mainnet.json');

const uniswapMainnet = require('./uniswap-mainnet.json');
const dydxMainnet = require('./dydx-mainnet.json');
const tokensMainnet = require('./tokens-mainnet.json');
const projectToken = require('./projecttokens-mainnet.json');

const kyberKovan = require('./kyber-kovan.json');
const oracleMainnet = require('./oracle-mainnet.json');
const aaveMainnet = require('./aave-mainnet.json');



module.exports = {
  mainnet: {
    kyber: kyberMainnet,
    uniswap: uniswapMainnet,
    dydx: dydxMainnet,
    tokens: tokensMainnet,
    projectToken: projectToken,
    kyberKovan:kyberKovan,
    oracle: oracleMainnet,
    aave: aaveMainnet
  }
};