import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { getMailClient } from  "../lib/mail";
import { dayjs } from "../lib/dayjs";
import { ClienteError } from "../errors/client-error";
import { env } from "../env";

export async function createtrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string().min(4),
                starts_at: z.coerce.date(),//para tentar converter a data já para o padrão
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email()),
            })
        },
    }, async (request) => {
        const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body

        // Validando quando a data de inicio for menor que a data fim com o dayjs
        if(dayjs(starts_at).isBefore(new Date())){
            throw new ClienteError('Invalid trip stat date')
        }

        if(dayjs(ends_at).isBefore(starts_at)){
            throw new ClienteError('Invalid trip end date')
        }
        
        //Criando a viajem
        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at,
                participants: {
                    createMany: {
                        data: [
                            {
                                name: owner_name,
                                email: owner_email,
                                is_owner: true,
                                is_confirmed: true
                            },
                            //adiciona o email to invite para cada data na criação dos participants
                            ...emails_to_invite.map(email => {
                                return { email }
                            })
                        ],
                    }
                }
            }
        })

        const formattedStartDate = dayjs(starts_at).format('LL')
        const formattedEndDate = dayjs(ends_at).format('LL')

        const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe plann.er',
                address: 'oi@plann.er',
            },
            to: {
                name: owner_name,
                address: owner_email,
            },
            subject: `Confirme sua viagem para ${destination} em ${formattedStartDate}`,
            html: `
                <div style="font-family: sans-serif; font-size:  16px; line-height: 1.6;">
                    <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong></p>
                    <p></p>
                    <p>Para confirmar sua viagem, clique no link abaixo:</p>
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

        return  { tripId: trip.id }
    })
}