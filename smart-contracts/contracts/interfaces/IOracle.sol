// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "./IVerifier.sol";

interface IOracle {
    struct OracleResponse {
        uint256 cid;
        string uri;
        string encoding;
        string ethApi;
        string params;
        string[] jsps;
        uint256[] trims;
        string post;
        uint256 time;
        string[] rslts;
        IVerifier.Signature[] sigs;
    }

    function verifyOracleResponse(
        OracleResponse memory response
    ) external view returns (bool);
}
