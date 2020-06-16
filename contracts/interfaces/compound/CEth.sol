// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

interface CEth {
  function mint() external payable;

  function exchangeRateCurrent() external returns (uint256);

  function exchangeRateStored() external view returns (uint256);

  function supplyRatePerBlock() external returns (uint256);

  function redeem(uint256) external returns (uint256);

  function redeemUnderlying(uint256) external returns (uint256);

  function balanceOf(address owner) external view returns (uint256);

  function balanceOfUnderlying(address owner) external view returns (uint256);
}
