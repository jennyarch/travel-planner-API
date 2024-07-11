
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import { dayjs } from "../lib/dayjs";
import nodemailer from 'nodemailer';
import { ClienteError } from "../errors/client-error";
import { env } from "../env";

export async function confirmTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            })
        },
    }, async (request, reply) => {
        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId,
            },
            include: {//O prisma permite fazer joins, onde consigo trazer uma viagem co o ID e trazer todos os partivipantes dela
                participants: {
                    where: {
                        is_owner: false
                    }
                }
            }
        })

        if(!trip){
            throw new ClienteError('Trip not found')
        }

        if(trip.is_confirmed){
            //o reply que é um metodo do fastify, vai meio que redirecionar caso a viagem já tenha sido confirmada para o frontend passando o url da pagina de viagens
            return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
        }

        //Se a viagen ainda não foi confirmada, agora vai atualizar as informações abaixo
        await prisma.trip.update({
            where: { id: tripId },
            data: { is_confirmed: true }
        })

        //Buscar todos os particapante da viagem/no entando no includes tbm posso fazer exatamente o que estou fazendo aqui(fica como exemplo para estudo)
        // const participants = await prisma.participant.findMany({
        //     where: {
        //         trip_id: tripId,
        //         is_owner: false
        //     }
        // })

        //Agora envia email para todos os participantes da viagem
        const formattedStartDate = dayjs(trip.starts_at).format('LL')
        const formattedEndDate = dayjs(trip.ends_at).format('LL')


        const mail = await getMailClient()

        // * Dessa forma ele irá enviar 1 email por vez, para todos os participantes
        // for(const participant of trip.participants){
        //     await mail.sendMail()
        // }

        await Promise.all(
            trip.participants.map(async (participant) => {

                const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`


                const message = await mail.sendMail({
                    from: {
                        name: 'Equipe plann.er',
                        address: 'oi@plann.er',
                    },
                    to: participant.email,
                    subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartDate}`,
                    html: `
                        <div style="font-family: sans-serif; font-size:  16px; line-height: 1.6;">
                            <p>Você foi convidado para participar de uma viagem para <strong>${trip.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong></p>
                            <p></p>
                            <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
                            <p></p>
                            <p>
                                <a href="${confirmationLink}">Confirmar viagem</a>
                            </p>
                            <p></p>
                            <p>você saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p> 
                        </div>
                    `.trim()
                })

                console.log(nodemailer.getTestMessageUrl(message))
            })
        )

        //Tbm redireciona o usuario para a pagina da viagem
        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
    })
}