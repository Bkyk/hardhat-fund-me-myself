const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  let fundMe = await ethers.getContractAt("FundMe", deployer);
  console.log("Funding Contract...");
  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("25"),
  });
  await transactionResponse.wait(1);
  console.log("Funded!");
}

// main
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
