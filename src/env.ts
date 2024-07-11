import { eventNames } from 'process';
import { z } from 'zod';

const envSchema = z.object({
    DATA_BASE_URL: z.string().url(),
    API_BASE_URL: z.string().url(),
    WEB_BASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3333),
})
//o Uso do coerce nesse cenario converteo numero em uma string(devido ao entendimento da variavel de ambiente ser em string e nisso o zod pode acionar erro devido a não reconhecer o valor setado com number.)

//process.env é baseicamente de onde vem as minhas variaveis de ambiente(ela é uma vaiavel global do node.js)
export const env = envSchema.parse(process.env)