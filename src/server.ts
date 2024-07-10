import fastify from "fastify";
import cors from "@fastify/cors";
import { createtrip } from "./routes/create-trip";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirm-trip";
import { confirmParticipants } from "./routes/confirm-participant";
import { createActivity } from "./routes/create-activity";
import { getActivities } from "./routes/get-activities";
import { createLink } from "./routes/create-link";
import { getLinks } from "./routes/get-links";
import { getParticipants } from "./routes/get-participants";
import { createInvite } from "./routes/create-invite";
import { uptadeTrip } from "./routes/update-trip";
import { getTripDetails } from "./routes/get-trip-details";
import { getParticipant } from "./routes/get-participant";

const app = fastify()

app.register(cors, {
    origin: '*' // dessa maneira podemos informar o caminho do meu frontend, ou passando apenas o * para indicar que qualquer caminho pode consumir os dados da minha api
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(createtrip)
app.register(confirmTrip)
app.register(confirmParticipants)
app.register(createActivity)
app.register(getActivities)
app.register(createLink)
app.register(getLinks)
app.register(getParticipants)
app.register(createInvite)
app.register(uptadeTrip)
app.register(getTripDetails)
app.register(getParticipant)

app.listen({ port: 3333 }).then(() => {
    console.log('Server running!')
});