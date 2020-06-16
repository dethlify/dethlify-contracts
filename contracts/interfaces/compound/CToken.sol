// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

interface CToken {
  function mint(uint256) external returns (uint256);

  function exchangeRateCurrent() external view returns (uint256);

  function supplyRatePerBlock() external view returns (uint256);

  function redeem(uint256) external returns (uint256);

  function redeemUnderlying(uint256) external returns (uint256);

  function balanceOf(address owner) external view returns (uint256);

  function balanceOfUnderlying(address owner) external view returns (uint256);
}
