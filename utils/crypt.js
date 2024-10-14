const CryptoJS = require("crypto-js");
const decrypt = (id) => {
    return CryptoJS.AES.decrypt(id, process.env.SECRET_KEY).toString(
      CryptoJS.enc.Utf8
    );
  };
  
module.exports = {decrypt}