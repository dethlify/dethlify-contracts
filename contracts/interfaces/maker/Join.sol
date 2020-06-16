// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

import "./Vat.sol";
import "./Gem.sol";

interface Join {
  function join(address, uint256) external;

  function exit(address, uint256) external;

  function vat() external returns (Vat);

  function dai() external returns (Gem);
}
