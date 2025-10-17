const bcrypt = require("bcryptjs");
const db = require("../data/database");
const crypto = require("crypto");

class User {
  constructor(email, password, fullname, birthday, street, city, postalCode) {
    this.email = email;
    this.password = password;
    this.name = fullname;
    this.birthday = birthday;
    this.address = {
      street: street,
      city: city,
      postalCode: postalCode,
    };
    this.isVerified = false;
    this.verificationToken = null;
  }

  async getUserByEmail(email) {
    return await db.getDb().collection("Users").findOne({ email: { $eq: email } });
  }
  static async getUserById(id) {
    return await db.getDb().collection("Users").findOne({ _id: id });
  }
  async userAlreadyExists() {
    try {
      const existingUser = await this.getUserByEmail(this.email);
      return !!existingUser;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      throw error; 
    }
  }
  

  async signup() {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    try {
      const newUser = {
        email: this.email,
        password: hashedPassword,
        name: this.name,
        birthday: this.birthday,
        address: this.address,
        isVerified: this.isVerified,
        verificationToken: verificationToken,
      };

      const result = await db.getDb().collection("Users").insertOne(newUser);
      return { success: true, userId: result.insertedId, verificationToken: verificationToken };
    } catch (error) {
      console.error("Error in signup:", error);
      return { success: false };
    }
  }

  hasMatchingPassword(hashedPassword) {
    return bcrypt.compare(this.password, hashedPassword);
  }
  async getAccountDetails(enteredUser){
    const accountDetails = await db.getDb().collection('Accounts').findOne({ userId: enteredUser._id });
    return accountDetails;
  }
  async getDetails(accountNumber){
    const accountDetails = await db.getDb().collection('Accounts').findOne({ accountNumber: accountNumber });
    if (!accountDetails) return null;
    return db.getDb().collection('Users').findOne({ _id: accountDetails.userId });
  }
}

module.exports = User;
