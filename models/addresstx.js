var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AddressTxSchema = new Schema({
  a_id: { type: String, index: true },
  txid: { type: String, lowercase: true, index: true },
  blockindex: { type: Number, default: 0, index: true },
  txIndex: { type: Number, default: 0 },
  amount: { type: Number, default: 0, index: true }
}, {id: false});

AddressTxSchema.index({a_id: 1, blockindex: 1, txIndex: 1});

module.exports = mongoose.model('AddressTx', AddressTxSchema);
