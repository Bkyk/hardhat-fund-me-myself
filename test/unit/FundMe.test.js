const { assert, expect } = require("chai");
const { deployments, getNamedAccounts, ethers } = require("hardhat");
// const { beforeEach } = require("node:test");
// const { send } = require("process");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let deployer;
      let MockV3Aggregator;

      //  I solved it by putting an extra value in send value.
      // I believe that since the video is relatively old,
      // ETH was worth much less at the time.
      // It is necessary to make a correction in the code.
      // I put 25 ETH and my test pass.
      const sendValue = ethers.parseEther("25"); //25 ETH
      beforeEach(async function () {
        // deploy our fundMe contract
        // using Hardhat-deploy
        // const accounts = await ethers.getSigners();
        // const accountZero = await accounts[0];

        // getNamedAccounts 函数用于获取在 Hardhat 配置文件中定义的命名账户
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);

        // getContract 函数用于获取智能合约的实例，
        // 以便在 Hardhat 项目中进行合约的部署和交互
        // fundMe是一个合约，合约地址项为target
        fundMe = await ethers.getContract("FundMe", deployer);
        MockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
        // console.log("Result:", MockV3Aggregator);
      });

      describe("constructor", async function () {
        // the first test
        it("set the aggregator addresses correctly", async function () {
          const response = await fundMe.getpriceFeed();
          //getAddress() or address would not work
          assert.equal(response, MockV3Aggregator.target);
        });
      });

      describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("updated the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getsAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("Adds funder to array of getfunder", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("Withdraw ETH from a single funder", async function () {
          // just change any fundMe.provider.getBalance to ethers.provider.getBalance
          // and change address to target.

          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // There is no variable called effectiveGasPrice in transactionReceipt may
          // because they changed in ethers v6
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
        });

        it("allows us to withdraw with multiple getFunder", async function () {
          // Arrange

          // 在 ethers.js v6 中，ethers.getSigner() 函数已经被弃用，
          // accounts[i]是一个账户，账户地址项为address
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          //Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );

          // Make sure that the getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getsAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          // await expect(attackerConnectedContract.withdraw()).to.be.reverted;

          // Hardhat updates the way it handles the custom errors
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });

        it("cheaper withdraw testing......", async function () {
          // Arrange

          // 在 ethers.js v6 中，ethers.getSigner() 函数已经被弃用，
          // accounts[i]是一个账户，账户地址项为address
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          //Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );

          // Make sure that the getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getsAddressToAmountFunded(accounts[i].address),
              0
            );
          }
          // console.log("FundME:", fundMe);
          // console.log("Acc:", accounts[6]);
        });
      });
    });
