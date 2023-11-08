import jwt, { Secret } from "jsonwebtoken";

// export const generateAccessToken = (id: any, role: string) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET as Secret, {
//     expiresIn: "30d",
//   });
// };