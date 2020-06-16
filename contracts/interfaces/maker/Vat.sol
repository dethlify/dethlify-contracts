// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

interface Vat {
  function hope(address) external;

  function dai(address) external view returns (uint256);
}
