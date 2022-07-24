require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-toolbox");
require('hardhat-docgen');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 20
      }
    }
  },
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: '105000000000000000000'
      }
    },
    matic: {
      accounts: {mnemonic: process.env.DEPLOYER_MNEMONIC},
      url: process.env.MATIC_RPC
    },
    mumbai: {
      accounts: {mnemonic: process.env.DEPLOYER_MNEMONIC},
      url: process.env.MUMBAI_RPC,
      gasPrice: 50000000000
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
};
