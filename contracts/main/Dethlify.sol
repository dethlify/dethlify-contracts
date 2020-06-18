// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

import "./modules/BaseStorage.sol";
import "./modules/BaseHeader.sol";
import "../interfaces/ENSReverseRegistrar.sol";

/**
 * @title Dethlify
 * @notice The dethlify inheritance contract.
 * @author Christian Engel - <chris@dethlify.com>
 */
contract Dethlify is BaseStorage, BaseHeader {
  /**
   * @notice Construct new Dethlify contract
   * @dev reverts if the distribution does not equal to 100%
   * @param _owner the contract owner
   * @param _heirs the hashed contract heirs
   * @param _dist the initial ETH distribution
   * @param _lock the lock period
   * @param _proxy the address of the ManagerProxy
   */
  constructor(
    address payable _owner,
    bytes32[] memory _heirs,
    uint256[] memory _dist,
    uint256 _lock,
    address payable _proxy
  ) public payable {
    // init contract configuration
    owner = _owner;
    lock = _lock;
    last = now;
    // solium-disable security/no-block-members
    paidUntil = now + 6 * month;
    heirs = _heirs;

    // set default distribution and heirs
    uint256 sum;
    for (uint256 i = 0; i < _heirs.length; i++) {
      tokenDistribution[ETHER][_heirs[i]] = _dist[i];
      isHeir[_heirs[i]] = true;
      sum += _dist[i];
    }
    setTokens.push(ETHER);
    distributionIsSet[ETHER] = true;
    require(sum == 10000, "P: Total share percentage must be equal to 100%!");

    // set latest version
    proxy = ManagerProxy(_proxy);
    version = Manager(proxy.getManagerImplementation()).lastVersion();
  }

  /**
   * @notice Change the owner of the contract
   * @dev reverts if unauthorized
   * @param _owner the address of the new owner
   */
  function changeOwner(address payable _owner) public onlyOwner {
    owner = _owner;
  }

  /**
   * @notice Claim the ENS name
   * @dev Can only be called by the manager
   * @param _name the subdomain
   */
  function claimENS(string memory _name) public onlyManager {
    Manager manager = Manager(proxy.getManagerImplementation());
    ENSReverseRegistrar registry = ENSReverseRegistrar(manager.reverseRegistrar());
    registry.claim(address(this));
    registry.setName(manager.getFullName(_name));
  }

  /**
   * @notice Up- or downgrade implementations
   * @dev reverts if unauthorized
   * @param _version the new version to use
   */
  function setVersion(string memory _version) public onlyOwner {
    version = _version;
  }

  /**
   * @notice Enable ETH deposits
   */
  receive() external payable {
    emit Receive(msg.sender, msg.value);
  }

  /**
   * @notice Delegate requests to the implementation
   * @dev Reverts if no implementation is set
   */
  fallback() external payable {
    // the function signature
    bytes4 sig = msg.sig;

    // get the implementation address from the manager
    address payable impl = Manager(proxy.getManagerImplementation()).getImplementationAddress(
      version,
      sig
    );
    require(impl != address(0x0), "P: Invalid implementation");

    // delegate the call to the implementation
    _delegate(impl);
  }

  /**
   * @notice Delegate calls to an implementation
   * @dev will revert on fails
   * @param _implementation the implementation address
   */
  function _delegate(address payable _implementation) internal {
    assembly {
      calldatacopy(0, 0, calldatasize())
      let result := delegatecall(gas(), _implementation, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())

      switch result
        case 0 {
          revert(0, returndatasize())
        }
        default {
          return(0, returndatasize())
        }
    }
  }
}
