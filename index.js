require("dotenv").config();
const { chain } = require("./config.json");
const { ethers } = require("ethers");
const deployment = require("./smart-contracts/deployments/NFT_TOKEN_DEPLOYMENT.json");
const locker_source = require("./smart-contracts/artifacts/contracts/NftLockSource.sol/NftLockSource.json");
const locker_dest = require("./smart-contracts/artifacts/contracts/NftLockDest.sol/NftLockDest.json");
const { generateOracleRequest } = require("./oracle");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
/*
LOCK IN MAINNET UNLOCK IN SKALE
LOCK IN SKALE UNLOCK IN MAINNET
*/
async function main() {
  const start = performance.now();

  const DEPLOYER = "0x2233F9102D53988cbCfcaB1949EC6AA21f5f2DA9";
  //bytes32 constant LOCKER_ROLE = keccak256("LOCKER_ROLE");
  const LOCKER_ROLE =
    "0xaf9a8bb3cbd6b84fbccefa71ff73e26e798553c6914585a84886212a46a90279";
  const addresses = {
    LOCKER_SOURCE: "0x3f520f9f44a2359F8279C6A8B9a60aCF9a869d17",
    LOCKER_DEST: "0x00DfD90B3F46EfDDd8830F602F0E5661806bf3D4",
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
  //VERY IMPORTANT
  let tx = await skaleNFT.grantRole(LOCKER_ROLE, addresses.LOCKER_DEST);
  console.log(await tx.wait());

  //once
  tx = await mainnetNFT.lockerMint(DEPLOYER);
  console.log(await tx.wait());

  await mainnetNFT.setApprovalForAll(addresses.LOCKER_SOURCE, true);
  console.log(await tx.wait());

  const lockTx = await source.lock(1);
  console.log(await lockTx.wait());

  let tx = await skaleNFT.setApprovalForAll(addresses.LOCKER_DEST, true);
  console.log(await tx.wait());

  tx = await dest.lock(0);
  console.log(await tx.wait());
  */

  // console.log(await source.lockedBy(1));
  console.log(await dest.burnedBy(0));

  // console.log(await source.lockedTokenIdsByUser(DEPLOYER, 0));
  // console.log(await skaleNFT.ownerOf(0));

  // if true send to skale else send to mainnet
  const sendToSkale = false;

  const request = {
    cid: 1,
    uri: sendToSkale ? chain.goerli : chain.rpcUrl,
    encoding: "json",
    ethApi: "eth_call",
    params: [
      {
        from: ethers.ZeroAddress,
        to: sendToSkale ? addresses.LOCKER_SOURCE : addresses.LOCKER_DEST,
        data: sendToSkale
          ? source.interface.encodeFunctionData("lockedBy", [1])
          : dest.interface.encodeFunctionData("burnedBy", [0]),
        gas: "0xfffff",
      },
      "latest",
    ],
  };

  const requestStr = JSON.stringify(request);
  // console.log("requestStr ", requestStr, "\n\n\n\n");
  const oracleResponse = await generateOracleRequest(
    requestStr.slice(1, requestStr.length - 1)
  );
  const res = oracleResponse["result"];
  const paramsStartIndex = res.toString().search(/params/) + 8;
  const paramsEndIndex = res.toString().search(/time/) - 2;
  const parsedResult = JSON.parse(res);
  const params = [
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
  ];
  console.log(params);

  const obj = {
    gasLimit: sendToSkale ? BigInt(140000000) : BigInt(5000000),
    gasPrice: sendToSkale
      ? await providerSkale.getFeeData().gasPrice
      : await provider.getFeeData().gasPrice,
  };

  const claimTransactionHash = sendToSkale
    ? await dest.unlock(params, obj)
    : await source.unlock(params, obj);

  console.log("Claim Transaction Hash: ", claimTransactionHash);
  const resultClaim = await claimTransactionHash.wait();
  console.log("Result claim:", resultClaim);

  const end = performance.now();

  const executionTime = end - start;
  console.log(`Execution time: ${executionTime} milliseconds`);
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
