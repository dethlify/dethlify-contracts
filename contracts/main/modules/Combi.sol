// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;

import "./BaseStorage.sol";
import "./BaseHeader.sol";
import "./BaseModule.sol";
import "./defi/CompoundModule.sol";
import "./defi/DSRModule.sol";

/**
 * @title Combi
 * @notice Used only to generate ABI that contains all functions
 * @author Christian Engel - <chris@dethlify.com>
 */
contract Combi is BaseStorage, BaseHeader, BaseModule, CompoundModule, DSRModule {

}
