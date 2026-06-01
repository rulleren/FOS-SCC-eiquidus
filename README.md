# FOS-SCC-eiquidus

![GitHub last commit](https://img.shields.io/github/last-commit/rulleren/FOS-SCC-eiquidus)
![GitHub](https://img.shields.io/github/license/rulleren/FOS-SCC-eiquidus?color=ffbd11)

FOS-SCC-eiquidus is the official block explorer for [StakeCubeCoin (SCC)](https://explorer.friendsofstakecube.net), maintained by [Friends of StakeCube](https://github.com/rulleren). It is a fork of [eIquidus](https://github.com/team-exor/eiquidus), a feature-rich open-source block explorer written in Node.js and MongoDB. This fork includes SCC-specific fixes, improvements, and customizations built on top of the upstream eIquidus explorer.

> **Live explorer:** [https://explorer.friendsofstakecube.net](https://explorer.friendsofstakecube.net)

Table of Contents
------------------

- [Features](#features)
- [See it in Action](#see-it-in-action)
- [Installation](#installation)
  - [Pre-Install](#pre-install)
    - [Node.js](#nodejs)
    - [MongoDB](#mongodb)
  - [Database Setup](#database-setup)
  - [Download Source Code](#download-source-code)
  - [Install Node Modules](#install-node-modules)
  - [Configure Explorer Settings](#configure-explorer-settings)
- [Start/Stop the Explorer](#startstop-the-explorer)
  - [Start Explorer (Use for Testing)](#start-explorer-use-for-testing)
  - [Stop Explorer (Use for Testing)](#stop-explorer-use-for-testing)
  - [Start Explorer Using PM2 (Recommended for Production)](#start-explorer-using-pm2-recommended-for-production)
  - [Stop Explorer Using PM2](#stop-explorer-using-pm2)
  - [Reload Explorer Using PM2](#reload-explorer-using-pm2)
- [Syncing Databases with the Blockchain](#syncing-databases-with-the-blockchain)
  - [Commands for Manually Syncing Databases](#commands-for-manually-syncing-databases)
  - [Sample Crontab](#sample-crontab)
- [Wallet Settings](#wallet-settings)
- [Run Express Webserver on Port 80](#run-express-webserver-on-port-80)
- [TLS/SSL Support](#tlsssl-support)
- [Useful Scripts](#useful-scripts)
  - [Backup Database Script](#backup-database-script)
  - [Restore Database Script](#restore-database-script)
  - [Fix Address Balances Script](#fix-address-balances-script)
  - [Remove Duplicate Addresses Script](#remove-duplicate-addresses-script)
  - [Reindex Richlist](#reindex-richlist)
- [Known Issues](#known-issues)
- [Upstream Project](#upstream-project)
- [License](#license)

### Features

- Built using the following scripts and technologies:
  - Node.js (v20.9.0 or newer recommended)
  - MongoDB (v7.0.2 or newer recommended)
  - jQuery v3.7.1
  - Bootstrap v5.1.3
  - DataTables v1.13.6
  - Font Awesome v6.4.2
  - Chart.js v4.4.7
- Pages/features:
  - **Home/Explorer:** Displays latest SCC blockchain transactions
  - **Masternodes:** Displays all active SCC masternodes on the network
  - **Extraction:** Displays SCC block extraction/mining statistics
  - **Movement:** Displays latest transactions above a configurable threshold
  - **Network:** Displays peers connected to the SCC wallet daemon in the last 24 hours
  - **Top 100:** Displays the top 100 richest SCC addresses with wealth distribution breakdown
  - **API:** Public API endpoints for retrieving SCC network data without a local wallet
  - **Claim Address:** Allows address owners to set custom display names using wallet message signing
- SCC-specific fixes and improvements:
  - Fixed wealth distribution total always displaying correctly as 100.00%
  - Fixed address balance calculation and transaction ordering
  - Fixed extraction page settings propagation
  - Added `fix-balances` script for recalculating address balances after sync issues
  - Added `remove-duplicate-addresses` script for database cleanup

### See it in Action

- [https://explorer.friendsofstakecube.net](https://explorer.friendsofstakecube.net)

### Installation

#### Pre-Install

The following prerequisites must be installed before using the explorer:

- [Node.js](https://nodejs.org/en/) (v20.9.0 or newer recommended)
- [MongoDB](https://www.mongodb.com/) (v7.0.2 or newer recommended)
- [Git](https://git-scm.com/downloads) (v2.36.0 or newer recommended)
- A fully synchronized `sccd` wallet daemon with `txindex=1` enabled. See the [Wallet Settings](#wallet-settings) section for more details.

##### Node.js

The recommended way to install Node.js is by using the Node Version Manager (NVM):

```
sudo apt update
sudo apt install curl
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile
nvm install --lts
```

##### MongoDB

Follow the official MongoDB install instructions: [https://www.mongodb.com/docs/manual/administration/install-community/](https://www.mongodb.com/docs/manual/administration/install-community/)

Below are instructions to install the latest v7.x version of MongoDB on Ubuntu 22.04 (run one line at a time):

```
sudo apt-get install gnupg curl
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

Start and enable MongoDB:

```
sudo systemctl start mongod
sudo systemctl enable mongod.service
```

#### Database Setup

Open the MongoDB shell:

```
mongosh
```

Select database:

```
use explorerdb
```

Create a new user with read/write access:

```
db.createUser( { user: "eiquidus", pwd: "Nd^p2d77ceBX!L", roles: [ "readWrite" ] } )
```

Exit:

```
exit
```

#### Download Source Code

```
git clone https://github.com/rulleren/FOS-SCC-eiquidus explorer
```

#### Install Node Modules

```
cd explorer && npm install --only=prod
```

#### Configure Explorer Settings

```
cp ./settings.json.template ./settings.json
```

Edit `settings.json` with your SCC wallet RPC credentials and preferred settings.

**NOTE:** You can customize the site without affecting future updates by adding JavaScript to `public/js/custom.js` and CSS to `public/css/custom.scss`.

### Start/Stop the Explorer

#### Start Explorer (Use for Testing)

```
npm start
```

**NOTE:** mongod must be running before starting the explorer.

#### Stop Explorer (Use for Testing)

```
npm stop
```

#### Start Explorer Using PM2 (Recommended for Production)

```
npm run start-pm2
```

#### Stop Explorer Using PM2

```
npm run stop-pm2
```

#### Reload Explorer Using PM2

Use this to apply code changes without downtime:

```
npm run reload-pm2
```

### Syncing Databases with the Blockchain

#### Commands for Manually Syncing Databases

```
npm run sync-blocks     # Sync blockchain blocks
npm run sync-markets    # Sync market data
npm run reindex-rich    # Rebuild the richlist from current address balances
npm run reindex         # Full reindex of all blockchain data
```

#### Sample Crontab

```
*/1 * * * * cd /root/explorer && /usr/bin/node scripts/sync.js update 2>/dev/null
*/5 * * * * cd /root/explorer && /usr/bin/node scripts/sync.js market 2>/dev/null
0 */4 * * * cd /root/explorer && /usr/bin/node scripts/sync.js richlist 2>/dev/null
```

### Wallet Settings

The SCC wallet daemon (`sccd`) must be configured with the following settings in `stakecubecoin.conf`:

```
txindex=1
rpcuser=your_rpc_user
rpcpassword=your_rpc_password
rpcallowip=127.0.0.1
server=1
daemon=1
```

### Run Express Webserver on Port 80

By default the explorer runs on port 3001. To run on port 80, either use `setcap` to grant permissions:

```
sudo setcap cap_net_bind_service=+ep /path/to/node
```

Or use a reverse proxy such as Caddy or Nginx pointing to `http://127.0.0.1:3001`.

### TLS/SSL Support

TLS termination is recommended to be handled by a reverse proxy such as [Caddy](https://caddyserver.com/) or Nginx rather than the explorer directly. This setup is used in the production deployment of this explorer.

### Useful Scripts

#### Backup Database Script

```
npm run create-backup              # Backup to explorer/backups/ with date as filename
npm run create-backup mybackup     # Backup with specific filename
npm run create-backup "" claimaddresses  # Backup only claimaddresses collection
```

#### Restore Database Script

```
npm run restore-backup mybackup           # Restore from explorer/backups/mybackup.bak
npm run restore-backup mybackup claimaddresses  # Restore only claimaddresses collection
```

#### Fix Address Balances Script

Recalculates and corrects the received, sent, and balance values for all addresses by re-processing all address transactions from scratch. Useful after sync issues or database migrations.

```
npm run fix-balances
```

#### Remove Duplicate Addresses Script

Finds and removes duplicate address records from the database, keeping only the first occurrence of each address.

```
npm run remove-duplicate-addresses
```

#### Reindex Richlist

Rebuilds the top 100 richlist from current address balances in the database:

```
npm run reindex-rich
```

### Known Issues

**Error: bind EACCES ...**

This error appears when trying to run the explorer on a port below 1024. Use a reverse proxy or `setcap` as described in [Run Express Webserver on Port 80](#run-express-webserver-on-port-80).

**Error: Callback was already called**

Usually a connection issue between the explorer and the wallet daemon. Verify that the RPC port (not P2P port) is configured correctly in `settings.json`.

### Upstream Project

This project is a fork of [eIquidus](https://github.com/team-exor/eiquidus) by the Exor development team. For general block explorer features, documentation, and upstream changes, refer to the original project.

### License

Copyright (c) 2019-2025, The Exor Community<br />
Copyright (c) 2017, The Chaincoin Community<br />
Copyright (c) 2015, Iquidus Technology<br />
Copyright (c) 2015, Luke Williams<br />
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

* Neither the name of Iquidus Technology nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
