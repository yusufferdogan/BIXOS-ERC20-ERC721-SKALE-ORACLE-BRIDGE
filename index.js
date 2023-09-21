require("dotenv").config();
const { chain } = require("./config.json");
const { ethers } = require("ethers");
const deployment = require("./smart-contracts/deployments/NFT_TOKEN_DEPLOYMENT.json");
const locker_source = require("./smart-contracts/artifacts/contracts/NftLockSource.sol/NftLockSource.json");
const locker_dest = require("./smart-contracts/artifacts/contracts/NftLockDest.sol/NftLockDest.json");
const { generateOracleRequest } = require("./oracle");

const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
  const addresses = {
    LOCKER_SOURCE: "0xC4CfEb2DB93648DacF09EbD413Bb8090d7D4B1FF",
    LOCKER_DEST: "0x5fc345f05Cf6A045ee105EFCC07E12e7b784a478",
  };
  if (!PRIVATE_KEY) throw new Error("Private Key Not Found");

  const providerSkale = new ethers.JsonRpcProvider(chain.rpcUrl);
  const signerSkale = new ethers.Wallet(PRIVATE_KEY).connect(providerSkale);

  const provider = new ethers.JsonRpcProvider(chain.goerli);
  const signer = new ethers.Wallet(PRIVATE_KEY).connect(provider);

  console.log(1);

  const source = new ethers.Contract(
    addresses.LOCKER_SOURCE,
    locker_source.abi,
    signer
  );
  const dest = new ethers.Contract(
    addresses.LOCKER_DEST,
    locker_dest.abi,
    signerSkale
  );

  const mainnetNFT = new ethers.Contract(
    deployment.MAINNET_NFT.address,
    deployment.MAINNET_NFT.abi,
    signer
  );
  const skaleNFT = new ethers.Contract(
    deployment.SKALE_NFT.address,
    deployment.SKALE_NFT.abi,
    signerSkale
  );

  /*
  //once 
    await mainnetNFT.setApprovalForAll(
    "0xC4CfEb2DB93648DacF09EbD413Bb8090d7D4B1FF",
    true
  );
  await mainnetNFT.lockerMint("0x2233F9102D53988cbCfcaB1949EC6AA21f5f2DA9");
  const lockTx = await source.lock(0);
  console.log(await lockTx.wait());
   */

  console.log(await source.lockedBy(0));
  console.log(await dest.burnedBy(0));

  console.log(source.interface.encodeFunctionData("lockedBy", [0]));
  const request = {
    cid: 1,
    uri: "https://eth-goerli.g.alchemy.com/v2/aZ_HCiqpuE3otCxDdRtGbeFaeQQxhv1C",
    encoding: "json",
    ethApi: "eth_call",
    params: [
      {
        from: ethers.ZeroAddress,
        to: addresses.LOCKER_SOURCE,
        data: source.interface.encodeFunctionData("lockedBy", [0]),
        gas: "0xfffff",
      },
      "latest",
    ],
  };

  const requestStr = JSON.stringify(request);
  console.log("requestStr ", requestStr, "\n\n\n\n");
  const oracleResponse = await generateOracleRequest(
    requestStr.slice(1, requestStr.length - 1)
  );
  console.log("oracleResponse ", oracleResponse);

  const res = oracleResponse["result"];
  console.log("res ", res);

  const paramsStartIndex = res.toString().search(/params/) + 8;
  const paramsEndIndex = res.toString().search(/time/) - 2;
  const parsedResult = JSON.parse(res);

  console.log("parsedResult: ", parsedResult);

  const claimTransactionHash = await dest.unlock(
    [
      parsedResult["cid"],
      parsedResult["uri"],
      parsedResult["encoding"],
      parsedResult["ethApi"],
      oracleResponse["result"].slice(paramsStartIndex, paramsEndIndex),
      [],
      [],
      "",
      parsedResult["time"],
      parsedResult["rslts"],
      parsedResult["sigs"].map((sig) => {
        console.log(sig);
        if (sig === null) {
          return {
            v: 0,
            r: ethers.ZeroHash,
            s: ethers.ZeroHash,
          };
        } else {
          let splitVals = sig.split(":");
          return {
            v: splitVals[0] == 0 ? 27 : 28,
            r: ethers.zeroPadValue(
              "0x" +
                (splitVals[1].length % 2 == 0
                  ? splitVals[1]
                  : "0" + splitVals[1]),
              32
            ),
            s: ethers.zeroPadValue(
              "0x" +
                (splitVals[2].length % 2 == 0
                  ? splitVals[2]
                  : "0" + splitVals[2]),
              32
            ),
          };
        }
      }),
    ],
    {
      gasLimit: BigInt(140000000),
      gasPrice: await providerSkale.getFeeData().gasPrice,
    }
  );

  console.log("Claim Transaction Hash: ", claimTransactionHash);
  const resultClaim = await claimTransactionHash.wait();
  console.log("Result claim:", resultClaim);
}

main().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});
/*
  console.log(locker_deployment.LOCKER_SOURCE.abi);
  console.log(locker_deployment.LOCKER_SOURCE.address);

  console.log(locker_deployment.LOCKER_DEST.abi);
  console.log(locker_deployment.LOCKER_DEST.address);

  console.log(deployment.MAINNET_NFT.address);
  console.log(deployment.MAINNET_NFT.abi);

  console.log(deployment.SKALE_NFT.address);
  console.log(deployment.SKALE_NFT.abi);

*/
