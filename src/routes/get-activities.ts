import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClienteError } from "../errors/client-error";

export async function getActivities(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activities', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
        },
    }, async (request) => {
        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { 
                activities: {
                    orderBy: {
                        occurs_at: 'asc'
                    }
                }
            },
        })

        if(!trip){
            throw new ClienteError('Trip not found')
        }

        //Retorno mais elaborado e organizado, fazemos dessa forma abaixo
        //Esta vairiavel retorna com o uso do (diff) a diferença entre duas datas em (dias)
        const differenceInDayBetweenTripStartAndEnd = dayjs(trip.ends_at).diff(trip.starts_at, 'days')

        //Nesse array de atividades cria uma tamanho baseado nos seus indexes, para acrescentar para cada posiçã a data corrente da atividade.
        const activities = Array.from({ length: differenceInDayBetweenTripStartAndEnd + 1 }).map((_, index) => {
            const date = dayjs(trip.starts_at).add(index, 'days')

            return {
                date: date.toDate(),
                activivites: trip.activities.filter(activity => {
                    //O isSame informe/retorna se a data corrente é a mesma da data criada pelas posições do array de activities baseado no (ano, mes e dia)
                    return dayjs(activity.occurs_at).isSame(date, 'day')
                })
            }
        })

        return  { activities }
    })
}