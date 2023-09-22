import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import "@tenderly/hardhat-tenderly";

function getWallet(): Array<string> {
  return process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
}
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as string | undefined;

if (!PRIVATE_KEY) throw new Error("Private Key missing from .env");

const config: HardhatUserConfig = {
  solidity: "0.8.18",

  networks: {
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/aZ_HCiqpuE3otCxDdRtGbeFaeQQxhv1C",
      accounts: getWallet(),
    },
  },
};

export default config;
