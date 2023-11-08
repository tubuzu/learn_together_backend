export function generatePassword(length: number) {
    // Create a string of possible characters
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    // Initialize an empty password
    let password = "";
    // Loop for the given length
    for (let i = 0; i < length; i++) {
        // Pick a random index from the chars string
        let index = Math.floor(Math.random() * chars.length);
        // Append the character at that index to the password
        password += chars[index];
    }
    // Return the password
    return password;
}