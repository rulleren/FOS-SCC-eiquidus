const mongoose = require('mongoose');
const settings = require('../lib/settings');
const Address = require('../models/address');
const AddressTx = require('../models/addresstx');
const async = require('async');

var dbString = 'mongodb://' + encodeURIComponent(settings.dbsettings.user);
dbString = dbString + ':' + encodeURIComponent(settings.dbsettings.password);
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.set('strictQuery', true);

mongoose.connect(dbString).then(() => {
  console.log('Connected to database');
  console.log('Recalculating all address balances...');
  
  Address.find({}).then((addresses) => {
    console.log(`Found ${addresses.length} addresses to process`);
    let processed = 0;
    
    async.eachSeries(addresses, function(address, loop) {
      // Get all transactions for this address
      AddressTx.find({a_id: address.a_id}).then((txs) => {
        let received = 0;
        let sent = 0;
        
        txs.forEach(tx => {
          if (tx.amount > 0) {
            received += tx.amount;
          } else {
            sent += Math.abs(tx.amount);
          }
        });
        
        const balance = received - sent;
        
        // Update the address
        Address.updateOne({a_id: address.a_id}, {
          received: received,
          sent: sent,
          balance: balance
        }).then(() => {
          processed++;
          if (processed % 100 === 0) {
            console.log(`Processed ${processed}/${addresses.length} addresses`);
          }
          loop();
        }).catch((err) => {
          console.log(`Error updating ${address.a_id}:`, err);
          loop();
        });
      }).catch((err) => {
        console.log(`Error getting txs for ${address.a_id}:`, err);
        loop();
      });
    }, function() {
      console.log(`Finished! Processed ${processed} addresses`);
      mongoose.disconnect();
      process.exit(0);
    });
  }).catch((err) => {
    console.log('Error:', err);
    process.exit(1);
  });
}).catch((err) => {
  console.log('Database connection error:', err);
  process.exit(1);
});
