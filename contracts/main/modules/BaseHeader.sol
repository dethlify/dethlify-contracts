// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

import "./BaseStorage.sol";

/**
 * @title BaseHeader
 * @notice Contains the modifiers and events for the Dethlify contracts.
 * @author Christian Engel - <chris@dethlify.com>
 */
contract BaseHeader is BaseStorage {
  /**
   * @dev Only allow owner for certain actions.
   */
  modifier onlyOwner {
    require(msg.sender == owner, "BH: Only owner!");
    _;
  }

  /**
   * @dev Only allow manager for certain actions.
   */
  modifier onlyManager {
    require(msg.sender == proxy.getManagerImplementation(), "BH: Only manager!");
    _;
  }

  /**
   * @dev Only allow owner or manager for certain actions.
   */
  modifier onlyOwnerOrManager {
    require(
      msg.sender == owner || msg.sender == proxy.getManagerImplementation(),
      "BH: Only owner or manager!"
    );
    _;
  }

  /**
   * @dev Only allow heir for certain actions.
   */
  modifier onlyHeir {
    require(isHeir[msg.sender], "BH: Only Heir!");
    _;
  }

  /**
   * @dev Prevent reentry attacks
   */
  modifier noReentry {
    require(!mutexFlag, "BH: No reentry!");
    mutexFlag = true;
    _;
    mutexFlag = false;
  }

  /**
   * @dev Make sure arrays have the same length
   * @param _a the length of the first array
   * @param _b the length of the second array
   */
  modifier equalArraySize(uint256 _a, uint256 _b) {
    require(_a == _b, "BH: Arrays must be equally sized.");
    _;
  }

  /**
   * @dev Only allow access after the lock period ran out
   */
  modifier afterDeath {
    // solium-disable security/no-block-members
    require(now >= last + lock, "BH: Lock period must be over.");
    _;
  }

  /**
   * @dev Checks if lock period is between 1 month and two years
   * @param _lock the lock period in seconds
   */
  modifier validLock(uint256 _lock) {
    require(_lock >= month, "BH: Lock period must be as least one month.");
    require(_lock <= 2 * year, "BH: Lock period must not be longer than two years.");
    _;
  }

  /**
   * @dev Checks if the contract is paid for
   */
  modifier isPaid {
    // solium-disable security/no-block-members
    require(now <= paidUntil, "BH: Pay fee first.");
    _;
  }

  // events
  event Receive(address indexed from, uint256 amount);
  event Transfer(address indexed to, uint256 amount);
  event TransferToken(address indexed token, address indexed to, uint256 amount);
  event Withdraw(address indexed heir);
  event WithdrawToken(address indexed heir, address indexed token);
  event StartClaimCycle(address indexed token);
  event ResetClaimCycle(address indexed token);
  event UpdateDistribution(address[] heirs, uint256[] distributions);
  event UpdateTokenDistributions(address[] tokens, uint256[] distributions);
  event UpdateLock(uint256 lock);
  event Pulse();
  event Pay(address indexed token, uint256 amount);
  event Exit(address indexed receiver, address[] tokens);
}
