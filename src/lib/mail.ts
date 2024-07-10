import nodemailer from 'nodemailer';

export async function getMailClient(){
    //Cria um servidor de email fake para simular o envio de emails da aplicação
    const account = await nodemailer.createTestAccount()

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: account.user,
            pass: account.pass,
        }
    })

    return transporter;
}
