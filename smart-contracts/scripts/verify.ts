import { ethers, tenderly } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const fooTokenName: string = "FooToken";
  // const fooTokenConstructorArgs: Array<
  //   string | number | Array<string | number>
  // > = ["100000000000000"];
  // const fooTokenFactory: ContractFactory = await ethers.getContractFactory(
  //   fooTokenName
  // );
  // const fooToken: Contract = await fooTokenFactory.deploy(
  //   ...fooTokenConstructorArgs
  // );
  // await fooToken.deployed();
  // console.log(fooTokenName + " deployed to:", fooToken.address);

  await tenderly.verify(
    {
      name: "NftLockSource",
      address: "0x3f520f9f44a2359F8279C6A8B9a60aCF9a869d17",
    },
    {
      name: "BixosPalmIslandsServerNFT",
      address: "0xa0B940dCa1d7FC3e79Fe3b434767d2bE19A893eB",
    }
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
