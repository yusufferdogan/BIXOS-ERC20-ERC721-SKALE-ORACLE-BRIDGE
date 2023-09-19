const { ethers } = require("hardhat");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const path = require("path");

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ORACLE_ADDRESS = "0x2522A38913e12c021491AD91e8bB41b40C3845a9";

async function main() {
  if (!PRIVATE_KEY) throw new Error("Private Key Not Found");

  let data = {};

  const wallet = new ethers.Wallet(PRIVATE_KEY);

  const mainnetProvider = wallet.connect(
    new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_goerli")
  );
  const skaleProvider = wallet.connect(
    new ethers.JsonRpcProvider(
      "https://staging-v3.skalenodes.com/v1/staging-fast-active-bellatrix"
    )
  );

  const UBXS = await ethers.getContractFactory("UBXS", mainnetProvider);
  const ubxs_mainnet = await UBXS.deploy();
  await ubxs_mainnet.waitForDeployment();

  const UBXS_SKALE = await ethers.getContractFactory("UBXS", skaleProvider);
  const ubxs_skale = await UBXS_SKALE.deploy();
  await ubxs_skale.waitForDeployment();

  const palmIslandNftFactory = await ethers.getContractFactory(
    "BixosPalmIslandsServerNFT",
    mainnetProvider
  );
  const palmIslandNftFactorySkale = await ethers.getContractFactory(
    "BixosPalmIslandsServerNFT",
    skaleProvider
  );

  const palmIslandNftBnbContract = await palmIslandNftFactory.deploy(
    await ubxs_mainnet.getAddress()
  );
  await palmIslandNftBnbContract.waitForDeployment();

  const palmIslandNftSkaleContract = await palmIslandNftFactorySkale.deploy(
    await ubxs_skale.getAddress()
  );
  await palmIslandNftSkaleContract.waitForDeployment();

  data["NFT_BNB"] = {
    abi: palmIslandNftFactory.interface.formatJson(),
    address: await palmIslandNftBnbContract.getAddress(),
  };
  data["NFT_SKALE"] = {
    abi: palmIslandNftFactorySkale.interface.formatJson(),
    address: await palmIslandNftSkaleContract.getAddress(),
  };
  data["UBXS_SKALE"] = {
    abi: ubxs_skale.interface.formatJson(),
    address: await ubxs_skale.getAddress(),
  };
  data["UBXS_BNB"] = {
    abi: ubxs_mainnet.interface.formatJson(),
    address: await ubxs_mainnet.getAddress(),
  };

  const deployments = await fs.readdir(
    path.resolve(__dirname, "../deployments")
  );
  await fs.writeFile(
    path.resolve(__dirname, "../deployments/NFT_TOKEN_DEPLOYMENT" + ".json"),
    JSON.stringify(data),
    "utf-8"
  );
}

main().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});
