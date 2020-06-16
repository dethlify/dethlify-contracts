// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

interface ENS {
  function setRecord(
    bytes32 node,
    address _owner,
    address resolver,
    uint64 ttl
  ) external;

  function setSubnodeRecord(
    bytes32 node,
    bytes32 label,
    address owner,
    address resolver,
    uint64 ttl
  ) external;

  function setSubnodeOwner(
    bytes32 node,
    bytes32 label,
    address _owner
  ) external returns (bytes32);

  function setResolver(bytes32 node, address resolver) external;

  function setOwner(bytes32 node, address _owner) external;

  function setTTL(bytes32 node, uint64 ttl) external;

  function setApprovalForAll(address operator, bool approved) external;

  function owner(bytes32 node) external view returns (address);

  function resolver(bytes32 node) external view returns (address);

  function ttl(bytes32 node) external view returns (uint64);

  function recordExists(bytes32 node) external view returns (bool);

  function isApprovedForAll(address _owner, address operator) external view returns (bool);

  // FROM BASEREGISTRAR
  function reclaim(uint256 id, address _owner) external;
}
