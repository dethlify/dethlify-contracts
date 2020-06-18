// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

import "../../interfaces/IERC20.sol";
import "../../administration/ManagerProxy.sol";
import "../../administration/Manager.sol";
import "../../libs/SafeMath.sol";

/**
 * @title BaseStorage
 * @dev Storage contract for Dethlify contracts
 * @author Christian Engel - <chris@dethlify.com>
 */
contract BaseStorage {
  using SafeMath for uint256;
  string public version;
  uint256 public paidUntil;
  address payable public owner;
  bytes32[] public heirs;
  uint256 public lock;
  uint256 public last;
  mapping(bytes32 => bool) internal isHeir;
  mapping(address => bool) internal tokenIsLocked;
  mapping(address => mapping(bytes32 => bool)) public hasClaimedToken; // [token][heir]
  mapping(address => uint256) public numHaveClaimedToken;
  mapping(address => mapping(bytes32 => uint256)) public calculatedTokenShares; // [token][heir]
  mapping(address => mapping(bytes32 => uint256)) public tokenDistribution; // [token][heir] = percentage
  address[] public setTokens;
  mapping(address => bool) public distributionIsSet;
  uint256 internal day = 24 * 60 * 60;
  uint256 internal month = day * 31;
  uint256 internal year = month * 12;
  address internal ETHER = address(0x0);
  bool internal mutexFlag;
  ManagerProxy public proxy;
}
