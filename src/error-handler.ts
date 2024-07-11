import type { FastifyInstance } from "fastify"
import { ClienteError } from "./errors/client-error"
import { ZodError } from "zod"
//Criando a tipagem do errorHandler
type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, requesr, reply) => {
    //Verifica se o erro é do tipo Zod(ou seja, se é um erro na validação do zod)
    if(error instanceof ZodError){
        return reply.status(400).send({
            message: 'Invalid input',
            erros: error.flatten().fieldErrors
        })
    }

    if(error instanceof ClienteError){
        return reply.status(400).send({
            message: error.message
        })
    }
    return reply.status(500).send({ message: 'Internal server error'})
}