require("dotenv").config();
const {
	chain
} = require("./config.json");
const { ethers } = require("ethers");
const deployment = require("./smart-contracts/deployments/deployments-2.json");
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
		"jsps": ["/rslts"],
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
		"latest"]
	}

	const requestStr = JSON.stringify(request);
	const oracleResponse = await generateOracleRequest(requestStr.slice(1, requestStr.length - 1));

	const res = oracleResponse["result"];

	const parsedResult = JSON.parse(res);

	const claimTransactionHash = await claim.claim([
		parsedResult["cid"],
		parsedResult["uri"],
		parsedResult["jsps"],
		[],
		"",
		parsedResult["time"],
		parsedResult["rslts"],
		parsedResult["sigs"].filter((sig) => sig).map((sig) => {
			console.log(sig);
			let splitVals = sig.split(":");
			return {
				v: splitVals[0],
				r: "0x" + splitVals[1],
				s: "0x" + splitVals[2]
			}
		})
	], {
		gasLimit: BigInt(140000000),
		gasPrice: await provider.getFeeData().gasPrice
	});
	console.log("Claim Transaction Hash: ", claimTransactionHash);
}

main()
	.catch((err) => {
		process.exitCode = 1;
		console.error(err);
	})

