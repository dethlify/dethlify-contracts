// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../libs/strings.sol";
import "../interfaces/ENS.sol";
import "../interfaces/ENSResolver.sol";
import "../interfaces/ENSReverseRegistrar.sol";

/**
 * @title ManagerStorage
 * @notice The storage contract for the Manager contract.
 * @author Christian Engel - <chris@dethlify.com>
 */
contract ManagerStorage {
  using strings for *;

  // General storage
  address public owner;
  mapping(uint256 => bool) public isNonceUsed;
  mapping(address => bool) public isSigner;
  mapping(address => bool) public isPaymentToken;
  mapping(address => uint256) public monthlyTokenFee;
  mapping(address => uint256) public yearlyTokenFee;
  mapping(string => mapping(bytes4 => address payable)) public implementations;
  string[] public versions;
  string public lastVersion;

  // ENS configuration
  ENS public ens;
  ENSResolver public ensResolver;
  ENSReverseRegistrar public reverseRegistrar;
  bytes32 rootNode = 0x09e2fe66d6dff2dc5e2ad9be41c8a3f82699b6ef7f8c327b353eb94cb6e24948;
  string rootName = "dethlify.eth";
  bytes32 public constant ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2; // prettier-ignore

  /**
   * @dev Only allow owner for certain actions.
   */
  modifier onlyOwner {
    require(msg.sender == owner, "M: Only owner!");
    _;
  }

  /**
   * @dev Checks if a token is registered as paymen token.
   */
  modifier isAllowed(address _token) {
    require(isPaymentToken[_token], "M: Token not allowed.");
    _;
  }

  /**
   * @dev Checks if a version was already registered.
   */
  modifier noOverwrite(string memory _version) {
    for (uint256 i = 0; i < versions.length; i++) {
      require(
        keccak256(abi.encodePacked((versions[i]))) != keccak256(abi.encodePacked((_version))),
        "M: No overwrite allowed."
      );
    }
    _;
  }

  event Deploy(address);
}
