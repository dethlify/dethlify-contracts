// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

/**
 * @title ManagerProxy
 * @dev Contract that serves as middleman to allow replacements of the Manager contract.
 * @author Christian Engel - <chris@dethlify.com>
 */
contract ManagerProxy {
  address payable public manager;
  address payable public owner;

  /**
   * @notice Construct new Proxy
   */
  constructor() public {
    owner = msg.sender;
  }

  /**
   * @dev Only allow owner for certain actions.
   */
  modifier onlyOwner {
    require(msg.sender == owner, "MP: Only owner!");
    _;
  }

  event ChangeOwner(address indexed owner);
  event SetManager(address indexed manager);

  /**
   * @notice Change the owner
   * @dev reverts if unauthorized
   * @param _owner the new owner
   */
  function changeOwner(address payable _owner) public onlyOwner {
    owner = _owner;
    emit ChangeOwner(_owner);
  }

  /**
   * @notice Set the address of the current manager implementation
   * @dev reverts if unauthorized
   * @param _manager the address of the implementation
   */
  function setManager(address payable _manager) public onlyOwner {
    manager = _manager;
    emit SetManager(_manager);
  }

  /**
   * @notice Get the current address of the manager implementation
   * @return the address of the manager implementation
   */
  function getManagerImplementation() public view returns (address payable) {
    return manager;
  }
}
