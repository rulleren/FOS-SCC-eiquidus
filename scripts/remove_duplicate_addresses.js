const mongoose = require('mongoose');
const settings = require('../lib/settings');
const Address = require('../models/address');

var dbString = 'mongodb://' + encodeURIComponent(settings.dbsettings.user);
dbString = dbString + ':' + encodeURIComponent(settings.dbsettings.password);
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.set('strictQuery', true);

mongoose.connect(dbString).then(() => {
  console.log('Connected to database');
  console.log('Finding duplicate addresses...');
  
  Address.aggregate([
    {$group: {_id: "$a_id", ids: {$push: "$_id"}, count: {$sum: 1}}},
    {$match: {count: {$gt: 1}}}
  ]).then((duplicates) => {
    console.log(`Found ${duplicates.length} addresses with duplicates`);
    
    let removed = 0;
    const async = require('async');
    
    async.eachSeries(duplicates, function(dup, loop) {
      // Keep the first record, delete the rest
      const idsToDelete = dup.ids.slice(1);
      
      Address.deleteMany({_id: {$in: idsToDelete}}).then(() => {
        removed += idsToDelete.length;
        if (removed % 100 === 0) {
          console.log(`Removed ${removed} duplicate records...`);
        }
        loop();
      }).catch((err) => {
        console.log(`Error deleting duplicates for ${dup._id}:`, err);
        loop();
      });
    }, function() {
      console.log(`Finished! Removed ${removed} duplicate address records`);
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
