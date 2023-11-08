import { Request } from 'express';

export interface IUserTokenVerifyPayload {
    user: string,
    session: string,
}