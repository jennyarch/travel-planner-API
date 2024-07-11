import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClienteError } from "../errors/client-error";

export async function getParticipants(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/participants', {
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
                participants: {
                    select: { //realizando um select(como no banco de dados) para trazer todas essas informações listadas
                        id: true,
                        name: true,
                        email: true,
                        is_confirmed: true
                    }
                },
            },
        })

        if(!trip){
            throw new ClienteError('Trip not found')
        }

        return  { participants: trip.participants }
    })
}