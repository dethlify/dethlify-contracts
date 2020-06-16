// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

interface Gem {
  function transferFrom(
    address,
    address,
    uint256
  ) external returns (bool);

  function approve(address, uint256) external returns (bool);
}
