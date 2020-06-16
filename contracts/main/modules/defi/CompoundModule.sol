// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

import "../BaseStorage.sol";
import "../BaseHeader.sol";
import "../../../interfaces/compound/CEth.sol";
import "../../../interfaces/compound/CToken.sol";

contract CompoundModule is BaseStorage, BaseHeader {
  event SupplyEthToCompound(uint256 amount);
  event SupplyTokenToCompound(address token, uint256 amount);
  event RedeemToken(uint256 amount, bool isUnderlying);
  event RedeemETH(uint256 amount, bool isUnderlying);

  /**
   * @notice Supply ETH and receive cEther tokens.
   * @dev reverts if unauthorized or if the transfer failed
   * @param _cETH the cEther contract address
   * @param _amount the amount of ETH to supply
   */
  function supplyEth(address payable _cETH, uint256 _amount) public onlyOwner {
    CEth cEth = CEth(_cETH);
    cEth.mint.value(_amount)();
    emit SupplyEthToCompound(_amount);
  }

  /**
   * @notice Supply an ERC20 token to receive cTokens.
   * @dev reverts if unauthorized or if the transfer failed
   * @param _cERC20 the cToken contract
   * @param _token the underlying token contract address
   * @param _amount the amount of underlying tokens to supply
   */
  function supplyToken(
    address _cERC20,
    address _token,
    uint256 _amount
  ) public onlyOwner {
    IERC20 tkn = IERC20(_token);
    CToken cToken = CToken(_cERC20);
    tkn.approve(_cERC20, _amount);
    require(cToken.mint(_amount) == 0, "C: Error minting token.");
    emit SupplyTokenToCompound(_token, _amount);
  }

  /**
   * @notice Redeem all ETH with interest.
   * This works by calculating the total balance of cEther tokens and
   * then redeeming them.
   * @dev reverts if unauthorized or if the transfer failed
   * @param _cETH the cEther contract address
   */
  function redeemAllEth(address payable _cETH) public onlyOwner {
    CEth cEth = CEth(_cETH);
    uint256 balance = cEth.balanceOf(address(this));
    emit RedeemETH(balance, false);
    require(cEth.redeem(balance) == 0, "C: Could not redeem all ETH.");
  }

  /**
   * @notice Redeem all tokens with interest.
   * This works by calculating the total balance of cToken tokens and
   * then redeeming them.
   * @dev reverts if unauthorized or if the transfer failed
   * @param _cERC20 the cToken contract address
   */
  function redeemAllTokens(address _cERC20) public onlyOwner {
    CToken cToken = CToken(_cERC20);
    uint256 balance = cToken.balanceOf(address(this));
    emit RedeemToken(balance, false);
    require(cToken.redeem(balance) == 0, "C: Could not redeem all Tokens.");
  }

  /**
   * @notice Redeem ETH based on underlying amount or based on cEther amount
   * If _isBasedOnCToken is true, then _amount represents the amount of cEther tokens
   * the user wants to redeem. If it's false, then _amount represents the
   * amount of underlying ETH the user wants to redeem.
   * @dev reverts if unauthorized or if the transfer failed
   * @param _cETH the cEther contract address
   * @param _amount the amount of tokens to redeem
   * @param _isBasedOnCToken the redeem type
   */
  function redeemEth(
    address payable _cETH,
    uint256 _amount,
    bool _isBasedOnCToken
  ) public onlyOwner {
    CEth cEth = CEth(_cETH);
    uint256 result;
    if (_isBasedOnCToken) {
      // based on cEther amount
      result = cEth.redeem(_amount);
    } else {
      // based on underlying ETH amount
      result = cEth.redeemUnderlying(_amount);
    }
    emit RedeemETH(_amount, _isBasedOnCToken);
    require(result == 0, "C: Redeem ETH failed.");
  }

  /**
   * @notice Redeem token based on underlying amount or based on cToken amount
   * If _isBasedOnCToken is true, then _amount represents the amount of cToken tokens
   * the user wants to redeem. If it's false, then _amount represents the
   * amount of underlying tokens the user wants to redeem.
   * @dev reverts if unauthorized or if the transfer failed
   * @param _cERC20 the cEther contract address
   * @param _amount the amount of tokens to redeem
   * @param _isBasedOnCToken the redeem type
   */
  function redeemTokens(
    address _cERC20,
    uint256 _amount,
    bool _isBasedOnCToken
  ) public onlyOwner {
    CToken cToken = CToken(_cERC20);
    uint256 result;
    if (_isBasedOnCToken) {
      // based on cToken amount
      result = cToken.redeem(_amount);
    } else {
      // based on underlying token amount
      result = cToken.redeemUnderlying(_amount);
    }
    emit RedeemToken(_amount, _isBasedOnCToken);
    require(result == 0, "C: Redeem token failed.");
  }
}
