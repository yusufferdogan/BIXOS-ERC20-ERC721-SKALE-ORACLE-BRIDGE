const { sha256, toUtf8Bytes, MaxUint256, keccak256 } = require("ethers");
const { chain: { rpcUrl }} = require("./config.json");
const MIN_POW_NUMBER = 10000;
const MAX_POW_NUMBER = 100000;

function createCheckResult(param) {
	return {
		"id": 83,
		"jsonrpc": "2.0",
		"method": "oracle_checkResult",
		"params": [param]
	};
}

function createSubmitRequest(param) {
	return {
		"id": 83,
		"jsonrpc": "2.0",
		"method": "oracle_submitRequest",
		"params": [param]
	};
}


function getUTCTimestamp(d = new Date()) {
	const nUtcUnixTimestampWithMilliseconds = d.getTime();
	return "" + nUtcUnixTimestampWithMilliseconds;
}

function proofOfWork(request, time) {

	let i = 0, s = "";
	while (i < MAX_POW_NUMBER) {
		s = `{${request},"time":${time},"pow":${i}}`;
		const hash = keccak256(toUtf8Bytes(s));
		// console.log(hash);
		const res = (MaxUint256 - BigInt(1)) / BigInt(hash);

		if (res > MIN_POW_NUMBER) break;
		i++;
	}
	return s;
}

async function submitRequest(data) {
	return await fetch(rpcUrl, {
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json"
		}
	})
}

async function checkRequest(data) {
	return await fetch(rpcUrl, {
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json"
		}
	});
}

async function checkResult(result) {
	let i = 0;
	while (i < 15) {

		const check = await checkRequest(result);
		const response = await check.json();
		if (response["error"]) {
			await new Promise(resolve => setTimeout(resolve, 2500));
		} else {
			return response
		}
	}

	throw new Error("Could Not Find Result");
}

module.exports = {
	checkResult,
	createCheckResult,
	createSubmitRequest,
	getUTCTimestamp,
	proofOfWork,
	submitRequest
}
