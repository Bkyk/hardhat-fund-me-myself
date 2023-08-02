const { assert } = require("chai");
const { network, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe Staging Tests", function () {
      let deployer;
      let fundMe;

      // i have only 1.5282 ETH in my wallet
      const sendValue = ethers.parseEther("1");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();

        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );
        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
