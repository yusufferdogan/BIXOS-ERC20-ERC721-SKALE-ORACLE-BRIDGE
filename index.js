require("dotenv").config();
const { chain } = require("./config.json");
const { ethers } = require("ethers");

const BRIDGE_SOURCE = require("./smart-contracts/artifacts/contracts/UBXSBridgeSource.sol/UBXSBridgeSource.json");
const BRIDGE_DEST = require("./smart-contracts/artifacts/contracts/UBXSBridgeDest.sol/UBXSBridgeDest.json");
const UBXS = require("./smart-contracts/artifacts/contracts/UBXS.sol/UBXS.json");

const { generateOracleRequest } = require("./oracle");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
/*
LOCK IN MAINNET UNLOCK IN SKALE
LOCK IN SKALE UNLOCK IN MAINNET
*/
async function main() {
  const start = performance.now();

  const DEPLOYER = "0x2233F9102D53988cbCfcaB1949EC6AA21f5f2DA9";

  const BRIDGE = {
    MAINNET: "0xa8693554c5900Fd7ff4b5c983063A036c03958F9",
    SKALE: "0x8AABFFCb0e2c504EA9FF0d4A311f37c7C33D0eB6",
  };

  if (!PRIVATE_KEY) throw new Error("Private Key Not Found");

  const providerSkale = new ethers.JsonRpcProvider(chain.rpcUrl);
  const signerSkale = new ethers.Wallet(PRIVATE_KEY).connect(providerSkale);

  const provider = new ethers.JsonRpcProvider(chain.goerli);
  const signer = new ethers.Wallet(PRIVATE_KEY).connect(provider);

  console.log(1);

  const bridgeSource = new ethers.Contract(
    BRIDGE.MAINNET,
    BRIDGE_SOURCE.abi,
    signer
  );
  const bridgeDest = new ethers.Contract(
    BRIDGE.SKALE,
    BRIDGE_DEST.abi,
    signerSkale
  );

  const mainnetUBXS = new ethers.Contract(
    "0xeD3406A7dC3d221dfC8a780346788666ea3099b8",
    UBXS.abi,
    signer
  );

  const skaleUBXS = new ethers.Contract(
    "0xB430a748Af4Ed4E07BA53454a8247f4FA0da7484",
    UBXS.abi,
    signerSkale
  );

  // let approve = await mainnetUBXS.approve(BRIDGE.MAINNET, ethers.MaxUint256);
  // console.log(await approve.wait());

  // approve = await skaleUBXS.approve(BRIDGE.SKALE, ethers.MaxUint256);
  // console.log(await approve.wait());

  let add = await bridgeDest.addUbxsToBridge(100000 * 10 ** 6);
  console.log(await add.wait());

  let tx = await bridgeSource.sendUBXS(1000 * 10 ** 6);
  console.log(await tx.wait());

  console.log(await bridgeSource.getSentAmount(DEPLOYER));

  const request = {
    cid: 1,
    uri: chain.goerli,
    encoding: "json",
    ethApi: "eth_call",
    params: [
      {
        from: ethers.ZeroAddress,
        to: BRIDGE.MAINNET,
        data: bridgeSource.interface.encodeFunctionData("getSentAmount", [
          DEPLOYER,
        ]),
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
    gasLimit: BigInt(140000000),
    gasPrice: await providerSkale.getFeeData().gasPrice,
  };

  const claimTransactionHash = await bridgeDest.receiveUbxs(params, obj);

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
