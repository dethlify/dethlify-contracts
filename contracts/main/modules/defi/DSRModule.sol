// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

import "../BaseStorage.sol";
import "../BaseHeader.sol";
import "../../../interfaces/IERC20.sol";
import "../../../interfaces/maker/Gem.sol";
import "../../../interfaces/maker/Vat.sol";
import "../../../interfaces/maker/Pot.sol";
import "../../../interfaces/maker/Join.sol";

contract DSRModule is BaseStorage, BaseHeader {
  uint256 constant ADJUSTED_DECIMALS = 10**27;

  event InitDSR();
  event JoinDSR(uint256 amount);
  event ExitDSR(uint256 amount);
  event ExitAllDSR(uint256 amount);

  /**
   * @notice Initialize the DSR configuration.
   * @dev Needs to be done before the first join can be performed.
   * Reverts if unauthorized.
   * @param _pot the pot address
   * @param _join the join address
   * @param _vat the vat address
   */
  function initDSR(
    address _pot,
    address _join,
    address _vat
  ) public onlyOwner {
    Vat vat = Vat(_vat);
    vat.hope(_join);
    vat.hope(_pot);
    emit InitDSR();
  }

  /**
   * @notice Join an amount of DAI to the DSR contract to earn interest.
   * @dev reverts if unauthorized
   * @param _dai the DAI contract address
   * @param _join the JOIN contract address
   * @param _pot the POT contract address
   * @param _amount the amount of DAI to join
   */
  function joinDSR(
    address _dai,
    address _join,
    address _pot,
    uint256 _amount
  ) public onlyOwner {
    IERC20(_dai).approve(_join, _amount);
    Pot pot = Pot(_pot);
    Join join = Join(_join);
    uint256 chi = (now > pot.rho()) ? pot.drip() : pot.chi();
    join.join(address(this), _amount);
    uint256 adjustedAmount = _amount.mul(ADJUSTED_DECIMALS).div(chi);
    pot.join(adjustedAmount);
    emit JoinDSR(_amount);
  }

  /**
   * @notice Initialize and join an amount of DAI to the DSR contract
   * @dev reverts if unauthorized
   * @param _dai the DAI contract address
   * @param _join the JOIN contract address
   * @param _pot the POT contract address
   * @param _vat the VAT contract address
   * @param _amount the amount of DAI to join
   */
  function initAndJoinDSR(
    address _dai,
    address _join,
    address _pot,
    address _vat,
    uint256 _amount
  ) public onlyOwner {
    initDSR(_pot, _join, _vat);
    joinDSR(_dai, _join, _pot, _amount);
  }

  /**
   * @notice Get an amount of DAI back from the interest contract
   * @dev reverts if unauthorized
   * @param _join the JOIN contract address
   * @param _pot the POT contract address
   * @param _amount the amount of DAI (18 decimals) that will be exited
   */
  function exitDSR(
    address _join,
    address _pot,
    uint256 _amount
  ) public onlyOwner {
    Pot pot = Pot(_pot);
    Join join = Join(_join);
    pot.drip();
    pot.exit(_amount);
    join.exit(address(this), _amount);
    emit ExitDSR(_amount);
  }

  /**
   * @notice Get all savings from the DSR contract
   * @dev reverts if unauthorized
   * @param _join the JOIN contract address
   * @param _pot the POT contract address
   */
  function exitAllDSR(address _join, address _pot) public onlyOwner {
    Pot pot = Pot(_pot);
    Join join = Join(_join);
    pot.drip();
    // if (now > pot.rho()) pot.drip();
    pot.exit(pot.pie(address(this)));
    uint256 amount = join.vat().dai(address(this)).div(ADJUSTED_DECIMALS);
    join.exit(address(this), amount);
    emit ExitAllDSR(amount);
  }

  /**
   * @notice Get the current amount of DAI that is accumulating interest.
   * @dev reverts if unauthorized
   * @param _pot the POT contract address
   */
  function getDSRBalance(address _pot) public view returns (uint256) {
    Pot pot = Pot(_pot);
    uint256 pie = pot.pie(address(this));
    uint256 chi = pot.chi();
    return pie.mul(chi).div(ADJUSTED_DECIMALS);
  }
}
