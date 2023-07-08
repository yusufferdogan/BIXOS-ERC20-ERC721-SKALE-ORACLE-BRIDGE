import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as string | undefined;
const ORACLE_ADDRESS = "0x2522A38913e12c021491AD91e8bB41b40C3845a9";

async function main() {
    
  if (!PRIVATE_KEY) throw new Error("Private Key Not Found");

  let data = {} as any;

  const wallet = new ethers.Wallet(PRIVATE_KEY);
  
  const mainnetProvider = wallet.connect(new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_goerli"));
  const skaleProvider = wallet.connect(new ethers.JsonRpcProvider("https://staging-v3.skalenodes.com/v1/staging-fast-active-bellatrix"));

  const mainnetNFTFactory = await ethers.getContractFactory("MainnetNFT", mainnetProvider);
  const contract = await mainnetNFTFactory.deploy();
  await contract.waitForDeployment();

  data["mainnetNFT"] = {
    abi: mainnetNFTFactory.interface.formatJson(),
    address: await contract.getAddress()
  };
  
  
  const claimableTokenFactory = await ethers.getContractFactory("ClaimableToken", skaleProvider);
  const contract2 = await claimableTokenFactory.deploy();
  await contract2.waitForDeployment();

  data["claimableToken"] = {
    abi: claimableTokenFactory.interface.formatJson(),
    address: await contract2.getAddress()
  }

  const claimFactory = await ethers.getContractFactory("Claim", skaleProvider);
  const contract3 = await claimFactory.deploy(ORACLE_ADDRESS, data["claimableToken"].address);
  await contract3.waitForDeployment();

  data["claim"] = {
    abi: contract3.interface.formatJson(),
    address: await contract3.getAddress()
  }
  
  await contract2.grantRole(ethers.id("MINTER_ROLE"), data["claim"].address);

  const deployments = await fs.readdir(path.resolve(__dirname, "../deployments"));
  await fs.writeFile(path.resolve(__dirname, "../deployments/deployments-" + deployments.length.toString() + ".json"), JSON.stringify(data), "utf-8");
   
}

main()
  .catch((err) => {
    process.exitCode = 1;
    console.error(err);
  });
