const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { forwardTime, toEth, toWei } = require('./helper')

const dateHelper = (year, month, date) => {
  return +new Date(year, month-1, date) / 1000;
}

const log = console.log

describe("SuperAuction", function () {
    let admin, bidder1, bidder2, seller;
    let auctionContract;
    let provider;

    const DEFAULT_PRICE = 123;
    const DEFAULT_URL = 'http://example.com'


    const createDefaultAuction = async (startDate, endDate) => {
        return await createAuction(undefined, seller.address, undefined, startDate, endDate)
    }

    const createAuction = async (price = DEFAULT_PRICE, address, url = DEFAULT_URL, startDate, endDate) => {

        log('createAuction', price, address, url, startDate, endDate)
        return await auctionContract.connect(admin)
            .addProduct(price, address, url, startDate, endDate)
    }

    beforeEach(async() => {
        [admin, bidder1, bidder2, seller] = await ethers.getSigners()
        const SuperAuction = await ethers.getContractFactory("SuperAuction");
        auctionContract = await SuperAuction.deploy();
        await auctionContract.deployed();
        console.log('now is', +new Date())

        auctionContract.queryFilter('*', (productId, bidAmount, owner) => {
            console.log('NewWinningBid', {productId, bidAmount, owner})
        })
    })

    it("Should accept a bid", async function () {
        await createDefaultAuction(dateHelper(2022,5,13), dateHelper(2022,12,12))
        const [product] =  await auctionContract.getProductById(1)
        expect(product).to.be.not.null

        const res = await auctionContract.connect(bidder1).bid(1, 100);
        const { events } = await res.wait()

        const args = events.map(e => e.args)
        const [productId, amount, owner ] = args.shift();
        expect(bidder1.address).to.be.eq(owner)
    }); 

    it("Should not accept a lower bid", async() => {
        await createDefaultAuction(dateHelper(2022,5,13), dateHelper(2022,12,12))
        const [product] =  await auctionContract.getProductById(1)
        expect(product).to.be.not.null

        const tx1 = await auctionContract.connect(bidder1).bid(1, 100);
        const { events } = await tx1.wait()

        const tx2 = await auctionContract.connect(bidder2).bid(1, 99)
        const res2 = await tx2.wait()

        const args = events.map(e => e.args)
        const [productId, amount, owner ] = args.shift();
        expect(bidder1.address).to.be.eq(owner)
    })

    it("Winning bid should be able to claim bid", async() => {
        const startBid = new Date()
        const endBid = new Date(startBid.getTime() + 60*60*24*1000)

        await createDefaultAuction((+startBid/1000).toFixed(0), (+endBid/1000).toFixed(0))
        const [product] =  await auctionContract.getProductById(1)
        expect(product).to.be.not.null

        const tx1 = await auctionContract.connect(bidder1).bid(1, toWei('1'));
        await tx1.wait()

        const txOptions = { value: toWei('1') }

        await forwardTime(60 * 60 * 24) // forward 1 day
        const tx2 = await auctionContract.connect(bidder1).claimProduct(1, txOptions)
        await tx2.wait()

        const sellerBalance = await seller.getBalance()

        // in hardhat.config, we set initial balance to be 105
        // we bid 1 ETH, so we expect seller to have a balance of 106 here
        expect(+toEth(sellerBalance)).to.be.eq(106)      
    })
});