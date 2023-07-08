require("dotenv").config();
const {
	chain
} = require("./config.json");
const { ethers } = require("ethers");
const deployment = require("./smart-contracts/deployments/deployments-4.json");
const claimAbi = require("./smart-contracts/artifacts/contracts/Claim.sol/Claim.json");
const {generateOracleRequest} = require("./oracle");

const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {

	if (!PRIVATE_KEY) throw new Error("Private Key Not Found");

	const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
	const signer = new ethers.Wallet(PRIVATE_KEY).connect(provider);

	console.log(1);

	const mainnetNFT = new ethers.Contract(deployment.mainnetNFT.address, deployment.mainnetNFT.abi);
	const claim = new ethers.Contract(deployment.claim.address, claimAbi.abi, signer);


	const request = {
		"cid": 1,
		"uri": "eth://",
		"encoding": "json",
		"ethApi": "eth_call",
		"params": [{
			"from": ethers.ZeroAddress,
			"to": mainnetNFT.target,
			"data": mainnetNFT.interface.encodeFunctionData(
				"balanceOf",
				[signer.address]
			),
			"gas": "0xfffff"
		},
		"latest"],
	}

	const requestStr = JSON.stringify(request);
	const oracleResponse = await generateOracleRequest(requestStr.slice(1, requestStr.length - 1));
	const res = oracleResponse["result"];
	const paramsStartIndex = res.toString().search(/params/) + 8;
	const paramsEndIndex = res.toString().search(/time/) - 2;


	const parsedResult = JSON.parse(res);

	const claimTransactionHash = await claim.claim([
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
					s: ethers.ZeroHash
				}
			} else {
				let splitVals = sig.split(":");
				return {
					v: splitVals[0] == 0 ? 27 : 28,
					r: ethers.zeroPadValue("0x" + (splitVals[1].length % 2 == 0 ? splitVals[1] : "0" + splitVals[1]), 32),
					s: ethers.zeroPadValue("0x" + (splitVals[2].length % 2 == 0 ? splitVals[2] : "0" + splitVals[2]), 32)
				}
			}
		})
	], {
		gasLimit: BigInt(140000000),
		gasPrice: await provider.getFeeData().gasPrice
	});
	console.log("Claim Transaction Hash: ", claimTransactionHash);
	const resultClaim = await claimTransactionHash.wait();
	console.log("Result claim:", resultClaim);
}

main()
	.catch((err) => {
		process.exitCode = 1;
		console.error(err);
	})

