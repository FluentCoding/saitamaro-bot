import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { accounts } from "../../.env.json"

export function checkToken(authorizedPrefixes: string[]) {
    return (req: FastifyRequest, res: FastifyReply, done: HookHandlerDoneFunction) => {
        if (authorizedPrefixes.find(prefix => req.raw.url.startsWith(prefix))) {
            const token = Buffer.from(req.headers.authorization ?? "", "base64").toString("ascii")
            if (!accounts.includes(token)) {
                res.code(401).send();
                done(new Error('Unauthorized'))
            }
        }
        done()
    }
}