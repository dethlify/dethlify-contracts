// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

/**
 * @title DethlifyContract
 * @notice The interface for the dethlify contracts. Used by the manager.
 * @author Christian Engel - <chris@dethlify.com>
 */
interface DethlifyContract {
  function premium() external view returns (bool);

  function paidUntil() external view returns (uint256);

  function markPaid(uint256 months) external;
}
