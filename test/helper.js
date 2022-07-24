const { ethers, network } = require("hardhat");

async function forwardTime(timeInSeconds) {
    await network.provider.send("evm_increaseTime", [timeInSeconds])
    await network.provider.send("evm_mine") // this one will have 02:00 PM as its times
}

function toEth(weiValue) { return ethers.utils.formatEther(weiValue); }
function toWei(ethValue) { return ethers.utils.parseEther(ethValue)}

module.exports = {
    forwardTime,
    toEth,
    toWei,
}
