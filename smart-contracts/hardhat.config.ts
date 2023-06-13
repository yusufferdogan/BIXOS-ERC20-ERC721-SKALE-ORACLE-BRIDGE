import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as string | undefined;

if (!PRIVATE_KEY) throw new Error("Private Key missing from .env");

const config: HardhatUserConfig = {
  solidity: "0.8.18"
};

export default config;
