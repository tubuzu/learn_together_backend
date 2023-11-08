import jwt, { Secret } from "jsonwebtoken";

export function signJwt(object: Object, secretKey: Secret, options?: jwt.SignOptions | undefined) {
    return jwt.sign(object, secretKey, {
        ...(options && options),
    });
}

export function verifyJwt(token: string, secretKey: Secret) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return {
            valid: true,
            expired: false,
            decoded,
        };
    } catch (e: any) {
        console.error(e);
        return {
            valid: false,
            expired: e.message === "jwt expired",
            decoded: null,
        };
    }
}
