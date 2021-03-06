import { Middleware, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { NextFunction, Request } from 'express';
import * as cors from 'cors';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import * as passport from 'passport';

@Middleware()
export class IsAuthenticated implements NestMiddleware {
    constructor(private authService: AuthService) {

    }
    public resolve() {
        if (process.env.AUTHENTICATION === 'passport') {
            return async (req: Request, res: Response, next: NextFunction) => {
                return passport.authenticate('jwt', { session: false })(req, res, next);
            };
        } else {
            return async (req: Request, res: Response, next: NextFunction) => {
                if (req.headers.authorization && (req.headers.authorization as string).split(' ')[0] === 'Bearer') {
                    const token = (req.headers.authorization as string).split(' ')[1];
                    let decoded: any;
                    try {
                        decoded = jwt.verify(token, process.env.SECRET);
                    } catch (e) {
                        if (e.name === 'TokenExpiredError') throw new HttpException('Expired token', HttpStatus.UNAUTHORIZED);
                        throw new HttpException('Authentication Error', HttpStatus.UNAUTHORIZED);
                    }

                    await this.authService.validateUser(decoded._id);

                    return next();
                } else {
                    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
                }
            };
        }
    }
}
