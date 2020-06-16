// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

interface ENSReverseRegistrar {
  function claim(address _owner) external returns (bytes32);

  function claimWithResolver(address _owner, address _resolver) external returns (bytes32);

  function setName(string calldata _name) external returns (bytes32);

  function node(address _addr) external pure returns (bytes32);
}
