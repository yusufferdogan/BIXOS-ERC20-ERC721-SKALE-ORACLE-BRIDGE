import { ethers, tenderly } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function main() {
  const isSource = true;

  const UBXS = {
    MAINNET: "0xeD3406A7dC3d221dfC8a780346788666ea3099b8",
    SKALE: "0xB430a748Af4Ed4E07BA53454a8247f4FA0da7484",
  };
  const BRIDGE = {
    MAINNET: "0xa8693554c5900Fd7ff4b5c983063A036c03958F9",
    SKALE: "0x8AABFFCb0e2c504EA9FF0d4A311f37c7C33D0eB6",
  };

  const ORACLE_ADDRESS = "0x2522A38913e12c021491AD91e8bB41b40C3845a9";
  const contractName: string = isSource ? "UBXSBridgeSource" : "UBXSBridgeDest";
  const destArgs: Array<string | number | Array<string | number>> = [
    ORACLE_ADDRESS,
    UBXS.SKALE,
    //trust address
    BRIDGE.MAINNET,
  ];
  const sourceArgs: Array<string | number | Array<string | number>> = [
    UBXS.MAINNET,
  ];

  const contractFactory: ContractFactory = await ethers.getContractFactory(
    contractName
  );

  const arg = isSource ? sourceArgs : destArgs;

  const contract: Contract = await contractFactory.deploy(...arg);

  await contract.deployed();
  console.log(contractName + " deployed to:", contract.address);

  // await tenderly.verify(
  //   {
  //     name: "NftLockSource",
  //     address: "0x3f520f9f44a2359F8279C6A8B9a60aCF9a869d17",
  //   },
  //   {
  //     name: "BixosPalmIslandsServerNFT",
  //     address: "0xa0B940dCa1d7FC3e79Fe3b434767d2bE19A893eB",
  //   }
  // );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
