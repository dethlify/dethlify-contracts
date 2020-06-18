// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

import "./BaseStorage.sol";
import "./BaseHeader.sol";

/**
 * @title BaseModule
 * @dev Contains all base functions.
 * @author Christian Engel - <chris@dethlify.com>
 */
contract BaseModule is BaseStorage, BaseHeader {
  /**
   * @dev Change the owner of the contract.
   *
   * @param _owner the address of the new owner
   */
  function changeOwner(address payable _owner) public onlyOwner {
    owner = _owner;
  }

  /**
   * @dev Calculates shares of all heirs based on the token distribution
   * @notice This is done once the first heir wants to claim his token shares.
   * The default distribution will be used if the requested token
   * has no distribution set.
   * @param _token the token address
   * @param _total the total balance
   */
  function calculateShares(address _token, uint256 _total) internal {
    if (tokenIsLocked[_token]) return;
    uint256 multiplier = 100;
    address token = _token;

    if (!distributionIsSet[token]) {
      token = ETHER;
    }
    for (uint256 i = 0; i < heirs.length; i++) {
      uint256 share = _total.mul(tokenDistribution[token][heirs[i]]).div(multiplier).div(100);
      calculatedTokenShares[token][heirs[i]] = share;
    }
    tokenIsLocked[token] = true;
    emit StartClaimCycle(token);
  }

  /**
   * @dev Update or add a token share distributions.
   *
   * @param _tokens the token addresses
   * @param _distributions the list of percentages for all heirs
   */
  function updateOrAddTokenDistributions(address[] memory _tokens, uint256[] memory _distributions)
    public
    onlyOwner
  {
    require(_distributions.length == _tokens.length * heirs.length, "BIF: Set percentages for all heirs!"); // prettier-ignore
    uint256 sum = 0;
    for (uint256 i = 0; i < _tokens.length; i++) {
      if (!distributionIsSet[_tokens[i]]) {
        setTokens.push(_tokens[i]);
        distributionIsSet[_tokens[i]] = true;
      }
      sum = 0;
      for (uint256 j = 0; j < heirs.length; j++) {
        tokenDistribution[_tokens[i]][heirs[j]] = _distributions[i * heirs.length + j];
        sum += tokenDistribution[_tokens[i]][heirs[j]];
      }
      require(sum == 10000, "BIF: Total share percentage must be equal to 100%!");
    }

    emit UpdateTokenDistributions(_tokens, _distributions);
  }

  /**
   * @dev Remove token distributions
   *
   * The _newSetTokens needs to contain the setTokens without the _tokens that
   * will be removed.
   *
   * @param _tokens list of tokens that shall be removed
   * @param _newSetTokens list of tokens that are tracked
   */
  function removeTokenDistributions(address[] memory _tokens, address[] memory _newSetTokens)
    public
    onlyOwner
  {
    setTokens = _newSetTokens;
    for (uint256 i = 0; i < _tokens.length; i++) {
      require(_tokens[i] != ETHER, "BIF: Can't remove default token distribution!");
      delete distributionIsSet[_tokens[i]];
      for (uint256 j = 0; j < heirs.length; j++) {
        delete tokenDistribution[_tokens[i]][heirs[j]];
      }
    }
  }

  /**
   * @dev Return heirs.
   *
   * @return the list of heirs
   */
  function getHeirs() public view returns (bytes32[] memory) {
    return heirs;
  }

  /**
   * @dev Return distribution percentages.
   *
   * @return the list of percentages
   */
  function getTokenDistribution(address _token) public view returns (uint256[] memory) {
    uint256[] memory p = new uint256[](heirs.length);
    if (distributionIsSet[_token]) {
      for (uint256 i = 0; i < heirs.length; i++) {
        p[i] = tokenDistribution[_token][heirs[i]];
      }
    } else {
      for (uint256 i = 0; i < heirs.length; i++) {
        p[i] = tokenDistribution[ETHER][heirs[i]];
      }
    }
    return p;
  }

  /**
   * @dev Return multiple distributions.
   *
   * The return format is the following:
   * [dist_heir_1_token_1, dist_heir_2_token_1, dist_heir_1_token_2, dist_heir_2_token_2, ...]
   */
  function getTokenDistributions(address[] memory _tokens) public view returns (uint256[] memory) {
    uint256[] memory distributions = new uint256[](heirs.length * _tokens.length);
    for (uint256 i = 0; i < _tokens.length; i++) {
      uint256[] memory d = getTokenDistribution(_tokens[i]);
      for (uint256 j = 0; j < d.length; j++) {
        // heirs length
        uint256 idx = i * d.length + j;
        distributions[idx] = d[j];
      }
    }
    return distributions;
  }

  /**
   * @dev Return the tokens that are currently set.
   *
   * @return the set tokens
   */
  function getSetTokens() public view returns (address[] memory) {
    return setTokens;
  }

  /**
   * @notice Get the hash of an address
   * @param _a the address
   * @return the hash of the address
   */
  function hashAddress(address _a) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(_a));
  }

  /**
   * @dev Change the lock period.
   *
   * The lock period can't be larger than two years but must be larger
   * than one month. This will also execute the pulse function.
   *
   * @param _lock the new lock period.
   */
  function updateLock(uint256 _lock) public validLock(_lock) onlyOwner {
    lock = _lock;
    emit UpdateLock(_lock);
    pulse();
  }

  /**
   * @dev Callback of the owner.
   * This signals that the owner is still active.
   */
  function pulse() public onlyOwner {
    last = now;
    emit Pulse();
  }

  /**
   * @dev Internal transfer function.
   *
   * @param _to the recipient address
   * @param _amount the ETH amount to send in wei
   */
  function _transfer(address _to, uint256 _amount) internal {
    // solium-disable security/no-call-value
    (bool success, ) = _to.call.value(_amount)("");
    require(success, "BM: Transfer failed!");
    emit Transfer(_to, _amount);
  }

  /**
   * @dev Internal token transfer function.
   *
   * @param _token the token address
   * @param _to the receiver
   * @param _amount the token amount
   */
  function _transferToken(
    address _token,
    address _to,
    uint256 _amount
  ) internal {
    IERC20 tkn = IERC20(_token);
    tkn.transfer(_to, _amount);
    emit TransferToken(_token, _to, _amount);
  }

  /**
   * @dev Internal withdraw function.
   *
   * Allows heirs to withdraw their shares once during a claim cycle.
   */
  function _withdraw() internal {
    bytes32 heir = hashAddress(msg.sender);
    require(!hasClaimedToken[ETHER][heir], "W: Can only claim once during claim cycle!");
    if (!tokenIsLocked[ETHER]) {
      calculateShares(ETHER, address(this).balance);
    }
    numHaveClaimedToken[ETHER]++;
    hasClaimedToken[ETHER][heir] = true;
    uint256 share = calculatedTokenShares[ETHER][heir];
    _transfer(msg.sender, share);

    if (numHaveClaimedToken[ETHER] == heirs.length) {
      _resetClaimCycle(ETHER);
    }
    emit Withdraw(msg.sender);
  }

  /**
   * @dev Internal withdraw function for tokens.
   *
   * Calculates the token share and sends that token to the heir.
   * If no specific token percentages are set, the default percentages
   * will be used.
   *
   * @param _token the token address
   */
  function _withdrawToken(address _token) internal {
    bytes32 heir = hashAddress(msg.sender);
    require(!hasClaimedToken[_token][heir], "WT: Can only claim once during claim cycle!"); // prettier-ignore
    IERC20 tkn = IERC20(_token);
    if (!tokenIsLocked[_token]) {
      calculateShares(_token, tkn.balanceOf(address(this)));
    }
    numHaveClaimedToken[_token]++;
    hasClaimedToken[_token][heir] = true;
    uint256 share = calculatedTokenShares[_token][heir];
    tkn.transfer(msg.sender, share);

    if (numHaveClaimedToken[_token] == heirs.length) {
      _resetClaimCycle(_token);
    }
    emit WithdrawToken(msg.sender, _token);
  }

  function _resetClaimCycle(address _token) internal {
    delete numHaveClaimedToken[_token];
    delete tokenIsLocked[_token];
    for (uint256 i = 0; i < heirs.length; i++) {
      delete hasClaimedToken[_token][heirs[i]];
      delete calculatedTokenShares[_token][heirs[i]];
    }
    emit ResetClaimCycle(_token);
  }

  /**
   * @dev Allows owner to transfer all ETH and token funds out of the contract.
   *
   * @param _to the receiver address
   * @param _tokens the list of ERC20 tokens
   */
  function _exit(address _to, address[] memory _tokens) internal {
    _transfer(_to, address(this).balance);
    for (uint256 i = 0; i < _tokens.length; i++) {
      IERC20 tkn = IERC20(_tokens[i]);
      uint256 balance = tkn.balanceOf(address(this));
      if (balance > 0) {
        tkn.transfer(_to, balance);
      }
    }
    emit Exit(_to, _tokens);
  }

  /**
   * @dev Allow to update heirs.
   *
   * This is called whenever the owner adds or removes heirs or updates the address of an heir.
   * All the previously set distributions will be deleted and the default distribution
   * (the ETHER) distribution will be set.
   *
   * @param _heirs the list of new heirs
   * @param _tokens the list of new set tokens
   * @param _distributions a list of ether distributions for each heir
   */
  function _updateHeirs(
    bytes32[] memory _heirs,
    address[] memory _tokens,
    uint256[] memory _distributions
  ) internal {
    // remove existing token distributions
    for (uint256 i = 0; i < heirs.length; i++) {
      delete isHeir[heirs[i]];
      for (uint256 j = 0; j < setTokens.length; j++) {
        delete tokenDistribution[setTokens[j]][heirs[i]];
        delete distributionIsSet[setTokens[j]];
      }
    }

    // set new values
    heirs = _heirs;
    setTokens = _tokens;
    for (uint256 i = 0; i < _tokens.length; i++) {
      uint256 sum = 0;
      for (uint256 j = 0; j < heirs.length; j++) {
        uint256 idx = i * heirs.length + j;
        tokenDistribution[setTokens[i]][heirs[j]] = _distributions[idx];
        sum += _distributions[idx];
      }
      distributionIsSet[_tokens[i]] = true;
      require(sum == 10000, "BM: Invalid distribution.");
    }
  }

  /**
   * @dev Allow to update the distributions
   *
   * @param _tokens the list of tokens
   * @param _distributions the list of new distributions
   */
  function _updateDistributions(address[] memory _tokens, uint256[] memory _distributions)
    internal
  {
    for (uint256 i = 0; i < heirs.length; i++) {
      for (uint256 j = 0; j < setTokens.length; j++) {
        delete tokenDistribution[setTokens[j]][heirs[i]];
        delete distributionIsSet[setTokens[j]];
      }
    }
    setTokens = _tokens;
    for (uint256 i = 0; i < _tokens.length; i++) {
      uint256 sum = 0;
      for (uint256 j = 0; j < heirs.length; j++) {
        uint256 idx = i * heirs.length + j;
        tokenDistribution[setTokens[i]][heirs[j]] = _distributions[idx];
        sum += _distributions[idx];
      }
      require(sum == 10000, "BM: Invalid distribution.");
      distributionIsSet[_tokens[i]] = true;
    }
  }

  /**
   * @dev Transfer ETH funds.
   * @notice In order to execute this function the fee must first be paid.
   *
   * @param _to the recipient address
   * @param _amount the amount of ETH in wei
   */
  function transfer(address _to, uint256 _amount) public noReentry onlyOwner isPaid {
    _transfer(_to, _amount);
  }

  /**
   * @dev Transfer tokens.
   * @notice In order to execute this function the fee must first be paid.
   *
   * @param _token the token address
   * @param _to the recipient address
   * @param _amount the amount of ETH in wei
   */
  function transferToken(
    address _token,
    address _to,
    uint256 _amount
  ) public onlyOwner isPaid noReentry {
    _transferToken(_token, _to, _amount);
  }

  /**
   * @dev Transfer multiple tokens.
   * @notice allows for batch transfers. Transfer multiple tokens to multiple
   * recipients.
   * @param _recipients the recipients addresses
   * @param _tokens the tokens
   * @param _amounts the amounts per token
   */
  function transferMultiple(
    address[] memory _recipients,
    address[] memory _tokens,
    uint256[] memory _amounts
  ) public noReentry onlyOwner isPaid {
    for (uint256 i = 0; i < _recipients.length; i++) {
      if (_tokens[i] == ETHER) {
        _transfer(_recipients[i], _amounts[i]);
      } else {
        _transferToken(_tokens[i], _recipients[i], _amounts[i]);
      }
    }
  }

  /**
   * @dev Withdraw ETH funds.
   * Heirs can call this function to get access to their shares.
   * Can only be called if the contract fee was paid.
   */
  function withdraw() public noReentry afterDeath onlyHeir isPaid {
    _withdraw();
  }

  /**
   * @dev Withdraw token funds.
   *
   * Heirs can call this function to get access to their shares.
   * Can only be called if the contract fee was paid.
   *
   * @param _token the token address
   */
  function withdrawToken(address _token) public noReentry afterDeath onlyHeir isPaid {
    _withdrawToken(_token);
  }

  /**
   * @dev Allow owner to transfer all ETH and token funds out of
   * the contract if the fee was paid.
   *
   * @param _to the receiver address
   * @param _tokens the list of ERC20 tokens
   */
  function exit(address _to, address[] memory _tokens) public onlyOwner isPaid noReentry {
    require(_to != address(0), "P: No valid address!");
    _exit(_to, _tokens);
  }

  /**
   * @dev Allow owner to update the heirs.
   *
   * @param _heirs the list of new heirs
   * @param _tokens the list of new set tokens
   * @param _distributions a list of lists that represent the distributions for each heir of each token
   */
  function updateHeirs(
    bytes32[] memory _heirs,
    address[] memory _tokens,
    uint256[] memory _distributions
  ) public onlyOwner equalArraySize(_distributions.length, _heirs.length * _tokens.length) {
    require(_heirs.length > 0, "P: Add at least one heir.");
    _updateHeirs(_heirs, _tokens, _distributions);
  }

  /**
   * @dev Allow owner to update the distribution
   *
   * This action will replace all token distributions with the new ones.
   * This requires that the heirs stayed the same.
   *
   * @param _distributions the list of distributions
   * @param _tokens the new list of tokens that will be set
   */
  function updateDistributions(address[] memory _tokens, uint256[] memory _distributions)
    public
    onlyOwner
    equalArraySize(_distributions.length, heirs.length * _tokens.length)
  {
    _updateDistributions(_tokens, _distributions);
  }

  /**
   * @dev Pay the monthly fee with a given token.
   *
   * This function checks if the token is an accepted means of payment, and
   * consecutively approves an allowance for the manager to transfer the funds.
   * Then the manager is called to initiate the payment. If successful, the
   * fee will be paid.
   *
   * @param _token the payment token
   */
  function payMonthlyFee(address _token) public noReentry onlyOwner {
    // 1. get manager
    Manager manager = Manager(proxy.getManagerImplementation());

    // 2. get fee
    uint256 fee = manager.getMonthlyFee(_token);

    // 3. set token allowance to the fee
    IERC20(_token).approve(address(manager), fee);

    // 4. request payment from manager
    manager.payMonthlyFee(address(this), payable(address(this)), _token);

    emit Pay(_token, fee);
  }

  /**
   * @dev Pay the yearly fee with a given token.
   *
   * This function checks if the token is an accepted means of payment, and
   * consecutively approves an allowance for the manager to transfer the funds.
   * Then the manager is called to initiate the payment. If successful, the
   * fee will be paid.
   *
   * @param _token the payment token
   */
  function payYearlyFee(address _token) public noReentry onlyOwner {
    // 1. get manager
    Manager manager = Manager(proxy.getManagerImplementation());

    // 2. get fee
    uint256 fee = manager.getYearlyFee(_token);

    // 3. set token allowance to the fee
    IERC20(_token).approve(address(manager), fee);

    // 4. request payment from manager
    manager.payYearlyFee(address(this), payable(address(this)), _token);

    emit Pay(_token, fee);
  }

  /**
   * @dev Marks the contract as paid for a number of months.
   * Only the dethlify manager is able to call this function.
   *
   * @param _numMonths the number of months that will be paid for
   */
  function markPaid(uint256 _numMonths) public onlyManager {
    paidUntil = paidUntil + _numMonths * month;
  }
}
