import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClienteError } from "../errors/client-error";

export async function uptadeTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                destination: z.string().min(4),
                starts_at: z.coerce.date(),//para tentar converter a data já para o padrão
                ends_at: z.coerce.date(),
            })
        },
    }, async (request) => {
        const { tripId } = request.params
        const { destination, starts_at, ends_at } = request.body

        const trip = await prisma.trip.findUnique({
            where: { id: tripId }
        })

        if(!trip){
            throw new ClienteError('Trip not found')
        }

        if(dayjs(starts_at).isBefore(new Date())){
            throw new ClienteError('Invalid trip stat date')
        }

        if(dayjs(ends_at).isBefore(starts_at)){
            throw new ClienteError('Invalid trip end date')
        }
        
        await prisma.trip.update({
            where: { id: tripId },
            data: {
                destination,
                starts_at,
                ends_at
            },
        })

        return  { tripId: trip.id }
    })
}