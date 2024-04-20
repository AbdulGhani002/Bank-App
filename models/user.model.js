const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("../data/database");
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
  }

  async getUserByEmail(email) {
    return await db.getDb().collection("Users").findOne({ email });
  }

  async userAlreadyExists() {
    try {
      const existingUser = await this.getUserByEmail(this.email);
      return !!existingUser;
    } catch (error) {
      throw new Error("Error checking if user exists");
    }
  }

  async signup() {
    try {
      const hashedPassword = await bcrypt.hash(this.password, 12);
      const userId = uuidv4();

      const newUser = {
        userId: userId,
        email: this.email,
        password: hashedPassword,
        name: this.name,
        address: this.address,
      };

      const alreadyExists = await this.userAlreadyExists();
      if (alreadyExists) {
        return { success: false, message: "User already exists" };
      }

      await db.getDb().collection("Users").insertOne(newUser);

      return { success: true };
    } catch (error) {
      throw new Error("Internal Server Error");
    }
  }

  hasMatchingPassword(hashedPassword) {
    return bcrypt.compare(this.password, hashedPassword);
  }
  async getAccountDetails(enteredUser){
    const accountDetails = await db.getDb().collection('Accounts').findOne({accountId:enteredUser.userId});
    return accountDetails;
  }
  async getDetails(accountNumber){
    const accountDetails = await db.getDb().collection('Accounts').findOne({accountNumber:accountNumber});
    return db.getDb().collection('Users').findOne({userId:accountDetails.accountId})
  }
}

module.exports = User;
