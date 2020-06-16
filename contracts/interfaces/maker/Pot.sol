// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

interface Pot {
  function chi() external view returns (uint256);

  function rho() external returns (uint256);

  function drip() external returns (uint256);

  function join(uint256) external;

  function exit(uint256) external;

  function pie(address) external view returns (uint256);
}
