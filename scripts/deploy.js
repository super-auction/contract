require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
const { ethers } = require("hardhat");

async function main() {
    const deployers = await ethers.getSigners();
    const deployer = deployers[0] //first account

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Contract = await ethers.getContractFactory("SuperAuction");

    const contract = await Contract.connect(deployer)
    .deploy();
  
    console.log("Contract address:", contract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });