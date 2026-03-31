import jwt, { type JwtPayload, type SignOptions, type VerifyOptions } from "jsonwebtoken";
// Isso aqui é só para traduzir os erros e transformar em uma função que vai chamar com async await.

export class JWTError extends Error {
    /**
     * @param {string} message
     * @param {Error | unknown} [cause]
    */
    constructor(message: string, cause?: Error | unknown) {
        super(message);
        this.cause = cause;
        this.name = "JWTError";
    }
}

export class DecodeJWTError extends JWTError {}
export class SignJWTError extends JWTError {}

/**
 * 
 * @param {string} token 
 * @param {string} secret 
 * @param {import("jsonwebtoken").VerifyOptions} [options]
 * @returns {Promise<import("jsonwebtoken").JwtPayload>}
 */
export const verifyJWTToken = async (token: string, secret: string, options?: VerifyOptions): Promise<JwtPayload> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, options, (error, decoded) => {
            if(error) {
                if (error instanceof jwt.JsonWebTokenError) {
                    if (error.message == "jwt must be provided") {
                        reject(new DecodeJWTError("O token de autenticação não foi fornecido", error));
                    } else if (error.message == "jwt malformed" || error.message == "invalid signature" || error.message == "invalid token") {
                        reject(new DecodeJWTError("O token de autenticação foi alterado ou é inválido", error));
                    } else if (error.message == "jwt expired") {
                        reject(new DecodeJWTError("O token de autenticação expirou", error));
                    } else {
                        reject(new DecodeJWTError("Problemas ao decodificar o token JWT: "+ error.message, error));
                    }
                } else {
                    reject(new DecodeJWTError("Erro desconhecido ao decodificar o token JWT:"+ error, error));
                }
                return;
            }

            if (!decoded || typeof decoded === "string") {
                reject(new DecodeJWTError("O token de autenticação não foi decodificado corretamente"));
                return;
            }

            resolve(decoded);
        });
    });
};

/**
 * 
 * @param {Record<string, string | string[] | null | Record<string, string | null>>} payload 
 * @param {string} secret 
 * @param {import("jsonwebtoken").SignOptions} options 
 * @returns {Promise<string>}
 */
export const signJWTToken = async (payload: Record<string, string | string[] | null | Record<string, string | null>>, secret: string, options: SignOptions): Promise<string> => {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, secret, options, (error, token) => {
            if (error) {
                reject(new SignJWTError("Erro ao assinar o token JWT:"+ error.message, error));
                return;
            }
            if(!token) {
                reject(new SignJWTError("Erro ao assinar o token JWT: token não gerado"));
                return;
            }
            resolve(token);
        });
    });
};
