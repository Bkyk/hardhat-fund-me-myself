// import

const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
// it is equival to the next two sentenses
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig

const { getNamedAccounts, network } = require("hardhat");
const { verify } = require("../utils/verify");

// main function

// calling of main function

// function deployFunc() {
//   console.log("Hi!");
// }

// module.exports.default = deployFunc;
module.exports = async ({ getNumberAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }
  // if the contract doesn't exist, we deploy a minimal version of
  // for our local testing

  // will what happens when we want to change chains?
  // when going for localhost or hardhat network we want t use a mock
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // put price feed address
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }

  log("---------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
