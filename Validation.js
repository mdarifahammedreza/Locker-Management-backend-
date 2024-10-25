class Validation {
    // Define the constant as a static property
    static SecretKey = "0000000000";

    constructor(parameters) {
        // Use parameters as needed in the constructor
    }

    // Example method to demonstrate using the SecretKey
    validateKey(key) {
        return key === Validation.SecretKey;
    }

    
}
