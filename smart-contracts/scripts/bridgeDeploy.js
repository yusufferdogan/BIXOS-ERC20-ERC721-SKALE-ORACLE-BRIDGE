const { ethers } = require("hardhat");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const path = require("path");
const deployment = require("../deployments/NFT_TOKEN_DEPLOYMENT.json");

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ORACLE_ADDRESS = "0x2522A38913e12c021491AD91e8bB41b40C3845a9";
const UBXS = {
  MAINNET: "0xeD3406A7dC3d221dfC8a780346788666ea3099b8",
  SKALE: "0xB430a748Af4Ed4E07BA53454a8247f4FA0da7484",
};

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

  const sourceFactory = await ethers.getContractFactory(
    "UBXSBridgeSource",
    mainnetProvider
  );
  const lockerSource = await sourceFactory.deploy(UBXS.MAINNET);
  await lockerSource.waitForDeployment();

  const destFactory = await ethers.getContractFactory(
    "UBXSBridgeDest",
    skaleProvider
  );
  const lockerDest = await destFactory.deploy(UBXS.SKALE);
  await lockerDest.waitForDeployment();

  data["LOCKER_SOURCE"] = {
    abi: sourceFactory.interface.formatJson(),
    address: await lockerSource.getAddress(),
  };
  data["LOCKER_DEST"] = {
    abi: destFactory.interface.formatJson(),
    address: await lockerDest.getAddress(),
  };

  const deployments = await fs.readdir(
    path.resolve(__dirname, "../deployments")
  );
  await fs.writeFile(
    path.resolve(__dirname, "../deployments/BRIDGE_DEPLOYMENT" + ".json"),
    JSON.stringify(data),
    "utf-8"
  );
}

main().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});
