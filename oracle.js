const {
	chain,
	oracle
} = require("./config.json");

const {
	getUTCTimestamp,
	proofOfWork,
	createSubmitRequest,
	checkResult,
	submitRequest,
	createCheckResult
} = require("./oracle_utils");

async function generateOracleRequest(request) {
	const time = getUTCTimestamp();
	const provableWorkValue = proofOfWork(request, time).trim().replace(" ", "");
	const requestData = createSubmitRequest(provableWorkValue);
	const initialResponse = await submitRequest(requestData);
	const json = await initialResponse.json();
	const checkData = createCheckResult(json["result"]);
	const result = await checkResult(checkData);
	return result;
}


module.exports = {
	generateOracleRequest
}
