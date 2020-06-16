// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

interface ENSResolver {
  function addr(bytes32 _node) external view returns (address);

  function setAddr(bytes32 _node, address _addr) external;

  function name(bytes32 _node) external view returns (string memory);

  function setName(bytes32 _node, string calldata _name) external;
}
